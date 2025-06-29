// Core API client
export { ApiClient } from "./core/client";

// Resource APIs
export { GamesApi } from "./resources/games";

// Types
export type { Game, GameBasicInfo, GameStats } from "./types/game";
export type { ApiResponse, PaginationInfo } from "./types/common";

// Main API functions (commonly used)
export const {
  getGames,
  getGame,
  getGameBasicInfo,
  getGameStatistics,
  getGameReviews,
  getRelatedGames,
  searchGames,
  getHotGames,
  getRecentGames,
  getTopRatedGames,
  registerGame,
  updateGameFromBgg,
  updateSystemReviews,
} = GamesApi;

// 削除された関数（実装されていないもの）:
// - updateGame
// - searchGamesByDesigner
// - searchGamesByPublisher
// - getGameImageAndTitle
// - getGameSpecs
// - getGameDescription
// - getGameEditHistories

// これらの関数は対応するバックエンドAPIの実装後に追加予定
