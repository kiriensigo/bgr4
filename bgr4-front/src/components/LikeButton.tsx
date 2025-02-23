"use client";

import { useState } from "react";
import { IconButton, Typography, Box } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

type LikeButtonProps = {
  reviewId: number;
  initialLikesCount: number;
  initialLikedByUser: boolean;
};

export default function LikeButton({
  reviewId,
  initialLikesCount,
  initialLikedByUser,
}: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialLikedByUser);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLoading, setIsLoading] = useState(false);
  const { getAuthHeaders, user } = useAuth();

  const handleLike = async () => {
    if (!user) {
      // ログインしていない場合はログインページにリダイレクト
      window.location.href = `/login?redirect=${encodeURIComponent(
        window.location.pathname
      )}`;
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/v1/reviews/${reviewId}/${isLiked ? "unlike" : "like"}`,
        {
          method: isLiked ? "DELETE" : "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "いいねの処理に失敗しました");
      }

      const data = await response.json();
      setIsLiked(!isLiked);
      setLikesCount(data.likes_count);
    } catch (error) {
      console.error("いいねエラー:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <IconButton
        onClick={handleLike}
        disabled={isLoading}
        size="small"
        color={isLiked ? "error" : "default"}
      >
        {isLiked ? (
          <FavoriteIcon fontSize="small" />
        ) : (
          <FavoriteBorderIcon fontSize="small" />
        )}
      </IconButton>
      <Typography variant="body2" color="text.secondary">
        {likesCount}
      </Typography>
    </Box>
  );
}
