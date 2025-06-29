<<<<<<< HEAD
import {
  Game,
  Review,
  PaginationInfo,
  GamesResponse,
  ReviewsResponse,
} from "../types/api";
=======
import { Game, Review, GamesResponse, ReviewsResponse } from "./types/api";
>>>>>>> 391c7a7cccd3f676731b6712fbf739c4deb914d7

// API URL設定
const API_URL =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
    : "http://api:3000";
const API_BASE_URL = `${API_URL}/api/v1`;

// ゲーム情報のキャッシュ
export const gameCache: Record<string, { data: Game; timestamp: number }> = {};
export const CACHE_EXPIRY = 15 * 60 * 1000;

interface GamesResponseOptions {
  cache?: RequestCache;
  revalidate?: number;
}

// SWR用のfetcher関数
export const fetcher = async (url: string): Promise<GamesResponse> => {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("ゲーム情報の取得に失敗しました");
  }

  const data = await response.json();

  return {
    games: data.games || [],
    pagination: data.pagination,
    totalItems: data.pagination?.total_count || 0,
    totalPages: data.pagination?.total_pages || 0,
  };
};

export async function getGames(
  page: number = 1,
  per_page: number = 24,
  sort_by: string = "created_at",
  options: GamesResponseOptions = {}
): Promise<GamesResponse> {
  const url = `${API_BASE_URL}/games?page=${page}&per_page=${per_page}&sort_by=${sort_by}`;

  try {
    console.log(
      `Fetching games: page=${page}, per_page=${per_page}, sort_by=${sort_by}`
    );
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: options.cache || "force-cache",
      next: options.revalidate ? { revalidate: options.revalidate } : undefined,
    });

    if (!response.ok) {
      throw new Error("ゲーム情報の取得に失敗しました");
    }

    const data = await response.json();
    console.log("Games API response:", data);

    return {
      games: data.games || [],
      pagination: data.pagination,
      totalItems: data.pagination?.total_count || 0,
      totalPages: data.pagination?.total_pages || 0,
    };
  } catch (error) {
    console.error("Error in getGames function:", error);
    throw error;
  }
}

export async function getGame(
  id: string,
  authHeaders?: Record<string, string>,
  options: { cache?: RequestCache; revalidate?: number } = {}
): Promise<Game> {
  const url = `${API_BASE_URL}/games/${id}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    cache: options.cache || "force-cache",
    next: options.revalidate ? { revalidate: options.revalidate } : undefined,
  });

  if (!response.ok) {
    throw new Error("ゲーム情報の取得に失敗しました");
  }

  return response.json();
}

export async function getGameBasicInfo(
  id: string,
  authHeaders?: Record<string, string>,
  options: { cache?: RequestCache; revalidate?: number } = {}
): Promise<Game> {
  const url = `${API_BASE_URL}/games/${id}/basic`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    cache: options.cache || "force-cache",
    next: options.revalidate ? { revalidate: options.revalidate } : undefined,
  });

  if (!response.ok) {
    throw new Error("ゲーム基本情報の取得に失敗しました");
  }

  return response.json();
}

export async function getGameStatistics(
  id: string,
  authHeaders?: Record<string, string>,
  options: { cache?: RequestCache; revalidate?: number } = {}
): Promise<any> {
  const url = `${API_BASE_URL}/games/${id}/statistics`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    cache: options.cache || "force-cache",
    next: options.revalidate ? { revalidate: options.revalidate } : undefined,
  });

  if (!response.ok) {
    throw new Error("ゲーム統計情報の取得に失敗しました");
  }

  return response.json();
}

export async function getGameReviews(
  id: string,
  page: number = 1,
  per_page: number = 5,
  authHeaders?: Record<string, string>,
  options: { cache?: RequestCache; revalidate?: number } = {}
): Promise<ReviewsResponse> {
  const url = `${API_BASE_URL}/games/${id}/reviews?page=${page}&per_page=${per_page}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    cache: options.cache || "force-cache",
    next: options.revalidate ? { revalidate: options.revalidate } : undefined,
  });

  if (!response.ok) {
    throw new Error("レビュー情報の取得に失敗しました");
  }

  const data = await response.json();
  return {
    reviews: data.reviews || [],
    pagination: data.pagination,
    totalItems: data.pagination?.total_count || 0,
    totalPages: data.pagination?.total_pages || 0,
  };
}

export async function getRelatedGames(
  id: string,
  authHeaders?: Record<string, string>,
  options: { cache?: RequestCache; revalidate?: number } = {}
): Promise<Game[]> {
  const url = `${API_BASE_URL}/games/${id}/related`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    cache: options.cache || "force-cache",
    next: options.revalidate ? { revalidate: options.revalidate } : undefined,
  });

  if (!response.ok) {
    throw new Error("関連ゲーム情報の取得に失敗しました");
  }

  const data = await response.json();
  return data.games || [];
}

export async function updateJapaneseName(
  id: string,
  japaneseName: string,
  authHeaders?: Record<string, string>
): Promise<Game> {
  const response = await fetch(`${API_BASE_URL}/games/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify({
      game: {
        japanese_name: japaneseName,
      },
    }),
  });

  if (!response.ok) {
    throw new Error("日本語名の更新に失敗しました");
  }

  return response.json();
}

export async function addToWishlist(
  gameId: string,
  authHeaders?: Record<string, string>
): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/wishlist_items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify({
      wishlist_item: {
        game_id: gameId,
      },
    }),
  });

  if (!response.ok) {
    throw new Error("ウィッシュリストへの追加に失敗しました");
  }

  return response.json();
}

export async function removeFromWishlist(
  gameId: string,
  authHeaders?: Record<string, string>
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/wishlist_items/${gameId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
  });

  if (!response.ok) {
    throw new Error("ウィッシュリストからの削除に失敗しました");
  }
}

export async function updateGameFromBgg(
  id: string,
  authHeaders?: Record<string, string>
): Promise<Game> {
  const response = await fetch(`${API_BASE_URL}/games/${id}/update_from_bgg`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
  });

  if (!response.ok) {
    throw new Error("BGGからの更新に失敗しました");
  }

  return response.json();
}

export async function updateSystemReviews(
  id: string,
  authHeaders?: Record<string, string>
): Promise<any> {
  const response = await fetch(
    `${API_BASE_URL}/games/${id}/update_system_reviews`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
    }
  );

  if (!response.ok) {
    throw new Error("システムレビューの更新に失敗しました");
  }

  return response.json();
}

export async function searchGames(
  params: Record<string, any>
): Promise<GamesResponse> {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(`${key}[]`, v));
      } else {
        searchParams.append(key, value.toString());
      }
    }
  });

  const url = `${API_BASE_URL}/games/search?${searchParams.toString()}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("検索に失敗しました");
  }

  const data = await response.json();
  return {
    games: data.games || [],
    pagination: data.pagination,
    totalItems: data.pagination?.total_count || 0,
    totalPages: data.pagination?.total_pages || 0,
  };
}

export async function registerGame(
  gameDetails: any,
  authHeaders?: Record<string, string>,
  autoRegister: boolean = false,
  manualRegistration: boolean = false
): Promise<Game> {
  const response = await fetch(`${API_BASE_URL}/games`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authHeaders || {}),
    },
    body: JSON.stringify({
      game: manualRegistration
        ? gameDetails // 手動登録の場合はそのまま送信
        : { bgg_id: gameDetails.bggId }, // BGG登録の場合はBGG IDのみ
      auto_register: autoRegister,
      manual_registration: manualRegistration,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const errorMessage =
      errorData?.error || `ゲーム登録に失敗しました: ${response.status}`;

    // BGGランキング制限エラーの場合は詳細情報を含める
    if (response.status === 403 && errorData?.bgg_rank) {
      throw new Error(errorMessage);
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

export async function postReview(
  gameId: string,
  reviewData: any,
  authHeaders?: Record<string, string>
): Promise<Review> {
  const response = await fetch(`${API_BASE_URL}/games/${gameId}/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify(reviewData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const errorMessage =
      errorData?.error || `レビュー投稿に失敗しました: ${response.status}`;
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function updateGame(
  id: string,
  gameData: any,
  authHeaders?: Record<string, string>
): Promise<Game> {
  const response = await fetch(`${API_BASE_URL}/games/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify({ game: gameData }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "ゲームの更新に失敗しました");
  }

  return response.json();
}

export async function getGameImageAndTitle(
  id: string,
  authHeaders?: Record<string, string>
): Promise<Partial<Game>> {
  const response = await fetch(`${API_BASE_URL}/games/${id}/image_and_title`, {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
  });
  if (!response.ok) throw new Error("画像とタイトルの取得に失敗");
  return response.json();
}

export async function getGameSpecs(
  id: string,
  authHeaders?: Record<string, string>
): Promise<Partial<Game>> {
  const response = await fetch(`${API_BASE_URL}/games/${id}/specs`, {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
  });
  if (!response.ok) throw new Error("スペック情報の取得に失敗");
  return response.json();
}

export async function getGameDescription(
  id: string,
  authHeaders?: Record<string, string>
): Promise<Partial<Game>> {
  const response = await fetch(`${API_BASE_URL}/games/${id}/description`, {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
  });
  if (!response.ok) throw new Error("説明文の取得に失敗");
  return response.json();
}

export async function searchGamesByPublisher(
  publisher: string,
  page: number = 1,
  per_page: number = 24,
  sort_by: string = "created_at"
): Promise<GamesResponse> {
  return searchGames({ publisher, page, per_page, sort_by });
}

export async function searchGamesByDesigner(
  designer: string,
  page: number = 1,
  per_page: number = 24,
  sort_by: string = "created_at"
): Promise<GamesResponse> {
  return searchGames({ designer, page, per_page, sort_by });
}

export interface GameEditHistory {
  id: number;
  game_id: number;
  game_name: string;
  user_id: number;
  user_name: string;
  user_email: string;
  action: string;
  details: any;
  created_at: string;
}

export interface GameEditHistoriesResponse {
  histories: GameEditHistory[];
  total_pages: number;
}

export async function getGameEditHistories(
  authHeaders: Record<string, string>,
  gameId?: string,
  page: number = 1
): Promise<GameEditHistoriesResponse> {
  const url = new URL(`${API_BASE_URL}/admin/game_edit_histories`);
  if (gameId) url.searchParams.append("game_id", gameId);
  url.searchParams.append("page", page.toString());

  const response = await fetch(url.toString(), { headers: authHeaders });
  if (!response.ok) throw new Error("編集履歴の取得に失敗しました");
  return response.json();
}

export interface GameExpansion {
  id: string;
  bgg_id: string;
  name: string;
  japanese_name: string;
  image_url: string;
  japanese_image_url: string;
  relationship_type: string;
}

export interface UnregisteredExpansion {
  id: string;
  type: string;
}

export interface GameExpansionsResponse {
  expansions: GameExpansion[];
  base_games: GameExpansion[];
  unregistered_expansion_ids: UnregisteredExpansion[];
  unregistered_base_game_ids: UnregisteredExpansion[];
}

export async function getGameExpansions(
  gameId: string,
  registeredOnly: boolean,
  authHeaders: Record<string, string>
): Promise<GameExpansionsResponse> {
  const url = new URL(`${API_BASE_URL}/games/${gameId}/expansions`);
  url.searchParams.append("registered_only", registeredOnly.toString());
  const response = await fetch(url.toString(), { headers: authHeaders });
  if (!response.ok) throw new Error("拡張情報の取得に失敗しました");
  return response.json();
}

export async function updateGameExpansions(
  gameId: string,
  authHeaders: Record<string, string>
): Promise<GameExpansionsResponse> {
  const response = await fetch(
    `${API_BASE_URL}/games/${gameId}/expansions/update_from_bgg`,
    {
      method: "POST",
      headers: authHeaders,
    }
  );
  if (!response.ok) throw new Error("BGGからの拡張情報更新に失敗しました");
  return response.json();
}
