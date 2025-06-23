"use client";

import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  IconButton,
  Tooltip,
} from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import EditIcon from "@mui/icons-material/Edit";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";
import GameRating from "./GameRating";
import OverallScoreDisplay from "./OverallScoreDisplay";
import { useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import GroupIcon from "@mui/icons-material/Group";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import Rating from "@mui/material/Rating";
import ShareToTwitterButton from "./ShareToTwitterButton";
import ShareIcon from "@mui/icons-material/Share";
import React from "react";
import type { Game, Review } from "@/types/api";
import CompactGameCard from "./cards/CompactGameCard";
import ReviewGameCard from "./cards/ReviewGameCard";
import ListGameCard from "./cards/ListGameCard";

interface GameCardProps {
  game: Game;
  review?: Review;
  type: "game" | "review";
  useOverallScoreDisplay?: boolean;
  overallScoreVariant?: "default" | "compact" | "large";
  showOverallScoreOverlay?: boolean;
  onReviewUpdated?: () => void;
  variant?: "list" | "grid" | "search" | "review" | "carousel";
  enableSharing?: boolean;
}

export default function GameCard({
  game,
  review,
  type,
  useOverallScoreDisplay = false,
  overallScoreVariant = "compact",
  showOverallScoreOverlay = false,
  onReviewUpdated,
  variant = "list",
  enableSharing = true,
}: GameCardProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const imageUrl = game.japanese_image_url || game.image_url || game.thumbnail;
  const displayName = game.japanese_name || game.name;
  const rating = type === "review" ? review?.overall_score : game.average_score;
  const minPlayers = game.minPlayers || game.min_players || "?";
  const maxPlayers = game.maxPlayers || game.max_players || "?";
  const players = `${minPlayers}〜${maxPlayers}人`;

  let playTime = "";
  const minPlayTime = game.min_play_time;
  const maxPlayTime = game.play_time || game.playingTime;

  if (minPlayTime && maxPlayTime && minPlayTime !== maxPlayTime) {
    playTime = `${minPlayTime}〜${maxPlayTime}分`;
  } else if (maxPlayTime) {
    playTime = `${maxPlayTime}分`;
  } else {
    playTime = "?分";
  }

  const linkHref = `/games/${game.bgg_id || game.id}`;
  const reviewHref = `/games/${game.bgg_id || game.id}/review`;
  const reviewsCount = game.reviews_count || 0;

  const hasRating = rating !== null && rating !== undefined && rating > 0;

  const handleOpenShareDialog = () => {
    setShowShareDialog(true);
  };

  const handleCloseShareDialog = () => {
    setShowShareDialog(false);
  };

  if (type === "review" && review) {
    return (
      <ReviewGameCard
        game={game}
        review={review}
        linkHref={linkHref}
        reviewHref={reviewHref}
        imageUrl={imageUrl}
        displayName={displayName}
        enableSharing={enableSharing}
        onReviewUpdated={onReviewUpdated}
      />
    );
  }

  if (variant === "grid" || variant === "search" || variant === "carousel") {
    return (
      <CompactGameCard
        game={game}
        linkHref={linkHref}
        imageUrl={imageUrl}
        displayName={displayName}
        hasRating={hasRating}
        rating={rating}
        reviewsCount={reviewsCount}
        players={players}
        playTime={playTime}
        useOverallScoreDisplay={useOverallScoreDisplay}
        overallScoreVariant={overallScoreVariant}
        showOverallScoreOverlay={showOverallScoreOverlay}
      />
    );
  }

  // Default to ListGameCard
  return (
    <ListGameCard
      game={game}
      linkHref={linkHref}
      imageUrl={imageUrl}
      displayName={displayName}
      hasRating={hasRating}
      rating={rating}
      players={players}
      playTime={playTime}
      minPlayTime={minPlayTime}
      maxPlayTime={maxPlayTime}
      reviewsCount={reviewsCount}
      useOverallScoreDisplay={useOverallScoreDisplay}
      overallScoreVariant={overallScoreVariant}
      showOverallScoreOverlay={showOverallScoreOverlay}
      reviewHref={reviewHref}
      enableSharing={enableSharing}
    />
  );
}
