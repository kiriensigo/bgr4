"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Grid,
  Box,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useAuth } from "../../../../contexts/AuthContext";
import { getGame, type Game } from "../../../../lib/api";
import GameCard from "../../../../components/GameCard";
import Link from "next/link";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

interface RelatedGamesPageProps {
  params: {
    id: string;
  };
}

interface ExtendedGame extends Game {
  expansions?: Array<{ id: string; name: string }>;
  baseGame?: { id: string; name: string };
}

export default function RelatedGamesPage({ params }: RelatedGamesPageProps) {
  const { getAuthHeaders } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mainGame, setMainGame] = useState<ExtendedGame | null>(null);
  const [relatedGames, setRelatedGames] = useState<ExtendedGame[]>([]);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        setError(null);

        // メインゲームを取得
        const headers = getAuthHeaders();
        const gameData = (await getGame(params.id, headers)) as ExtendedGame;
        setMainGame(gameData);

        const relatedGameIds: string[] = [];
        const relatedGamesData: ExtendedGame[] = [];

        // 拡張ゲームのIDを収集
        if (gameData.expansions && gameData.expansions.length > 0) {
          gameData.expansions.forEach((expansion) => {
            relatedGameIds.push(expansion.id);
          });
        }

        // ベースゲームのIDを収集
        if (gameData.baseGame) {
          relatedGameIds.push(gameData.baseGame.id);
        }

        // 関連ゲームを取得
        for (const id of relatedGameIds) {
          try {
            const relatedGameData = (await getGame(
              id,
              headers
            )) as ExtendedGame;
            relatedGamesData.push(relatedGameData);
          } catch (err) {
            console.error(`関連ゲーム(ID: ${id})の取得に失敗しました:`, err);
            // 個別のゲーム取得エラーはスキップして続行
          }
        }

        setRelatedGames(relatedGamesData);
      } catch (err) {
        console.error("関連ゲームの取得中にエラーが発生しました:", err);
        setError(
          err instanceof Error ? err.message : "予期せぬエラーが発生しました"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [params.id, getAuthHeaders]);

  if (loading) {
    return (
      <Container sx={{ py: 4, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>関連ゲーム情報を読み込み中...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!mainGame) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="warning">ゲームが見つかりませんでした</Alert>
      </Container>
    );
  }

  const allGames = [mainGame, ...relatedGames];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Link href={`/games/${params.id}`} style={{ textDecoration: "none" }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <ArrowBackIcon sx={{ mr: 1 }} />
            <Typography variant="body1">ゲーム詳細に戻る</Typography>
          </Box>
        </Link>
        <Typography variant="h4" component="h1" gutterBottom>
          {mainGame.japanese_name || mainGame.name}の関連ゲーム
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          このゲームとその拡張・関連ゲームの一覧です
        </Typography>
      </Box>

      {allGames.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography>関連ゲームが見つかりませんでした</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {allGames.map((game) => (
            <Grid item key={game.id} xs={12} sm={6} md={4} lg={3}>
              <GameCard game={game} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
