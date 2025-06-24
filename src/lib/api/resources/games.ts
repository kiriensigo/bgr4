import { ApiClient, ApiResponse, PaginatedResponse } from "../core/client";
import {
  Game,
  GameBasicInfo,
  GameStatistics,
  GamesResponse,
  GameCreateParams,
  ExpansionsResponse,
  WishlistItem,
  GameEditHistory,
} from "../types/game";
import {
  PaginationParams,
  SortParams,
  SearchFilters,
  AuthHeaders,
} from "../types/common";

export class GamesApi {
  // ゲーム一覧取得
  static async getGames(
    params: PaginationParams & SortParams = {}
  ): Promise<GamesResponse> {
    const { page = 1, per_page = 24, sort_by = "name_asc" } = params;

    const response = await ApiClient.get<Game[]>("/games", {
      params: { page, per_page, sort_by },
    });

    // 新しいレスポンス形式に対応
    if ("pagination" in response && response.pagination) {
      return {
        games: response.data || [],
        pagination: response.pagination,
        totalItems: response.pagination.total_count,
        totalPages: response.pagination.total_pages,
      };
    }

    // 旧形式への後方互換性
    return response as GamesResponse;
  }

  // ゲーム詳細取得
  static async getGame(id: string, authHeaders?: AuthHeaders): Promise<Game> {
    const response = await ApiClient.get<Game>(`/games/${id}`, {
      headers: authHeaders,
    });
    return response.data!;
  }

  // ゲーム基本情報取得（高速）
  static async getGameBasicInfo(
    id: string,
    authHeaders?: AuthHeaders
  ): Promise<GameBasicInfo> {
    const response = await ApiClient.get<GameBasicInfo>(`/games/${id}/basic`, {
      headers: authHeaders,
    });
    return response.data!;
  }

  // ゲーム統計情報取得
  static async getGameStatistics(
    id: string,
    authHeaders?: AuthHeaders
  ): Promise<GameStatistics> {
    const response = await ApiClient.get<GameStatistics>(
      `/games/${id}/statistics`,
      {
        headers: authHeaders,
      }
    );
    return response.data!;
  }

  // ゲーム検索
  static async searchGames(
    filters: SearchFilters & PaginationParams & SortParams
  ): Promise<GamesResponse> {
    const response = await ApiClient.get<Game[]>("/games/search", {
      params: filters,
    });

    if ("pagination" in response && response.pagination) {
      return {
        games: response.data || [],
        pagination: response.pagination,
        totalItems: response.pagination.total_count,
        totalPages: response.pagination.total_pages,
      };
    }

    return response as GamesResponse;
  }

  // パブリッシャー別検索
  static async searchGamesByPublisher(
    publisher: string,
    params: PaginationParams & SortParams = {}
  ): Promise<GamesResponse> {
    const { page = 1, per_page = 24, sort_by = "review_date" } = params;

    const response = await ApiClient.get<Game[]>("/games/search_by_publisher", {
      params: { publisher, page, per_page, sort_by },
    });

    if ("pagination" in response && response.pagination) {
      return {
        games: response.data || [],
        pagination: response.pagination,
        totalItems: response.pagination.total_count,
        totalPages: response.pagination.total_pages,
      };
    }

    return response as GamesResponse;
  }

  // デザイナー別検索
  static async searchGamesByDesigner(
    designer: string,
    params: PaginationParams & SortParams = {}
  ): Promise<GamesResponse> {
    const { page = 1, per_page = 24, sort_by = "review_date" } = params;

    const response = await ApiClient.get<Game[]>("/games/search_by_designer", {
      params: { designer, page, per_page, sort_by },
    });

    if ("pagination" in response && response.pagination) {
      return {
        games: response.data || [],
        pagination: response.pagination,
        totalItems: response.pagination.total_count,
        totalPages: response.pagination.total_pages,
      };
    }

    return response as GamesResponse;
  }

  // 人気ゲーム取得
  static async getHotGames(): Promise<Game[]> {
    const response = await ApiClient.get<Game[]>("/games/hot");
    return response.data || [];
  }

  // ゲーム作成
  static async createGame(
    gameData: GameCreateParams,
    authHeaders: AuthHeaders,
    manualRegistration: boolean = false
  ): Promise<Game> {
    const response = await ApiClient.post<Game>(
      "/games",
      {
        game: gameData,
        manual_registration: manualRegistration,
      },
      {
        headers: authHeaders,
      }
    );
    return response.data!;
  }

  // ゲーム更新
  static async updateGame(
    id: string,
    gameData: Partial<Game>,
    authHeaders: AuthHeaders
  ): Promise<Game> {
    const response = await ApiClient.put<Game>(`/games/${id}`, gameData, {
      headers: authHeaders,
    });
    return response.data!;
  }

  // BGGからゲーム情報更新
  static async updateGameFromBgg(
    id: string,
    forceUpdate: boolean = false,
    authHeaders: AuthHeaders
  ): Promise<Game> {
    const response = await ApiClient.put<Game>(
      `/games/${id}/update_from_bgg`,
      {
        force_update: forceUpdate,
      },
      {
        headers: authHeaders,
      }
    );
    return response.data!;
  }

  // 日本語名更新
  static async updateJapaneseName(
    id: string,
    japaneseName: string,
    authHeaders: AuthHeaders
  ): Promise<Game> {
    const response = await ApiClient.patch<Game>(
      `/games/${id}/update_japanese_name`,
      {
        japanese_name: japaneseName,
      },
      {
        headers: authHeaders,
      }
    );
    return response.data!;
  }

  // 拡張版情報取得
  static async getGameExpansions(
    id: string,
    registeredOnly: boolean = false,
    authHeaders?: AuthHeaders
  ): Promise<ExpansionsResponse> {
    const response = await ApiClient.get<ExpansionsResponse>(
      `/games/${id}/expansions`,
      {
        params: { registered_only: registeredOnly },
        headers: authHeaders,
      }
    );
    return response.data!;
  }

  // システムレビュー更新
  static async updateSystemReviews(
    id: string,
    authHeaders: AuthHeaders
  ): Promise<{ message: string }> {
    const response = await ApiClient.put<{ message: string }>(
      `/games/${id}/update_system_reviews`,
      {},
      {
        headers: authHeaders,
      }
    );
    return response.data!;
  }

  // ゲーム編集履歴取得
  static async getGameEditHistories(
    authHeaders: AuthHeaders,
    gameId?: string,
    page: number = 1
  ): Promise<{
    histories: GameEditHistory[];
    total_count: number;
    current_page: number;
    total_pages: number;
  }> {
    const params: any = { page };
    if (gameId) params.game_id = gameId;

    const response = await ApiClient.get("/game_edit_histories", {
      params,
      headers: authHeaders,
    });
    return response.data!;
  }
}
