"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import GroupIcon from "@mui/icons-material/Group";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { designTokens, gameCardTokens } from "@/theme/tokens";
import { formatPlayerCount, formatPlayTime } from "@/lib/gameUtils";
import type { Game } from "@/types/api";

export interface GameMetaProps {
  /** ゲームデータ */
  game: Game;
  /** 表示サイズ */
  size?: "small" | "medium" | "large";
  /** 表示方向 */
  direction?: "row" | "column";
  /** アイコンのみ表示 */
  iconOnly?: boolean;
  /** カスタムスタイル */
  sx?: Record<string, any>;
}

/**
 * ゲームのメタ情報を表示する統一コンポーネント
 *
 * 機能:
 * - プレイ人数表示
 * - プレイ時間表示
 * - 統一されたアイコンとスタイル
 */
export const GameMeta: React.FC<GameMetaProps> = ({
  game,
  size = "medium",
  direction = "row",
  iconOnly = false,
  sx = {},
}) => {
  const playerCount = formatPlayerCount(game);
  const playTime = formatPlayTime(game);

  const iconSize = gameCardTokens.iconSizes[size];
  const textVariant = size === "small" ? "caption" : "body2";
  const fontSize =
    size === "small"
      ? designTokens.typography.sizes.xs
      : designTokens.typography.sizes.sm;

  const containerStyle = {
    display: "flex",
    flexDirection: direction,
    alignItems: direction === "row" ? "center" : "flex-start",
    gap:
      direction === "row"
        ? designTokens.spacing.md / 8
        : designTokens.spacing.xs / 8,
    color: designTokens.colors.text.secondary,
    ...sx,
  };

  const metaItemStyle = {
    display: "flex",
    alignItems: "center",
    gap: designTokens.spacing.xs / 8,
  };

  return (
    <Box sx={containerStyle}>
      {/* プレイ人数 */}
      <Box sx={metaItemStyle}>
        <GroupIcon
          sx={{
            fontSize: iconSize,
            color: designTokens.colors.text.secondary,
          }}
        />
        {!iconOnly && (
          <Typography
            variant={textVariant}
            sx={{
              fontSize,
              color: designTokens.colors.text.secondary,
              lineHeight: 1.2,
            }}
          >
            {playerCount}
          </Typography>
        )}
      </Box>

      {/* プレイ時間 */}
      <Box sx={metaItemStyle}>
        <AccessTimeIcon
          sx={{
            fontSize: iconSize,
            color: designTokens.colors.text.secondary,
          }}
        />
        {!iconOnly && (
          <Typography
            variant={textVariant}
            sx={{
              fontSize,
              color: designTokens.colors.text.secondary,
              lineHeight: 1.2,
            }}
          >
            {playTime}
          </Typography>
        )}
      </Box>
    </Box>
  );
};
