import type { Game } from "@/types/api";

/**
 * ゲーム関連のユーティリティ関数集
 */

/**
 * ゲームの表示名を取得（日本語名優先）
 */
export const getGameDisplayName = (game: Game): string => {
  return game.japanese_name || game.name || "Unknown Game";
};

/**
 * ゲームの画像URLを取得（優先度順）
 */
export const getGameImageUrl = (game: Game): string | null => {
  return game.japanese_image_url || game.image_url || game.thumbnail || null;
};

/**
 * プレイ人数の表示文字列を生成
 */
export const formatPlayerCount = (game: Game): string => {
  const minPlayers = game.minPlayers || game.min_players;
  const maxPlayers = game.maxPlayers || game.max_players;

  if (!minPlayers && !maxPlayers) return "?人";
  if (!maxPlayers) return `${minPlayers}人〜`;
  if (!minPlayers) return `〜${maxPlayers}人`;
  if (minPlayers === maxPlayers) return `${minPlayers}人`;

  return `${minPlayers}〜${maxPlayers}人`;
};

/**
 * プレイ時間の表示文字列を生成
 */
export const formatPlayTime = (game: Game): string => {
  const minPlayTime = game.min_play_time;
  const maxPlayTime = game.play_time || game.playingTime;

  if (!minPlayTime && !maxPlayTime) return "?分";
  if (!maxPlayTime) return `${minPlayTime}分〜`;
  if (!minPlayTime) return `${maxPlayTime}分`;
  if (minPlayTime === maxPlayTime) return `${minPlayTime}分`;

  return `${minPlayTime}〜${maxPlayTime}分`;
};

/**
 * ゲームのレーティング情報を取得
 */
export const getGameRating = (
  game: Game
): {
  score: number | null;
  hasRating: boolean;
  reviewsCount: number;
} => {
  const score = game.average_score;
  const reviewsCount = game.reviews_count || 0;
  const hasRating = score !== null && score !== undefined && score > 0;

  return {
    score,
    hasRating,
    reviewsCount,
  };
};

/**
 * ゲームのリンクURLを生成
 */
export const getGameLinkUrl = (game: Game): string => {
  const gameId = game.bgg_id || game.id;
  return `/games/${gameId}`;
};

/**
 * ゲームのレビューリンクURLを生成
 */
export const getGameReviewUrl = (game: Game): string => {
  const gameId = game.bgg_id || game.id;
  return `/games/${gameId}/review`;
};

/**
 * ゲームカテゴリの表示用配列を生成
 */
export const formatGameCategories = (
  categories?: string | string[],
  maxCount: number = 3
): string[] => {
  if (!categories) return [];

  const categoryArray = Array.isArray(categories)
    ? categories
    : categories.split(",").map((cat) => cat.trim());

  return categoryArray.slice(0, maxCount);
};

/**
 * レーティングスコアのフォーマット
 */
export const formatRatingScore = (
  score: number | null | undefined,
  decimals: number = 1
): string => {
  if (score === null || score === undefined || score <= 0) {
    return "-";
  }
  return Number(score).toFixed(decimals);
};

/**
 * ゲームの詳細説明を短縮
 */
export const truncateDescription = (
  description: string,
  maxLength: number = 150
): string => {
  if (!description) return "";
  if (description.length <= maxLength) return description;

  return description.substring(0, maxLength).trim() + "...";
};
