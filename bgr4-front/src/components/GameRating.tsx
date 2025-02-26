import { Box, Rating, Typography } from "@mui/material";

interface GameRatingProps {
  score: number | null | undefined;
  reviewsCount?: number;
  size?: "small" | "medium" | "large";
}

const getNumericScore = (score: number | string | null | undefined): number => {
  if (score === null || score === undefined) return 0;
  const numScore = typeof score === "string" ? parseFloat(score) : score;
  return Number.isNaN(numScore) ? 0 : numScore;
};

export default function GameRating({
  score,
  reviewsCount,
  size = "small",
}: GameRatingProps) {
  const numericScore = getNumericScore(score);

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Rating value={numericScore / 2} precision={0.5} readOnly size={size} />
      <Typography variant="body2">
        {numericScore.toFixed(1)}
        {reviewsCount !== undefined && ` (${reviewsCount}件)`}
      </Typography>
    </Box>
  );
}
