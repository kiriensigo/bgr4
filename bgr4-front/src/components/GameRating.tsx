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

  // サイズに応じたタイポグラフィのバリアントを設定
  const scoreVariant =
    size === "large" ? "h5" : size === "medium" ? "h6" : "body1";

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Rating value={numericScore / 2} precision={0.5} readOnly size={size} />
      {reviewsCount !== undefined ? (
        <Typography variant="body2" color="text.secondary">
          {reviewsCount}件
        </Typography>
      ) : null}
    </Box>
  );
}
