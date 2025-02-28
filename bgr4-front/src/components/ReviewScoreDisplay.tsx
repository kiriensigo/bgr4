"use client";

import { Box, Typography, Rating } from "@mui/material";

interface ReviewScoreDisplayProps {
  score: number | string;
  userName: string;
  variant?: "default" | "compact" | "large";
}

/**
 * レビュースコアを表示するコンポーネント
 *
 * @param score - レビュースコア（10点満点）
 * @param userName - レビュー投稿者名
 * @param variant - 表示バリエーション（default, compact, large）
 */
export default function ReviewScoreDisplay({
  score,
  userName,
  variant = "default",
}: ReviewScoreDisplayProps) {
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
          score: { fontSize: "0.875rem" },
          rating: { fontSize: "0.8rem" },
          userName: { fontSize: "0.75rem", marginLeft: "0.5rem" },
        };
      case "large":
        return {
          container: { flexDirection: "row", alignItems: "center", gap: 2 },
          score: { fontSize: "1.25rem", fontWeight: "bold" },
          rating: { fontSize: "1.25rem" },
          userName: { fontSize: "1rem", marginLeft: "1rem" },
        };
      default:
        return {
          container: { flexDirection: "row", alignItems: "center", gap: 1 },
          score: { fontSize: "1rem" },
          rating: { fontSize: "1rem" },
          userName: { fontSize: "0.875rem", marginLeft: "0.75rem" },
        };
    }
  };

  const styles = getStyles();

  return (
    <Box
      sx={{
        display: "flex",
        ...styles.container,
      }}
    >
      <Rating
        value={ratingValue}
        precision={0.5}
        size={variant === "large" ? "medium" : "small"}
        readOnly
      />
      <Typography variant="body2" color="text.secondary" sx={styles.score}>
        {validScore.toFixed(1)}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={styles.userName}>
        by {userName}
      </Typography>
    </Box>
  );
}
