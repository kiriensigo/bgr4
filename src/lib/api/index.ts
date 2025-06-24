// 新しい統一API構造のエクスポート

// Core
export { ApiClient, apiClient } from "./core/client";
export type { ApiResponse, PaginatedResponse } from "./core/client";

// Types
export type * from "./types/common";
export type * from "./types/game";

// Resources
export { GamesApi } from "./resources/games";

// 後方互換性のための統一関数
export const api = {
  games: GamesApi,
};

// デフォルトエクスポート
export default api;
