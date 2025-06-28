"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Avatar,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Chip,
  Rating,
} from "@mui/material";

import Link from "next/link";
import { useAuth } from "../../../contexts/AuthContext";

// キャッシュ用のオブジェクト
const pageCache: Record<
  string,
  { user: any; reviews: any[]; timestamp: number }
> = {};
// キャッシュの有効期限（5分）
const CACHE_EXPIRY = 5 * 60 * 1000;

interface User {
  id: number;
  name: string;
  bio?: string;
  avatar_url?: string;
}

interface Review {
  id: number;
  overall_score: number | string;
  short_comment: string;
  created_at: string;
  likes_count: number;
  game: {
    id: number;
    bgg_id: string;
    name: string;
    japanese_name?: string;
    image_url: string;
    min_players: number;
    max_players: number;
    play_time: number;
    average_score: number;
  };
}

// スコアを表示するためのヘルパー関数
const formatScore = (score: number | string | null | undefined): string => {
  if (score === null || score === undefined) return "未評価";
  const numScore = typeof score === "string" ? parseFloat(score) : score;
  return Number.isNaN(numScore) ? "未評価" : numScore.toFixed(1);
};

export default function UserProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const { user, getAuthHeaders } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // データ取得関数をuseCallbackでメモ化
  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // キャッシュをチェック
      const cacheKey = `user-${params.id}`;
      const cachedData = pageCache[cacheKey];
      const now = Date.now();

      // 有効なキャッシュがある場合はそれを使用
      if (cachedData && now - cachedData.timestamp < CACHE_EXPIRY) {
        console.log("Using cached user profile data");
        setProfileUser(cachedData.user);
        setReviews(cachedData.reviews);
        setLoading(false);
        return;
      }

      // ユーザー情報を取得
      const userResponse = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
        }/api/v1/users/${params.id}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(user ? getAuthHeaders() : {}),
          },
        }
      );

      if (!userResponse.ok) {
        throw new Error("ユーザー情報の取得に失敗しました");
      }

      const userData = await userResponse.json();
      setProfileUser(userData);

      // ユーザーのレビュー一覧を取得
      const reviewsResponse = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
        }/api/v1/users/${params.id}/reviews`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(user ? getAuthHeaders() : {}),
          },
        }
      );

      if (!reviewsResponse.ok) {
        throw new Error("レビュー情報の取得に失敗しました");
      }

      const reviewsData = await reviewsResponse.json();
      setReviews(reviewsData);

      // キャッシュに保存
      pageCache[cacheKey] = {
        user: userData,
        reviews: reviewsData,
        timestamp: now,
      };
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setError(
        err instanceof Error ? err.message : "予期せぬエラーが発生しました"
      );
    } finally {
      setLoading(false);
    }
  }, [params.id, user, getAuthHeaders]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !profileUser) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || "ユーザーが見つかりませんでした"}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* ユーザープロフィール */}
      <Paper sx={{ p: 4, mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "center", sm: "flex-start" },
            gap: 3,
          }}
        >
          <Avatar
            src={profileUser.avatar_url}
            alt={profileUser.name}
            sx={{ width: 120, height: 120 }}
          />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              {profileUser.name}
            </Typography>
            {profileUser.bio && (
              <Typography
                variant="body1"
                sx={{ mt: 2, whiteSpace: "pre-wrap" }}
              >
                {profileUser.bio}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              投稿レビュー数: {reviews.length}件
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* レビュー一覧 */}
      <Typography variant="h5" component="h2" gutterBottom>
        投稿したレビュー
      </Typography>

      {reviews.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography>まだレビューがありません</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {reviews.map((review) => (
            <Grid item xs={12} sm={6} md={4} key={review.id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition:
                    "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 4,
                  },
                }}
              >
                <CardActionArea
                  component={Link}
                  href={`/games/${review.game.bgg_id}`}
                  sx={{ flexGrow: 1 }}
                >
                  <CardMedia
                    component="img"
                    image={review.game.image_url || "/images/no-image.png"}
                    alt={review.game.name}
                    sx={{
                      aspectRatio: "1",
                      objectFit: "contain",
                      bgcolor: "grey.100",
                    }}
                  />
                  <CardContent>
                    <Typography
                      gutterBottom
                      variant="h6"
                      component="h2"
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        minHeight: "3.6em",
                      }}
                    >
                      {review.game.japanese_name || review.game.name}
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <Rating
                        value={
                          typeof review.overall_score === "string"
                            ? parseFloat(review.overall_score) / 2
                            : review.overall_score / 2
                        }
                        precision={0.5}
                        size="small"
                        readOnly
                      />
                      <Typography variant="body2" color="text.secondary">
                        {formatScore(review.overall_score)}
                      </Typography>
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        minHeight: "3em",
                      }}
                    >
                      {review.short_comment}
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mt: 1,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {new Date(review.created_at).toLocaleDateString()}
                      </Typography>
                      <Chip
                        label={`♥ ${review.likes_count}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
