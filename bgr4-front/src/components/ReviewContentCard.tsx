"use client";

import {
  Box,
  Typography,
  Avatar,
  Rating,
  CardContent,
  Divider,
} from "@mui/material";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import LikeButton from "./LikeButton";

interface ReviewContentCardProps {
  review: {
    id: number;
    overall_score: number | string;
    short_comment: string;
    created_at: string;
    likes_count: number;
    liked_by_current_user: boolean;
    user: {
      id: number;
      name: string;
      image?: string;
    };
  };
  showLikeButton?: boolean;
  showDivider?: boolean;
  maxCommentLines?: number;
}

/**
 * レビュー内容を表示するコンポーネント
 *
 * @param review - レビュー情報
 * @param showLikeButton - いいねボタンを表示するかどうか
 * @param showDivider - 区切り線を表示するかどうか
 * @param maxCommentLines - コメントの最大行数
 */
export default function ReviewContentCard({
  review,
  showLikeButton = true,
  showDivider = true,
  maxCommentLines = 2,
}: ReviewContentCardProps) {
  const numScore =
    typeof review.overall_score === "string"
      ? parseFloat(review.overall_score)
      : review.overall_score;

  return (
    <CardContent sx={{ pt: showDivider ? 0 : 2 }}>
      {showDivider && <Divider sx={{ my: 1 }} />}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Rating value={numScore / 2} precision={0.5} size="small" readOnly />
          <Typography variant="body2" color="text.secondary">
            {numScore.toFixed(1)}
          </Typography>
        </Box>

        {showLikeButton && (
          <LikeButton
            reviewId={review.id}
            initialLikesCount={review.likes_count}
            initialLikedByUser={review.liked_by_current_user}
          />
        )}
      </Box>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "-webkit-box",
          WebkitLineClamp: maxCommentLines,
          WebkitBoxOrient: "vertical",
          minHeight: `${1.5 * maxCommentLines}em`,
          mb: 1,
        }}
      >
        {review.short_comment}
      </Typography>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Avatar
          src={review.user.image}
          alt={review.user.name}
          sx={{ width: 24, height: 24 }}
        />
        <Typography variant="body2" color="text.secondary">
          <Link
            href={`/users/${review.user.id}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <span style={{ cursor: "pointer" }} className="hover-underline">
              {review.user.name}
            </span>
          </Link>
          {" ・ "}
          {formatDate(review.created_at)}
        </Typography>
      </Box>
    </CardContent>
  );
}
