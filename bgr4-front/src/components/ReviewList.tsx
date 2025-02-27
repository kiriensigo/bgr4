"use client";

import { Box, Typography, Paper, Rating, Grid } from "@mui/material";
import { formatDate } from "@/lib/utils";
import LikeButton from "./LikeButton";
import Link from "next/link";

interface Review {
  id: number;
  user: {
    id: number;
    name: string;
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
  return Number.isNaN(numScore) ? "未評価" : numScore.toFixed(1);
};

export default function ReviewList({ reviews }: ReviewListProps) {
  return (
    <Grid container spacing={2}>
      {reviews.map((review) => {
        const numScore =
          typeof review.overall_score === "string"
            ? parseFloat(review.overall_score)
            : review.overall_score;

        return (
          <Grid item xs={12} key={review.id}>
            <Paper
              sx={{
                p: 2,
                "&:hover": {
                  bgcolor: "grey.50",
                },
              }}
            >
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Box>
                  <Link
                    href={`/users/${review.user.id}`}
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
                      {review.user.name}
                    </Typography>
                  </Link>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(review.created_at)}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Rating
                    value={numScore / 2}
                    precision={0.5}
                    readOnly
                    size="small"
                  />
                  <Typography variant="body2">
                    {formatScore(review.overall_score)}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
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
    </Grid>
  );
}
