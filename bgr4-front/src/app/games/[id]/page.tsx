"use client";

import { useEffect, useState } from "react";
import { getGame } from "@/lib/api";
import {
  Container,
  Typography,
  Grid,
  Box,
  Paper,
  Button,
  Rating,
  Divider,
  CircularProgress,
  Chip,
} from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import GroupIcon from "@mui/icons-material/Group";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import StarIcon from "@mui/icons-material/Star";
import RateReviewIcon from "@mui/icons-material/RateReview";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import GameCard from "@/components/GameCard";
import ReviewList from "@/components/ReviewList";

interface APIGame {
  id: number;
  bgg_id: string;
  name: string;
  image_url: string;
  min_players: number;
  max_players: number;
  play_time: number;
  description: string;
  reviews: Review[];
  reviews_count: number;
  average_score: number | null | undefined;
  average_rule_complexity: number | null;
  average_luck_factor: number | null;
  average_interaction: number | null;
  average_downtime: number | null;
  recommended_players: string[];
}

type Game = APIGame;

interface Review {
  id: number;
  user: {
    id: number;
    name: string;
  };
  game_id: string;
  overall_score: number;
  play_time: number;
  rule_complexity: number;
  luck_factor: number;
  interaction: number;
  downtime: number;
  recommended_players: string[];
  mechanics: string[];
  tags: string[];
  custom_tags: string[];
  short_comment: string;
  created_at: string;
  likes_count: number;
  liked_by_current_user: boolean;
}

// レビューの平均点を計算する関数
const calculateAverageScores = (reviews: Review[]) => {
  if (!reviews || reviews.length === 0) return null;

  const validReviews = reviews.filter(
    (review) =>
      review.rule_complexity &&
      review.luck_factor &&
      review.interaction &&
      review.downtime
  );

  if (validReviews.length === 0) return null;

  return {
    rule_complexity: Number(
      (
        validReviews.reduce((sum, r) => sum + r.rule_complexity, 0) /
        validReviews.length
      ).toFixed(1)
    ),
    luck_factor: Number(
      (
        validReviews.reduce((sum, r) => sum + r.luck_factor, 0) /
        validReviews.length
      ).toFixed(1)
    ),
    interaction: Number(
      (
        validReviews.reduce((sum, r) => sum + r.interaction, 0) /
        validReviews.length
      ).toFixed(1)
    ),
    downtime: Number(
      (
        validReviews.reduce((sum, r) => sum + r.downtime, 0) /
        validReviews.length
      ).toFixed(1)
    ),
  };
};

// 人気のタグを集計する関数
const getPopularTags = (reviews: Review[]) => {
  if (!reviews || reviews.length === 0) return [];

  const tagCount = new Map<string, number>();
  reviews.forEach((review) => {
    [...review.tags, ...review.custom_tags].forEach((tag) => {
      tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
    });
  });

  return Array.from(tagCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);
};

// スコアを表示するためのヘルパー関数を修正
const formatScore = (score: number | string | null | undefined): string => {
  if (score === null || score === undefined) return "未評価";
  const numScore = typeof score === "string" ? parseFloat(score) : score;
  return Number.isNaN(numScore) ? "未評価" : numScore.toFixed(1);
};

const getNumericScore = (score: number | string | null | undefined): number => {
  if (score === null || score === undefined) return 0;
  const numScore = typeof score === "string" ? parseFloat(score) : score;
  return Number.isNaN(numScore) ? 0 : numScore;
};

export default function GamePage({ params }: { params: { id: string } }) {
  const [game, setGame] = useState<Game | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGameData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data: APIGame = await getGame(params.id);
        console.log("Fetched game data:", data);
        setGame(data);
      } catch (err) {
        console.error("Error fetching game:", err);
        setError(
          err instanceof Error ? err.message : "予期せぬエラーが発生しました"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [params.id]);

  if (loading) {
    return (
      <Container sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Paper sx={{ p: 3, textAlign: "center", bgcolor: "error.light" }}>
          <Typography color="error" variant="h6">
            {error}
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (!game) {
    return (
      <Container sx={{ py: 4 }}>
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography>ゲームが見つかりませんでした</Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Image
              src={game.image_url}
              alt={game.name}
              width={500}
              height={500}
              style={{ width: "100%", height: "auto" }}
            />
          </Grid>
          <Grid item xs={12} md={8}>
            <Typography variant="h4" component="h1" gutterBottom>
              {game.name}
            </Typography>

            {/* BGGリンク */}
            <Button
              variant="outlined"
              color="primary"
              href={`https://boardgamegeek.com/boardgame/${game.bgg_id}`}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<OpenInNewIcon />}
              sx={{ mb: 2 }}
            >
              Board Game Geekで詳細を見る
            </Button>

            {/* スコアと基本情報 */}
            <Paper sx={{ p: 3, mb: 3, bgcolor: "grey.50" }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <GroupIcon color="primary" />
                    <Typography>
                      {game.min_players}～{game.max_players}人
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <AccessTimeIcon color="primary" />
                    <Typography>{game.play_time}分</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* 評価スコア */}
            <Box sx={{ display: "flex", gap: 4, mb: 3 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  評価
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Rating
                    value={
                      game.average_score
                        ? getNumericScore(game.average_score) / 2
                        : 0
                    }
                    precision={0.5}
                    readOnly
                  />
                  <Typography variant="h6">
                    {formatScore(game.average_score)}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {game.reviews_count}件のレビュー
                </Typography>
              </Box>
            </Box>

            {/* おすすめプレイ人数 */}
            {game.recommended_players &&
              game.recommended_players.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    おすすめプレイ人数
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {game.recommended_players.map((count) => (
                      <Chip
                        key={count}
                        label={`${count}人`}
                        color="primary"
                        sx={{ m: 0.5 }}
                      />
                    ))}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    ※ レビュー投稿者の50%以上が推奨したプレイ人数です
                  </Typography>
                </Box>
              )}

            {/* レビュー評価の平均 */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                レビュー評価の平均
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    ルールの複雑さ
                  </Typography>
                  <Typography variant="body1">
                    {formatScore(game.average_rule_complexity)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    運要素
                  </Typography>
                  <Typography variant="body1">
                    {formatScore(game.average_luck_factor)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    相互作用
                  </Typography>
                  <Typography variant="body1">
                    {formatScore(game.average_interaction)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    ダウンタイム
                  </Typography>
                  <Typography variant="body1">
                    {formatScore(game.average_downtime)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            {/* 人気のタグを追加 */}
            {game.reviews && game.reviews.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  人気のタグ
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {getPopularTags(game.reviews).map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Box>
              </Box>
            )}

            <Divider sx={{ my: 4 }} />

            {/* レビューセクション */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6">レビュー</Typography>
              <Link
                href={`/games/${game.bgg_id}/review`}
                style={{ textDecoration: "none" }}
              >
                <Button
                  variant="outlined"
                  startIcon={<RateReviewIcon />}
                  size="small"
                >
                  レビューを書く
                </Button>
              </Link>
            </Box>

            {Array.isArray(game.reviews) ? (
              game.reviews.length > 0 ? (
                <ReviewList reviews={game.reviews} />
              ) : (
                <Paper sx={{ p: 3, textAlign: "center", bgcolor: "grey.50" }}>
                  <Typography variant="body1" color="text.secondary">
                    まだレビューがありません。最初のレビューを書いてみませんか？
                  </Typography>
                </Paper>
              )
            ) : (
              <Paper sx={{ p: 3, textAlign: "center", bgcolor: "grey.50" }}>
                <Typography variant="body1" color="text.secondary">
                  レビューを読み込み中...
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}
