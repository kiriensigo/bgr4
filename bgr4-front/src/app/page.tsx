"use client";

import { useEffect, useState } from "react";
import { getHotGames } from "@/lib/bggApi";
import {
  Typography,
  Grid,
  Container,
  Box,
  CircularProgress,
} from "@mui/material";
import Link from "next/link";
import GameCard from "@/components/GameCard";
import { getGame, registerGame } from "@/lib/api";

interface BGGGame {
  id: string;
  name: string;
  description: string;
  image: string;
  minPlayers: number;
  maxPlayers: number;
  minPlayTime: number;
  maxPlayTime: number;
  yearPublished?: number;
  averageRating?: number;
  mechanics?: string[];
  categories?: string[];
  weight: number;
  bestPlayers: string[];
  recommendedPlayers: string[];
}

interface Review {
  overall_score: number;
  rule_complexity: number;
  luck_factor: number;
  interaction: number;
  downtime: number;
}

interface GameWithReviews extends BGGGame {
  average_score: number | null;
  reviews_count: number;
  reviews: Review[];
}

// レビューの平均点を計算する関数
// この関数はバックエンドから取得した平均点がない場合のフォールバックとして使用
const calculateAverageScores = (reviews: Review[]) => {
  if (!reviews || reviews.length === 0) return null;

  const validReviews = reviews.filter((review) => review.overall_score);

  if (validReviews.length === 0) return null;

  return {
    overall_score: Number(
      (
        validReviews.reduce((sum, r) => sum + r.overall_score, 0) /
        validReviews.length
      ).toFixed(1)
    ),
  };
};

export default function Home() {
  const [hotGames, setHotGames] = useState<GameWithReviews[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        // まずBGGのゲーム情報だけを表示
        const bggGames = await getHotGames();
        setHotGames(
          bggGames.map((game) => ({
            ...game,
            average_score: game.averageRating || null,
            reviews_count: 0,
            reviews: [],
          })) as GameWithReviews[]
        );
        setLoading(false);

        // その後、レビュー情報を順次取得して更新
        for (const game of bggGames) {
          try {
            // ゲーム情報の取得を試みる
            let gameData;
            try {
              gameData = await getGame(game.id);
            } catch (error) {
              // ゲームがデータベースに存在しない場合は登録する
              console.log(
                `Game ${game.id} not found in database, registering...`
              );
              try {
                // ゲームを登録
                gameData = await registerGame(
                  {
                    id: game.id,
                    name: game.name,
                    description: game.description,
                    image: game.image,
                    minPlayers: game.minPlayers,
                    maxPlayers: game.maxPlayers,
                    minPlayTime: game.minPlayTime,
                    maxPlayTime: game.maxPlayTime,
                    averageRating: game.averageRating,
                    weight: game.weight,
                    bestPlayers: game.bestPlayers,
                    recommendedPlayers: game.recommendedPlayers,
                  },
                  undefined,
                  true
                );
                console.log(`Game ${game.id} registered successfully`);
              } catch (registerError) {
                console.log(
                  `Failed to register game ${game.id}:`,
                  registerError
                );
                // 登録に失敗した場合はBGGのデータだけを使用
                gameData = {
                  reviews: [],
                  average_score: null,
                  reviews_count: 0,
                };
              }
            }

            const averageScores = calculateAverageScores(
              gameData.reviews || []
            );

            // デバッグ情報を出力
            console.log(`Game ${game.id} data:`, {
              backendScore: gameData.average_score,
              calculatedScore: averageScores?.overall_score,
              bggScore: game.averageRating,
              reviewsCount: gameData.reviews ? gameData.reviews.length : 0,
            });

            setHotGames((prevGames) =>
              prevGames.map((prevGame) =>
                prevGame.id === game.id
                  ? ({
                      ...prevGame,
                      average_score:
                        gameData.average_score ||
                        averageScores?.overall_score ||
                        game.averageRating ||
                        null,
                      reviews_count: gameData.reviews
                        ? gameData.reviews.length
                        : 0,
                      reviews: gameData.reviews || [],
                      min_play_time: gameData.min_play_time || game.minPlayTime,
                    } as GameWithReviews)
                  : prevGame
              )
            );
          } catch (error) {
            // エラーをログに記録するが、ユーザーには表示しない
            console.log(
              `Error processing game ${game.id}, using BGG data only:`,
              error
            );
          }
        }
      } catch (err) {
        setError("ゲームの取得に失敗しました");
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography color="error" align="center" sx={{ py: 8 }}>
          {error}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        人気のボードゲーム
      </Typography>

      <Grid container spacing={3}>
        {hotGames.map((game) => (
          <Grid item xs={12} sm={6} md={4} key={game.id}>
            <GameCard
              game={{
                id: game.id,
                bgg_id: game.id,
                name: game.name,
                image_url: game.image,
                average_score: game.average_score,
                min_players: game.minPlayers,
                max_players: game.maxPlayers,
                play_time: game.maxPlayTime,
                min_play_time: game.minPlayTime,
                reviews_count: game.reviews_count,
              }}
              type="game"
              useOverallScoreDisplay={true}
              showOverallScoreOverlay={true}
              overallScoreVariant="compact"
            />
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 6, textAlign: "center" }}>
        <Link href="/games" style={{ textDecoration: "none" }}>
          <Typography
            variant="h6"
            color="primary"
            sx={{
              cursor: "pointer",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            すべてのゲームを見る →
          </Typography>
        </Link>
      </Box>
    </Container>
  );
}
