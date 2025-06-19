"use client";

import { Box, CircularProgress } from "@mui/material";
import { Suspense } from "react";
import type { Game, Review } from "@/types/api";
import GridGameCard from "./cards/GridGameCard";
import MyReviewCard from "./cards/MyReviewCard";

type GameCardVariant = "grid" | "review";

type GameCardProps = {
  game: Game;
  variant?: GameCardVariant;
  review?: Review;
  enableSharing?: boolean;
};

const GameCard = ({
  game,
  variant = "grid",
  review,
  enableSharing,
}: GameCardProps) => {
  const players = `${game.min_players} - ${game.max_players}人`;
  const playTime = `${game.min_play_time} - ${game.max_play_time}分`;
  const imageUrl = game.image_url ?? game.thumbnail_url;
  const displayName = game.japanese_name || game.name;
  const hasRating =
    game.average_rating !== undefined && game.average_rating !== null;

  const renderCard = () => {
    switch (variant) {
      case "grid":
        return (
          <GridGameCard
            game={game}
            linkHref={`/games/${game.id}`}
            imageUrl={imageUrl}
            displayName={displayName}
            hasRating={hasRating}
            rating={game.average_rating}
            reviewsCount={game.reviews_count || 0}
            players={players}
            playTime={playTime}
          />
        );
      case "review":
        if (!review) {
          return <div>レビュー情報がありません。</div>;
        }
        return (
          <MyReviewCard
            game={game}
            review={review}
            linkHref={`/games/${game.id}`}
            reviewHref={`/reviews/${review.id}/edit`}
            imageUrl={imageUrl}
            displayName={displayName}
            enableSharing={enableSharing}
          />
        );
      default:
        return (
          <GridGameCard
            game={game}
            linkHref={`/games/${game.id}`}
            imageUrl={imageUrl}
            displayName={displayName}
            hasRating={hasRating}
            rating={game.average_rating}
            reviewsCount={game.reviews_count || 0}
            players={players}
            playTime={playTime}
          />
        );
    }
  };

  return (
    <Suspense
      fallback={
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
          }}
        >
          <CircularProgress />
        </Box>
      }
    >
      {renderCard()}
    </Suspense>
  );
};

export default GameCard;
