"use client";

import React from "react";
import { Box, Typography, Rating } from "@mui/material";
import { designTokens, gameCardTokens } from "@/theme/tokens";
import { formatRatingScore } from "@/lib/gameUtils";

export interface GameRatingProps {
  /** レーティングスコア */
  score?: number | null;
  /** レビュー数 */
  reviewsCount?: number;
  /** 表示サイズ */
  size?: "small" | "medium" | "large";
  /** 表示バリアント */
  variant?: "full" | "compact" | "score-only";
  /** 星の表示 */
  showStars?: boolean;
  /** レビュー数の表示 */
  showReviewCount?: boolean;
  /** カスタマイズされたスタイル */
  sx?: Record<string, any>;
}

/**
 * 統一されたゲームレーティングコンポーネント
 *
 * 機能:
 * - スコア表示
 * - 星評価表示
 * - レビュー数表示
 * - 複数のサイズとバリアント
 */
export const GameRating: React.FC<GameRatingProps> = ({
  score,
  reviewsCount = 0,
  size = "medium",
  variant = "full",
  showStars = true,
  showReviewCount = true,
  sx = {},
}) => {
  const hasScore = score !== null && score !== undefined && score > 0;

  if (!hasScore && variant === "score-only") {
    return null;
  }

  const starSize = gameCardTokens.rating.starSize[size];
  const scoreStyle =
    gameCardTokens.rating.scoreDisplay[size === "small" ? "compact" : size];

  const containerStyle = {
    display: "flex",
    alignItems: "center",
    gap: designTokens.spacing.xs / 8,
    ...sx,
  };

  // スコアのみ表示
  if (variant === "score-only") {
    return (
      <Box sx={containerStyle}>
        <Typography
          variant={size === "small" ? "body2" : "h6"}
          component="span"
          sx={{
            fontSize: scoreStyle.fontSize,
            fontWeight: scoreStyle.fontWeight,
            color: hasScore
              ? designTokens.colors.primary[700]
              : designTokens.colors.text.disabled,
            lineHeight: 1,
          }}
        >
          {formatRatingScore(score)}
        </Typography>
      </Box>
    );
  }

  // コンパクト表示（スコア + 星のみ）
  if (variant === "compact") {
    return (
      <Box sx={containerStyle}>
        {hasScore && (
          <Typography
            variant={size === "small" ? "body2" : "body1"}
            component="span"
            sx={{
              fontSize: scoreStyle.fontSize,
              fontWeight: scoreStyle.fontWeight,
              color: designTokens.colors.primary[700],
              lineHeight: 1,
              mr: 0.5,
            }}
          >
            {formatRatingScore(score)}
          </Typography>
        )}

        {showStars && (
          <Rating
            value={hasScore ? (score as number) / 2 : 0} // 10点満点を5点満点に変換
            precision={0.1}
            size={size}
            readOnly
            sx={{
              "& .MuiRating-icon": {
                fontSize: starSize,
              },
              "& .MuiRating-iconEmpty": {
                color: designTokens.colors.text.disabled,
              },
            }}
          />
        )}
      </Box>
    );
  }

  // フル表示（スコア + 星 + レビュー数）
  return (
    <Box sx={containerStyle}>
      {hasScore && (
        <Typography
          variant={size === "small" ? "body2" : "h6"}
          component="span"
          sx={{
            fontSize: scoreStyle.fontSize,
            fontWeight: scoreStyle.fontWeight,
            color: designTokens.colors.primary[700],
            lineHeight: 1,
            mr: 0.5,
          }}
        >
          {formatRatingScore(score)}
        </Typography>
      )}

      {showStars && (
        <Rating
          value={hasScore ? (score as number) / 2 : 0}
          precision={0.1}
          size={size}
          readOnly
          sx={{
            "& .MuiRating-icon": {
              fontSize: starSize,
            },
            "& .MuiRating-iconEmpty": {
              color: designTokens.colors.text.disabled,
            },
          }}
        />
      )}

      {showReviewCount && reviewsCount > 0 && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            fontSize:
              size === "small"
                ? designTokens.typography.sizes.xs
                : designTokens.typography.sizes.sm,
            ml: 0.5,
          }}
        >
          ({reviewsCount})
        </Typography>
      )}
    </Box>
  );
};
