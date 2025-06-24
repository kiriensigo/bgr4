"use client";

import React from "react";
import { Box, CircularProgress } from "@mui/material";
import Image from "next/image";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";
import { useGameImage } from "@/hooks/useGameImage";
import { designTokens } from "@/theme/tokens";

export interface GameImageProps {
  /** 画像URL */
  imageUrl?: string | null;
  /** ゲーム名（alt属性用） */
  gameName: string;
  /** 画像のアスペクト比 */
  aspectRatio?: "square" | "card" | "video";
  /** サイズ */
  size?: "small" | "medium" | "large";
  /** カスタムスタイル */
  sx?: Record<string, any>;
  /** 優先読み込み */
  priority?: boolean;
  /** 画像サイズヒント */
  sizes?: string;
  /** フォールバック画像URL */
  fallbackUrl?: string;
}

const aspectRatioMap = {
  square: "1 / 1",
  card: "3 / 4",
  video: "16 / 9",
} as const;

const sizeMap = {
  small: {
    width: "80px",
    height: "80px",
  },
  medium: {
    width: "200px",
    height: "200px",
  },
  large: {
    width: "300px",
    height: "300px",
  },
} as const;

/**
 * 統一されたゲーム画像コンポーネント
 *
 * 機能:
 * - 画像読み込み状態の表示
 * - エラー時のフォールバック
 * - 統一されたアスペクト比とサイズ
 * - Next.js Image最適化
 */
export const GameImage: React.FC<GameImageProps> = ({
  imageUrl,
  gameName,
  aspectRatio = "card",
  size = "medium",
  sx = {},
  priority = false,
  sizes = "(max-width: 600px) 50vw, (max-width: 900px) 33vw, 25vw",
  fallbackUrl,
}) => {
  const { displayImageUrl, isLoading, hasError, onLoad, onError } =
    useGameImage({ imageUrl, fallbackUrl });

  const containerStyle = {
    position: "relative",
    width: sizeMap[size].width,
    height: sizeMap[size].height,
    aspectRatio: aspectRatioMap[aspectRatio],
    backgroundColor: designTokens.colors.background.default,
    borderRadius: `${designTokens.borders.radius.md}px`,
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    ...sx,
  };

  return (
    <Box sx={containerStyle}>
      {displayImageUrl && !hasError ? (
        <Image
          src={displayImageUrl}
          alt={gameName}
          fill
          sizes={sizes}
          style={{
            objectFit: "cover",
            transition: designTokens.transitions.base,
          }}
          onLoad={onLoad}
          onError={onError}
          priority={priority}
          loading={priority ? undefined : "lazy"}
        />
      ) : (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: designTokens.colors.text.secondary,
          }}
        >
          {isLoading ? (
            <CircularProgress
              size={size === "small" ? 20 : 30}
              color="primary"
            />
          ) : (
            <ImageNotSupportedIcon
              sx={{
                fontSize: size === "small" ? 24 : size === "medium" ? 40 : 56,
                color: designTokens.colors.text.disabled,
              }}
            />
          )}
        </Box>
      )}

      {/* 読み込み中オーバーレイ */}
      {isLoading && displayImageUrl && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: designTokens.transitions.fast,
          }}
        >
          <CircularProgress size={24} color="primary" />
        </Box>
      )}
    </Box>
  );
};
