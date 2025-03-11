import { useAuth } from "@/contexts/AuthContext";
import { getBGGGameDetails, type BGGGameDetails } from "./bggApi";
import { getAuthHeaders } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const API_BASE_URL = `${API_URL}/api/v1`;

// ゲーム情報のキャッシュ
export const gameCache: Record<string, { data: Game; timestamp: number }> = {};
// キャッシュの有効期限（5分）
export const CACHE_EXPIRY = 5 * 60 * 1000;

export interface Game {
  id: string | number;
  bgg_id: string;
  name: string;
  japanese_name?: string;
  description?: string;
  japanese_description?: string;
  image_url?: string;
  japanese_image_url?: string;
  min_players?: number;
  max_players?: number;
  play_time?: number;
  min_play_time?: number;
  average_score?: number;
  average_overall_score?: number;
  weight?: number;
  publisher?: string;
  designer?: string;
  release_date?: string;
  japanese_publisher?: string;
  japanese_release_date?: string;
  reviews?: any[];
  reviews_count?: number;
  average_rule_complexity?: number;
  average_luck_factor?: number;
  average_interaction?: number;
  average_downtime?: number;
  popular_mechanics?: string[];
  site_recommended_players?: string[];
  in_wishlist?: boolean;
  bgg_url?: string;
  expansions?: Array<{ id: string; name: string }>;
  categories?: string[];
  mechanics?: string[];
  best_num_players?: string[];
  recommended_num_players?: string[];
  popular_categories?: string[];
  registered_on_site?: boolean;
}

export interface GameExpansion {
  id: string | number;
  bgg_id: string;
  name: string;
  japanese_name?: string;
  image_url?: string;
  japanese_image_url?: string;
  registered_on_site: boolean;
  relationship_type: string;
}

export interface UnregisteredExpansion {
  id: string;
  type: string;
}

export interface ExpansionsResponse {
  expansions: GameExpansion[];
  base_games: GameExpansion[];
  unregistered_expansion_ids: UnregisteredExpansion[];
  unregistered_base_game_ids: UnregisteredExpansion[];
}

export interface Review {
  id: number;
  user: {
    id: number;
    name: string;
    avatar_url?: string;
  };
  game_id: string;
  overall_score: number;
  rule_complexity?: number;
  luck_factor?: number;
  interaction?: number;
  downtime?: number;
  play_time?: number;
  recommended_players?: string[];
  mechanics?: string[];
  categories?: string[];
  custom_tags?: string[];
  short_comment: string;
  created_at: string;
  updated_at?: string;
  likes_count: number;
  liked_by_current_user: boolean;
}

export interface PaginationInfo {
  total_count: number;
  total_pages: number;
  current_page: number;
  per_page: number;
}

export interface GamesResponse {
  games: Game[];
  pagination: PaginationInfo;
}

export async function getGames(
  page: number = 1,
  per_page: number = 24,
  sort_by: string = "review_date"
): Promise<GamesResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/games?page=${page}&per_page=${per_page}&sort_by=${sort_by}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("ゲーム情報の取得に失敗しました");
    }

    const data = await response.json();
    console.log("API response for getGames:", data);

    // 空の結果が返ってきた場合でも、ページネーション情報は正しく設定する
    if (data.games.length === 0 && page > 1) {
      console.warn(
        `ページ ${page} のデータが空です。バックエンドのページネーションに問題がある可能性があります。`
      );
    }

    return data;
  } catch (error) {
    console.error("API error in getGames:", error);
    throw error;
  }
}

export interface SearchParams {
  keyword?: string;
  min_players?: number | null;
  max_players?: number | null;
  play_time_min?: number;
  play_time_max?: number;
  complexity_min?: number;
  complexity_max?: number;
  total_score_min?: number;
  total_score_max?: number;
  interaction_min?: number;
  interaction_max?: number;
  luck_factor_min?: number;
  luck_factor_max?: number;
  downtime_min?: number;
  downtime_max?: number;
  mechanics?: string[];
  categories?: string[];
  recommended_players?: string[];
  publisher?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  use_reviews_mechanics?: string;
  use_reviews_categories?: string;
  use_reviews_recommended_players?: string;
  categories_match_all?: string;
  mechanics_match_all?: string;
  recommended_players_match_all?: string;
}

export async function searchGames(
  params: SearchParams
): Promise<GamesResponse> {
  const queryParams = new URLSearchParams();

  // パラメータを追加
  if (params.keyword) queryParams.append("query", params.keyword);
  if (params.min_players !== null && params.min_players !== undefined)
    queryParams.append("min_players", params.min_players.toString());
  if (params.max_players !== null && params.max_players !== undefined)
    queryParams.append("max_players", params.max_players.toString());
  if (params.play_time_min)
    queryParams.append("play_time_min", params.play_time_min.toString());
  if (params.play_time_max)
    queryParams.append("play_time_max", params.play_time_max.toString());
  if (params.complexity_min)
    queryParams.append("complexity_min", params.complexity_min.toString());
  if (params.complexity_max)
    queryParams.append("complexity_max", params.complexity_max.toString());
  if (params.total_score_min)
    queryParams.append("total_score_min", params.total_score_min.toString());
  if (params.total_score_max)
    queryParams.append("total_score_max", params.total_score_max.toString());
  if (params.interaction_min)
    queryParams.append("interaction_min", params.interaction_min.toString());
  if (params.interaction_max)
    queryParams.append("interaction_max", params.interaction_max.toString());
  if (params.luck_factor_min)
    queryParams.append("luck_factor_min", params.luck_factor_min.toString());
  if (params.luck_factor_max)
    queryParams.append("luck_factor_max", params.luck_factor_max.toString());
  if (params.downtime_min)
    queryParams.append("downtime_min", params.downtime_min.toString());
  if (params.downtime_max)
    queryParams.append("downtime_max", params.downtime_max.toString());
  if (params.mechanics?.length)
    queryParams.append("mechanics", params.mechanics.join(","));
  if (params.categories?.length)
    queryParams.append("categories", params.categories.join(","));
  if (params.recommended_players?.length)
    queryParams.append(
      "recommended_players",
      params.recommended_players.join(",")
    );
  if (params.publisher) queryParams.append("publisher", params.publisher);

  // 検索モード設定
  if (params.use_reviews_mechanics === "true")
    queryParams.append("use_reviews_mechanics", "true");
  if (params.use_reviews_categories === "true")
    queryParams.append("use_reviews_categories", "true");
  if (params.use_reviews_recommended_players === "true")
    queryParams.append("use_reviews_recommended_players", "true");

  // AND検索フラグ
  if (params.categories_match_all === "true")
    queryParams.append("categories_match_all", "true");
  if (params.mechanics_match_all === "true")
    queryParams.append("mechanics_match_all", "true");
  if (params.recommended_players_match_all === "true")
    queryParams.append("recommended_players_match_all", "true");

  // ページネーションとソートのパラメータを追加
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.per_page)
    queryParams.append("per_page", params.per_page.toString());
  if (params.sort_by) queryParams.append("sort_by", params.sort_by);

  const response = await fetch(
    `${API_BASE_URL}/games/search?${queryParams.toString()}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "ゲームの検索に失敗しました");
  }

  return response.json();
}

// 出版社で検索する関数
export async function searchGamesByPublisher(
  publisher: string,
  page: number = 1,
  per_page: number = 24,
  sort_by: string = "review_date"
): Promise<GamesResponse> {
  const response = await fetch(
    `${API_BASE_URL}/games/search_by_publisher?publisher=${encodeURIComponent(
      publisher
    )}&page=${page}&per_page=${per_page}&sort_by=${sort_by}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("出版社による検索に失敗しました");
  }

  const data = await response.json();
  return data;
}

// デザイナーで検索する関数
export async function searchGamesByDesigner(
  designer: string,
  page: number = 1,
  per_page: number = 24,
  sort_by: string = "review_date"
): Promise<GamesResponse> {
  const response = await fetch(
    `${API_BASE_URL}/games/search_by_designer?designer=${encodeURIComponent(
      designer
    )}&page=${page}&per_page=${per_page}&sort_by=${sort_by}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("デザイナーによる検索に失敗しました");
  }

  const data = await response.json();
  return data;
}

async function createGame(bggGame: BGGGameDetails): Promise<Game> {
  try {
    const response = await fetch(`${API_BASE_URL}/games`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        game: {
          bgg_id: bggGame.id,
          name: bggGame.name,
          description: bggGame.description,
          image_url: bggGame.image,
          min_players: bggGame.minPlayers,
          max_players: bggGame.maxPlayers,
          play_time: bggGame.minPlayTime,
          average_score: bggGame.averageRating || 0,
          weight: bggGame.weight || 1,
          best_num_players: bggGame.bestPlayers || [],
          recommended_num_players: bggGame.recommendedPlayers || [],
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Game creation error details:", errorData);
      throw new Error(
        errorData.error ||
          errorData.message ||
          `ゲームの作成中にエラーが発生しました（${response.status}）。しばらく待ってから再度お試しください。`
      );
    }

    const data = await response.json();
    console.log("Game created successfully:", data);
    return data;
  } catch (error) {
    console.error("Game creation error:", error);
    throw error;
  }
}

export async function getGame(
  id: string,
  authHeaders?: Record<string, string>
): Promise<Game> {
  try {
    // IDが未定義または"undefined"文字列の場合はエラーを投げる
    if (!id || id === "undefined") {
      throw new Error(
        "無効なゲームIDが指定されました。ゲーム一覧ページに戻ってください。"
      );
    }

    // IDが日本語の場合はエンコードする
    // jp-で始まる場合は既にエンコード済みなのでそのまま使用
    const finalId = id.startsWith("jp-")
      ? id
      : id.match(/[^\x00-\x7F]/)
      ? encodeURIComponent(id)
      : id;

    console.log("Fetching game with ID:", id);
    console.log("Final ID used for API call:", finalId);

    const response = await fetch(`${API_BASE_URL}/games/${finalId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authHeaders || {}),
      },
      // キャッシュを無効化
      cache: "no-cache",
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(
          `ゲームID ${id} はまだデータベースに登録されていません`
        );
      }
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch game");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching game:", error);
    throw error;
  }
}

export const postReview = async (
  gameId: string,
  reviewData: any,
  authHeaders: Record<string, string>
) => {
  // 認証ヘッダーの存在確認
  if (
    !authHeaders["access-token"] ||
    !authHeaders["client"] ||
    !authHeaders["uid"]
  ) {
    console.error("Missing auth headers:", authHeaders);
    throw new Error("ログインが必要です");
  }

  try {
    console.log("Sending review with headers:", {
      "access-token": authHeaders["access-token"],
      client: authHeaders.client,
      uid: authHeaders.uid,
    });
    console.log("Review data:", reviewData);

    // ヘッダーを単純化して送信
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "access-token": authHeaders["access-token"],
        client: authHeaders.client,
        uid: authHeaders.uid,
        expiry: authHeaders.expiry || "",
        "token-type": "Bearer",
      },
      body: JSON.stringify(reviewData),
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "レスポンスの解析に失敗しました" }));
      console.error("Unauthorized response:", errorData);
      if (response.status === 401) {
        throw new Error(
          errorData.error || "認証に失敗しました。再度ログインしてください。"
        );
      }
      throw new Error(
        errorData.errors?.[0] ||
          errorData.error ||
          "レビューの投稿に失敗しました"
      );
    }

    return response.json();
  } catch (error) {
    console.error("Review post error:", error);
    throw error;
  }
};

export async function getReviews(gameId: string) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/games/${gameId}/reviews?exclude_system=true`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("レビューの取得に失敗しました");
    }

    return await response.json();
  } catch (error) {
    console.error("Reviews fetch error:", error);
    throw new Error("レビューの取得に失敗しました");
  }
}

export async function getAllReviews() {
  try {
    const response = await fetch(
      `${API_BASE_URL}/reviews/all?exclude_system=true`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("レビューの取得に失敗しました");
    }

    return await response.json();
  } catch (error) {
    console.error("Reviews fetch error:", error);
    throw new Error("レビューの取得に失敗しました");
  }
}

export const socialLogin = async (provider: "google" | "twitter") => {
  const response = await fetch(`${API_URL}/auth/${provider}`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("ソーシャルログインに失敗しました");
  }

  return response.json();
};

export async function registerGame(
  gameDetails: any,
  authHeaders?: Record<string, string>,
  autoRegister: boolean = false,
  manualRegistration: boolean = false
) {
  try {
    console.log("Sending game details to API:", gameDetails);
    console.log("Auth headers for game registration:", authHeaders);
    console.log("Manual registration mode:", manualRegistration);

    if (manualRegistration) {
      console.log("Using manual registration mode");
      // 手動登録モードの場合は、gameDetailsをそのまま使用
      const gameData = {
        name: gameDetails.name,
        japanese_name: gameDetails.japanese_name,
        japanese_description: gameDetails.japanese_description,
        japanese_image_url: gameDetails.japanese_image_url,
        min_players: gameDetails.min_players,
        max_players: gameDetails.max_players,
        play_time: gameDetails.play_time,
        min_play_time: gameDetails.min_play_time,
        weight: gameDetails.weight,
        japanese_publisher: gameDetails.japanese_publisher,
        japanese_release_date: gameDetails.japanese_release_date,
        designer: gameDetails.designer, // デザイナー情報を追加
      };

      // リクエストヘッダーを作成
      const headers = {
        "Content-Type": "application/json",
        Referer: `${window.location.origin}/games/register`,
        ...(authHeaders || {}),
      };

      console.log("Manual game data for API:", gameData);
      console.log("Final request headers:", headers);

      // リクエストボディをログに出力
      const requestBody = {
        game: gameData,
        manual_registration: true,
        use_japanese_name_as_id: true, // 日本語名をIDとして使用するフラグを追加
      };
      console.log("Request body:", JSON.stringify(requestBody));

      const response = await fetch(`${API_BASE_URL}/games`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("Error response from API:", errorData);

        // エラーの詳細を表示（オブジェクトの内容を完全に展開）
        console.error("Error details:", JSON.stringify(errorData, null, 2));

        // 409 Conflictの場合は、既存のゲームIDを含めたエラーを投げる
        if (response.status === 409 && errorData.existing_game_id) {
          throw new Error(`${errorData.error}|${errorData.existing_game_id}`);
        }

        throw new Error(errorData.error || "ゲームの登録に失敗しました");
      }

      // レスポンスデータを取得
      const responseData = await response.json().catch((err) => {
        console.error("Error parsing JSON response:", err);
        return {};
      });

      console.log("Response JSON:", JSON.stringify(responseData, null, 2));

      // データの構造を確認し、必要なプロパティを確実に返す
      if (responseData && typeof responseData === "object") {
        // ゲームIDが含まれていることを確認
        if (!responseData.id && !responseData.bgg_id && responseData.game) {
          // gameオブジェクト内にIDがある場合
          return {
            ...responseData,
            id: responseData.game.id || null,
            bgg_id: responseData.game.bgg_id || null,
          };
        }
      }

      return responseData;
    } else {
      // BGG登録モード（既存のコード）
      console.log("Japanese name being sent:", gameDetails.japaneseName);
      console.log(
        "Japanese publisher being sent:",
        gameDetails.japanesePublisher
      );
      console.log(
        "Japanese release date being sent:",
        gameDetails.japaneseReleaseDate
      );
      console.log("Best players being sent:", gameDetails.bestPlayers);
      console.log(
        "Recommended players being sent:",
        gameDetails.recommendedPlayers
      );

      // ゲームデータを整形
      const gameData = {
        bgg_id: gameDetails.id,
        name: gameDetails.name,
        japanese_name: gameDetails.japaneseName,
        description: gameDetails.description,
        image_url: gameDetails.image,
        japanese_image_url: gameDetails.japaneseImage,
        min_players: gameDetails.minPlayers,
        max_players: gameDetails.maxPlayers,
        min_play_time: gameDetails.minPlayTime,
        play_time: gameDetails.maxPlayTime,
        average_score: gameDetails.averageRating,
        weight: gameDetails.weight,
        publisher: gameDetails.publisher,
        designer: gameDetails.designer,
        release_date: gameDetails.releaseDate,
        japanese_release_date: gameDetails.japaneseReleaseDate,
        japanese_publisher: gameDetails.japanesePublisher,
        expansions: gameDetails.expansions,
        best_num_players: gameDetails.bestPlayers,
        recommended_num_players: gameDetails.recommendedPlayers,
      };

      console.log("Formatted game data for API:", gameData);

      // リクエストヘッダーを作成
      const headers = {
        "Content-Type": "application/json",
        Referer: `${window.location.origin}/games/register`,
        ...(authHeaders || {}),
      };

      console.log("Final request headers:", headers);

      const response = await fetch(`${API_BASE_URL}/games`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          game: gameData,
          auto_register: autoRegister,
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("Error response from API:", errorData);

        // エラーの詳細を表示（オブジェクトの内容を完全に展開）
        console.error("Error details:", JSON.stringify(errorData, null, 2));

        // 409 Conflictの場合は、既存のゲームIDを含めたエラーを投げる
        if (response.status === 409 && errorData.existing_game_id) {
          throw new Error(`${errorData.error}|${errorData.existing_game_id}`);
        }

        throw new Error(errorData.error || "ゲームの登録に失敗しました");
      }

      return response.json();
    }
  } catch (error) {
    console.error("Error registering game:", error);
    throw error;
  }
}

export async function updateJapaneseName(
  gameId: string,
  japaneseName: string,
  authHeaders?: Record<string, string>
): Promise<Game> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/games/${gameId}/update_japanese_name`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(authHeaders || {}),
        },
        body: JSON.stringify({ japanese_name: japaneseName }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "日本語名の更新に失敗しました");
    }

    return response.json();
  } catch (error) {
    console.error("Error updating Japanese name:", error);
    throw error;
  }
}

export interface GameEditHistory {
  id: number;
  game_id: string;
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
  total_count: number;
  current_page: number;
  total_pages: number;
}

export async function getGameEditHistories(
  authHeaders: Record<string, string>,
  gameId?: string,
  page: number = 1
): Promise<GameEditHistoriesResponse> {
  try {
    const url = gameId
      ? `${API_BASE_URL}/games/${gameId}/edit_histories?page=${page}`
      : `${API_BASE_URL}/games/edit_histories?page=${page}`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(authHeaders || {}),
      },
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error("この操作を行う権限がありません");
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "編集履歴の取得に失敗しました");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching edit histories:", error);
    throw error;
  }
}

// やりたいリスト関連の型定義
export interface WishlistItem {
  id: number;
  game_id: string;
  position: number;
  created_at: string;
  game: Game | null;
}

// やりたいリストを取得する
export async function getWishlist(
  authHeaders: Record<string, string>
): Promise<WishlistItem[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/wishlist_items`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...authHeaders,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "やりたいリストの取得に失敗しました");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    throw error;
  }
}

// やりたいリストにゲームを追加する
export async function addToWishlist(
  gameId: string,
  authHeaders: Record<string, string>
): Promise<{ id: number; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/wishlist_items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({ game_id: gameId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || "やりたいリストへの追加に失敗しました"
      );
    }

    return response.json();
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    throw error;
  }
}

// やりたいリストからゲームを削除する
export async function removeFromWishlist(
  wishlistItemId: number,
  authHeaders: Record<string, string>
): Promise<{ message: string }> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/wishlist_items/${wishlistItemId}`,
      {
        method: "DELETE",
        headers: {
          ...authHeaders,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to remove from wishlist");
    }

    return await response.json();
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    throw error;
  }
}

/**
 * BGGからゲーム情報を更新する
 * @param gameId ゲームID
 * @param forceUpdate 強制更新フラグ（trueの場合、既存の値も上書きする）
 * @param authHeaders 認証ヘッダー
 * @returns 更新されたゲーム情報
 */
export async function updateGameFromBgg(
  gameId: string,
  forceUpdate: boolean = false,
  authHeaders: Record<string, string>
): Promise<Game> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/games/${gameId}/update_from_bgg?force_update=${forceUpdate}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error updating game: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating game from BGG:", error);
    throw error;
  }
}

// 拡張情報を取得する関数
export async function getGameExpansions(
  gameId: string,
  registeredOnly: boolean = false,
  authHeaders?: Record<string, string>
): Promise<ExpansionsResponse> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (authHeaders) {
      Object.assign(headers, authHeaders);
    }

    const response = await fetch(
      `${API_BASE_URL}/games/${gameId}/expansions?registered_only=${registeredOnly}`,
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Error fetching expansions: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching game expansions:", error);
    throw error;
  }
}

// BGGから拡張情報を更新する関数
export async function updateGameExpansions(
  gameId: string,
  authHeaders: Record<string, string>
): Promise<ExpansionsResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/games/${gameId}/update_expansions`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error updating expansions: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating game expansions:", error);
    throw error;
  }
}

/**
 * システムレビューを更新する
 * @param gameId ゲームID
 * @param authHeaders 認証ヘッダー
 * @returns 更新結果
 */
export async function updateSystemReviews(
  gameId: string,
  authHeaders: Record<string, string>
): Promise<{ message: string }> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/games/${gameId}/update_system_reviews`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error updating system reviews: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating system reviews:", error);
    throw error;
  }
}

/**
 * ゲーム情報を更新する
 * @param id ゲームID
 * @param gameData 更新するゲーム情報
 * @param authHeaders 認証ヘッダー
 * @returns 更新されたゲーム情報
 */
export const updateGame = async (
  id: string,
  gameData: any,
  authHeaders?: Record<string, string>
) => {
  try {
    if (!authHeaders || Object.keys(authHeaders).length === 0) {
      console.error("認証情報がありません");
      throw new Error("認証情報がありません。ログインしてください。");
    }

    console.log("Updating game with ID:", id);
    console.log("Auth headers:", JSON.stringify(authHeaders));
    console.log("Game data:", JSON.stringify(gameData));

    // Cookieからも認証情報を取得（バックアップとして）
    const accessToken =
      document.cookie.match(/access-token=([^;]+)/)?.[1] || "";
    const client = document.cookie.match(/client=([^;]+)/)?.[1] || "";
    const uid = document.cookie.match(/uid=([^;]+)/)?.[1] || "";

    // 認証ヘッダーを結合（Cookieの情報で補完）
    const combinedHeaders = {
      "Content-Type": "application/json",
      "access-token": authHeaders["access-token"] || accessToken,
      client: authHeaders["client"] || client,
      uid: authHeaders["uid"] || uid,
      "token-type": "Bearer",
    };

    console.log("Combined headers:", JSON.stringify(combinedHeaders));
    console.log("API URL:", `${API_BASE_URL}/games/${id}`);

    // リクエストボディを作成
    const requestBody = { game: gameData };
    console.log("Request body:", JSON.stringify(requestBody));

    const response = await fetch(`${API_BASE_URL}/games/${id}`, {
      method: "PATCH",
      headers: combinedHeaders,
      credentials: "include", // Cookieを含める
      body: JSON.stringify(requestBody),
    });

    console.log("Response status:", response.status);

    // レスポンスヘッダーをログに出力
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    console.log("Response headers:", JSON.stringify(responseHeaders));

    if (!response.ok) {
      let errorMessage = `ゲーム情報の更新に失敗しました: ${response.status}`;

      try {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        const errorText = await response.text();
        console.error("Error text:", errorText);
      }

      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to update game:", error);
    throw error;
  }
};
