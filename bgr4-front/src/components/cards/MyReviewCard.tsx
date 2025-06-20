"use client";

import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Avatar,
  Box,
  Rating,
  Divider,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import EditIcon from "@mui/icons-material/Edit";
import { useAuth } from "@/contexts/AuthContext";

// レビューオブジェクトの型定義
interface Review {
  id: number;
  user: {
    id: number;
    name: string;
    image?: string;
  };
  game: {
    id: string;
    name: string;
    japanese_name?: string;
    image_url?: string;
  };
  overall_score: number;
  short_comment: string;
  created_at: string;
}

interface MyReviewCardProps {
  review: Review;
}

const MyReviewCard: React.FC<MyReviewCardProps> = ({ review }) => {
  const { user: currentUser } = useAuth();

  if (!review) {
    return null;
  }

  const { user, game, overall_score, short_comment, created_at } = review;

  return (
    <Card sx={{ display: "flex", mb: 2, width: "100%" }}>
      <Box
        sx={{
          p: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: 120,
        }}
      >
        <Link href={`/games/${game.id}`} passHref>
          <Box
            component="img"
            sx={{
              width: 80,
              height: 80,
              objectFit: "cover",
              borderRadius: 1,
              cursor: "pointer",
            }}
            src={game.image_url || "/images/no-image.png"}
            alt={game.japanese_name || game.name}
          />
        </Link>
      </Box>
      <Box sx={{ flex: 1, p: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Link href={`/games/${game.id}`} passHref>
            <Typography variant="h6" component="div" sx={{ cursor: "pointer" }}>
              {game.japanese_name || game.name}
            </Typography>
          </Link>
          {currentUser?.id === user.id && (
            <Tooltip title="レビューを編集">
              <Link href={`/games/${game.id}/review`} passHref>
                <IconButton size="small">
                  <EditIcon />
                </IconButton>
              </Link>
            </Tooltip>
          )}
        </Box>
        <Divider sx={{ my: 1 }} />
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <Rating value={overall_score} precision={0.5} readOnly />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            ({overall_score.toFixed(1)})
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {short_comment}
        </Typography>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Link href={`/users/${user.id}`} passHref>
              <Avatar
                src={user.image}
                alt={user.name}
                sx={{ width: 24, height: 24, cursor: "pointer" }}
              />
            </Link>
            <Link href={`/users/${user.id}`} passHref>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ ml: 1, cursor: "pointer" }}
              >
                {user.name}
              </Typography>
            </Link>
          </Box>
          <Typography variant="caption" color="text.secondary">
            {formatDate(created_at)}
          </Typography>
        </Box>
      </Box>
    </Card>
  );
};

export default MyReviewCard;
