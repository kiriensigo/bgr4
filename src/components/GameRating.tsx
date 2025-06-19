"use client";

import { Box, Rating, Typography } from "@mui/material";

interface GameRatingProps {
  score: number | undefined | null;
  reviewsCount: number;
  size?: "small" | "medium" | "large";
}

const GameRating = ({
  score,
  reviewsCount,
  size = "medium",
}: GameRatingProps) => {
  if (score === null || score === undefined) {
    return (
      <Typography variant="caption" color="text.secondary">
        評価なし
      </Typography>
    );
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Rating
        name="read-only"
        value={score}
        precision={0.1}
        readOnly
        size={size}
      />
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ ml: 1, mt: "2px" }}
      >
        ({reviewsCount})
      </Typography>
    </Box>
  );
};

export default GameRating;
