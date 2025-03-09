"use client";

import { Box, Typography, Paper, Rating, Grid } from "@mui/material";
import { formatDate } from "@/lib/utils";
import LikeButton from "./LikeButton";
import Link from "next/link";

interface Review {
  id: number;
  user?: {
    id?: number;
    name?: string;
    image?: string;
  };
  overall_score: number | string;
  short_comment: string;
  created_at: string;
  likes_count: number;
  liked_by_current_user: boolean;
}

interface ReviewListProps {
  reviews: Review[];
}

const formatScore = (score: number | string | null | undefined): string => {
  if (score === null || score === undefined) return "未評価";
  const numScore = typeof score === "string" ? parseFloat(score) : score;
  // 0の場合は「未評価」と表示する（バックエンドでは評価値が存在しない場合に0を返している）
  return Number.isNaN(numScore) || numScore === 0
    ? "未評価"
    : numScore.toFixed(1);
};

export default function ReviewList({ reviews }: ReviewListProps) {
  // レビューが配列でない場合は空の配列として扱う
  const validReviews = Array.isArray(reviews) ? reviews : [];

  // デバッグ情報を出力
  console.log("ReviewList received reviews:", {
    reviews,
    validReviews,
    isArray: Array.isArray(reviews),
    length: validReviews.length,
    type: typeof reviews,
  });

  // 最初のレビューの詳細をログに出力（デバッグ用）
  if (validReviews.length > 0) {
    console.log("First review details:", {
      id: validReviews[0].id,
      user: validReviews[0].user,
      hasUser: !!validReviews[0].user,
      userKeys: validReviews[0].user ? Object.keys(validReviews[0].user) : [],
      score: validReviews[0].overall_score,
      comment: validReviews[0].short_comment,
    });
  }

  // レビューが存在しない場合
  if (!validReviews || validReviews.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: "center", bgcolor: "grey.50" }}>
        <Typography variant="body1" color="text.secondary">
          まだレビューがありません。最初のレビューを書いてみませんか？
        </Typography>
      </Paper>
    );
  }

  // 有効なレビューのみをフィルタリング
  const filteredReviews = validReviews.filter((review) => {
    if (!review) {
      console.warn("Review is null or undefined");
      return false;
    }

    if (!review.user) {
      console.warn(`Review ${review.id} has no user property:`, review);
      return false;
    }

    if (!review.user.id) {
      console.warn(`Review ${review.id} has user but no user.id:`, review.user);
      return false;
    }

    if (!review.user.name) {
      console.warn(
        `Review ${review.id} has user but no user.name:`,
        review.user
      );
      return false;
    }

    return true;
  });

  console.log(
    `Filtered ${validReviews.length} reviews to ${filteredReviews.length} valid reviews`
  );

  // フィルタリング後にレビューがない場合
  if (filteredReviews.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: "center", bgcolor: "grey.50" }}>
        <Typography variant="body1" color="text.secondary">
          表示できるレビューがありません。データが不完全な可能性があります。
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          元のレビュー数: {validReviews.length}、有効なレビュー数: 0
        </Typography>
      </Paper>
    );
  }

  // 最大10件のレビューに制限
  const limitedReviews = filteredReviews.slice(0, 10);

  return (
    <Grid container spacing={1}>
      {limitedReviews.map((review) => {
        const numScore =
          typeof review.overall_score === "string"
            ? parseFloat(review.overall_score)
            : review.overall_score;

        return (
          <Grid item xs={12} key={review.id}>
            <Paper
              sx={{
                p: 1.5,
                "&:hover": {
                  bgcolor: "grey.50",
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 0.5,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Link
                    href={`/users/${review.user?.id}`}
                    style={{ textDecoration: "none" }}
                  >
                    <Typography
                      variant="subtitle2"
                      color="primary"
                      sx={{
                        cursor: "pointer",
                        "&:hover": {
                          textDecoration: "underline",
                        },
                      }}
                    >
                      {review.user?.name}
                    </Typography>
                  </Link>
                  <Typography variant="body2">
                    {formatScore(review.overall_score)}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Rating
                    value={numScore / 2}
                    precision={0.5}
                    readOnly
                    size="small"
                  />
                </Box>
              </Box>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                {review.short_comment}
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <LikeButton
                  reviewId={review.id}
                  initialLikesCount={review.likes_count}
                  initialLikedByUser={review.liked_by_current_user}
                />
              </Box>
            </Paper>
          </Grid>
        );
      })}
      {filteredReviews.length > 10 && (
        <Grid item xs={12}>
          <Typography variant="body2" color="text.secondary" align="center">
            他に{filteredReviews.length - 10}件のレビューがあります
          </Typography>
        </Grid>
      )}
    </Grid>
  );
}
