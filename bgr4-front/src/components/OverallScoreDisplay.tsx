"use client";

import { Box, Typography, Rating, Paper } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";

interface OverallScoreDisplayProps {
  score: number | null;
  reviewsCount: number;
  variant?: "default" | "compact" | "large";
  showPaper?: boolean;
}

/**
 * 総合得点を表示するコンポーネント
 *
 * @param score - 総合得点（10点満点）
 * @param reviewsCount - レビュー件数
 * @param variant - 表示バリエーション（default, compact, large）
 * @param showPaper - 背景にPaperを表示するかどうか
 */
export default function OverallScoreDisplay({
  score,
  reviewsCount,
  variant = "default",
  showPaper = false,
}: OverallScoreDisplayProps) {
  // スコアが無効な場合は0として扱う
  const validScore =
    score !== null && !isNaN(Number(score)) && Number(score) > 0
      ? Number(score)
      : 0;

  // スコアが0の場合は何も表示しない
  if (validScore === 0) {
    return null;
  }

  // 5段階評価に変換（10点満点から5点満点へ）
  const ratingValue = validScore / 2;

  // バリエーションに応じたスタイルを設定
  const getStyles = () => {
    switch (variant) {
      case "compact":
        return {
          container: { flexDirection: "row", alignItems: "center", gap: 1 },
          score: { fontSize: "1rem", fontWeight: "bold" },
          rating: { fontSize: "0.8rem" },
          reviews: { fontSize: "0.75rem" },
        };
      case "large":
        return {
          container: { flexDirection: "column", alignItems: "center" },
          score: { fontSize: "2.5rem", fontWeight: "bold" },
          rating: { fontSize: "1.5rem" },
          reviews: { fontSize: "1rem" },
        };
      default:
        return {
          container: { flexDirection: "column", alignItems: "center" },
          score: { fontSize: "1.5rem", fontWeight: "bold" },
          rating: { fontSize: "1rem" },
          reviews: { fontSize: "0.875rem" },
        };
    }
  };

  const styles = getStyles();

  const content = (
    <Box
      sx={{
        display: "flex",
        ...styles.container,
        p: showPaper ? 2 : 0,
      }}
    >
      <Typography
        variant="h6"
        component="div"
        sx={{
          color: "primary.main",
          ...styles.score,
        }}
      >
        {validScore.toFixed(1)}
      </Typography>

      <Rating
        value={ratingValue}
        precision={0.5}
        readOnly
        emptyIcon={<StarIcon style={{ opacity: 0.55 }} fontSize="inherit" />}
        sx={{
          ...styles.rating,
        }}
      />

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          ...styles.reviews,
        }}
      >
        {reviewsCount}件のユーザーレビュー
      </Typography>
    </Box>
  );

  return showPaper ? <Paper elevation={1}>{content}</Paper> : content;
}
