"use client";

import React from "react";
import type { Game, Review } from "../types/api";
import { UnifiedGameCard } from "./ui/GameCard/UnifiedGameCard";

interface GameCardProps {
  game: Game;
  review?: Review;
  type: "game" | "review";
  useOverallScoreDisplay?: boolean;
  variant?: "list" | "grid" | "search" | "review" | "carousel";
}

/**
 * 既存のGameCardコンポーネントの互換性ラッパー
 * 新しいUnifiedGameCardコンポーネントを使用して実装
 */
export default function GameCard({
  game,
  review,
  type,
  useOverallScoreDisplay = false,
  variant = "list",
}: GameCardProps) {
  // バリアントに応じた設定
  const getCardSettings = () => {
    switch (variant) {
      case "grid":
      case "search":
      case "carousel":
        return {
          showRating: true,
          showPlayerCount: true,
          showPlayTime: true,
          imageHeight: 200,
        };
      case "review":
        return {
          showRating: useOverallScoreDisplay,
          showPlayerCount: true,
          showPlayTime: true,
          imageHeight: 150,
        };
      case "list":
      default:
        return {
          showRating: true,
          showPlayerCount: true,
          showPlayTime: true,
          imageHeight: 180,
        };
    }
  };

  // レビューデータの処理
  const processedGame =
    type === "review" && review
      ? {
          ...game,
          userReview: review,
        }
      : game;

  const cardSettings = getCardSettings();

  return (
    <UnifiedGameCard
      game={processedGame}
      showRating={cardSettings.showRating}
      showPlayerCount={cardSettings.showPlayerCount}
      showPlayTime={cardSettings.showPlayTime}
      imageHeight={cardSettings.imageHeight}
    />
  );
}

// 名前付きエクスポートも追加
export { GameCard };
