import { useAuth } from "@/contexts/AuthContext";
import { getBGGGameDetails, type BGGGameDetails } from "./bggApi";
import { getAuthHeaders } from "@/lib/auth";

// リライト機能を使用するかどうか
const USE_DIRECT_API = process.env.NEXT_PUBLIC_API_DIRECT === "true";
console.log("API直接アクセスモード:", USE_DIRECT_API);

// API基本URLを環境に応じて設定
// サーバーサイドではDocker間通信、クライアントサイド（ブラウザ）ではlocalhostを使用
const isServer = typeof window === "undefined";
const SERVER_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://bgr4-api:8080"; // Docker環境
const BROWSER_API_URL =
  process.env.NEXT_PUBLIC_BROWSER_API_URL || "http://localhost:8080"; // ブラウザ環境

// 環境に応じたベースURLを選択
const BASE_URL = isServer ? SERVER_API_URL : BROWSER_API_URL;

// 環境に応じたAPIベースURLを設定
const API_URL = USE_DIRECT_API
  ? `${BASE_URL}/api` // 直接APIを叩く場合
  : "/api"; // リライト機能を使う場合

const API_BASE_URL = `${API_URL}/v1`;

// APIベースURLを取得する関数
export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

// デバッグ情報をコンソールに出力
console.log("API設定:", {
  USE_DIRECT_API,
  isServer,
  SERVER_API_URL,
  BROWSER_API_URL,
  BASE_URL,
  API_URL,
  API_BASE_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_BROWSER_API_URL: process.env.NEXT_PUBLIC_BROWSER_API_URL,
  NEXT_PUBLIC_API_DIRECT: process.env.NEXT_PUBLIC_API_DIRECT,
});

// ゲーム情報のキャッシュ
export const gameCache: Record<string, { data: Game; timestamp: number }> = {};
// キャッシュの有効期限（15分に延長）
export const CACHE_EXPIRY = 15 * 60 * 1000;

// 型定義を追加: pendingRequestsの型を適切に定義
const pendingRequests: Record<string, Promise<any>> = {};

// デバッグ用のAPIリクエスト関数をラップする
async function fetchWithDebug(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // 相対パスの場合は絶対パスに変換（直接APIアクセスモードの場合）
  let fullUrl = url;
  if (USE_DIRECT_API && url.startsWith("/")) {
    // ブラウザかサーバーかで異なるベースURLを使用
    const baseUrl = isServer ? SERVER_API_URL : BROWSER_API_URL;
    fullUrl = `${baseUrl}${url}`;
    console.log(
      `相対パスを絶対パスに変換: ${url} -> ${fullUrl} (${
        isServer ? "サーバー" : "ブラウザ"
      }環境)`
    );
  }

  console.log(`APIリクエスト: ${fullUrl}`, {
    method: options.method || "GET",
    headers: options.headers || {},
    body: options.body ? "(data)" : undefined,
  });

  try {
    const response = await fetch(fullUrl, options);
    console.log(`APIレスポンス: ${fullUrl}`, {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    });

    if (!response.ok) {
      console.error(
        `APIエラーレスポンス: ${response.status} ${response.statusText}`
      );
    }

    return response;
  } catch (error) {
    console.error(`APIリクエスト例外: ${fullUrl}`, error);
    throw error;
  }
}

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
  totalItems: number;
  totalPages: number;
}

export interface ReviewsResponse {
  reviews: Review[];
  pagination?: PaginationInfo;
  totalItems: number;
  totalPages: number;
}

interface GamesResponseOptions {
  cache?: RequestCache;
  revalidate?: number;
}

export async function getGames(
  page: number = 1,
  per_page: number = 24,
  sort_by: string = "review_date",
  options: GamesResponseOptions = {}
): Promise<GamesResponse> {
  const url = `${API_BASE_URL}/games?page=${page}&per_page=${per_page}&sort_by=${sort_by}`;
  const cacheKey = `getGames_${page}_${per_page}_${sort_by}`;

  // 同一リクエストが進行中の場合はそれを再利用
  if (cacheKey in pendingRequests) {
    console.log(`Reusing pending request for ${cacheKey}`);
    return pendingRequests[cacheKey];
  }

  try {
    const requestPromise = new Promise<GamesResponse>(
      async (resolve, reject) => {
        try {
          console.log(
            `Fetching games: page=${page}, per_page=${per_page}, sort_by=${sort_by}`
          );
          // fetchWithDebug関数を使用
          const response = await fetchWithDebug(url, {
            headers: {
              "Content-Type": "application/json",
            },
            cache: options.cache || "force-cache",
            next: options.revalidate
              ? { revalidate: options.revalidate }
              : undefined,
          });

          if (!response.ok) {
            console.error(
              `APIリクエスト失敗: ${response.status} ${response.statusText}`
            );
            throw new Error(
              `ゲーム情報の取得に失敗しました: ${response.status} ${response.statusText}`
            );
          }

          const data = await response.json();
          console.log(`Successfully fetched ${data.games?.length || 0} games`);

          // APIレスポンスに総ゲーム数があることをログ出力
          console.log(
            `API reported total_count: ${
              data.pagination?.total_count || "undefined"
            }`
          );
          console.log(
            `API reported total_pages: ${
              data.pagination?.total_pages || "undefined"
            }`
          );

          // 空の結果が返ってきた場合でも、ページネーション情報は正しく設定する
          if (data.games.length === 0 && page > 1) {
            console.warn(
              `ページ ${page} のデータが空です。バックエンドのページネーションに問題がある可能性があります。`
            );
          }

          // API からの応答を整形し、totalItemsとtotalPagesを明示的に設定
          const transformedResponse: GamesResponse = {
            games: data.games || [],
            pagination: data.pagination || {
              total_count: 0,
              total_pages: 0,
              current_page: page,
              per_page: per_page,
            },
            // GameList コンポーネントが使用する形式にマッピング
            totalItems: data.pagination?.total_count || 0,
            totalPages: data.pagination?.total_pages || 0,
          };

          resolve(transformedResponse);
        } catch (error) {
          console.error("API error in getGames:", error);
          reject(error);
        } finally {
          // リクエスト完了後にpendingRequestsから削除
          setTimeout(() => {
            if (cacheKey in pendingRequests) {
              delete pendingRequests[cacheKey];
            }
          }, 1000);
        }
      }
    );

    // 進行中のリクエストとして登録
    pendingRequests[cacheKey] = requestPromise;

    return await requestPromise;
  } catch (error) {
    // エラー時もpendingRequestsからは削除
    delete pendingRequests[cacheKey];
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

export const getGame = async (
  gameId: string | number,
  headers: Record<string, string> = {}
): Promise<Game> => {
  // IDがundefinedか、文字列で'undefined'の場合はエラーを投げる
  if (
    !gameId ||
    gameId === undefined ||
    gameId === "undefined" ||
    gameId === "" ||
    (typeof gameId === "string" && gameId.trim() === "")
  ) {
    console.error("Invalid game ID:", gameId);
    throw new Error("無効なゲームIDです");
  }

  // キャッシュをチェック
  const cacheKey = `game-${gameId}`;
  const cachedData = gameCache[cacheKey];
  const now = Date.now();

  // 有効なキャッシュがある場合はそれを使用
  if (cachedData && now - cachedData.timestamp < CACHE_EXPIRY) {
    return cachedData.data;
  }

  // IDにnon-ASCII文字が含まれている場合はエンコードする
  const encodedGameId =
    typeof gameId === "string" && /[^\x00-\x7F]/.test(gameId)
      ? encodeURIComponent(gameId)
      : gameId;

  // システムレビューを含めるパラメータをURLに追加
  const includeSystemReviews = headers.include_system_reviews || "true";
  const url = `${getApiBaseUrl()}/games/${encodedGameId}?include_system_reviews=${includeSystemReviews}`;

  try {
    console.log(`Making API request to get game with ID: ${encodedGameId}`);
    console.log(`API URL: ${url}`);

    // includeSystemReviewsパラメータをヘッダーから削除（URLパラメータとして使用するため）
    const { include_system_reviews, ...requestHeaders } = headers;
    console.log("Request headers:", requestHeaders);

    const response = await fetchWithDebug(url, {
      method: "GET",
      headers: {
        ...requestHeaders,
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching game: ${response.status}`, errorText);

      if (response.status === 404) {
        throw new Error("指定されたゲームが見つかりませんでした");
      }

      let errorMessage = "ゲーム情報の取得に失敗しました";
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        // JSONのパースに失敗した場合は元のエラーメッセージを使用
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("Game data successfully fetched");

    // デバッグ: レビュー情報と評価値を確認
    console.log(
      "Game reviews:",
      data.reviews ? `${data.reviews.length} reviews` : "no reviews"
    );
    console.log("Game ratings:", {
      overall_score: data.average_overall_score,
      rule_complexity: data.average_rule_complexity,
      luck_factor: data.average_luck_factor,
      interaction: data.average_interaction,
      downtime: data.average_downtime,
    });

    // キャッシュに保存
    gameCache[cacheKey] = {
      data,
      timestamp: now,
    };

    return data;
  } catch (error) {
    console.error("Error in getGame function:", error);
    throw error;
  }
};

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

    // IDにnon-ASCII文字が含まれている場合はエンコードする
    const encodedGameId = /[^\x00-\x7F]/.test(gameId)
      ? encodeURIComponent(gameId)
      : gameId;

    // ヘッダーを単純化して送信
    const response = await fetchWithDebug(
      `${getApiBaseUrl()}/games/${encodedGameId}/reviews`,
      {
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
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Review post error: ${response.status} ${response.statusText}`,
        errorText
      );

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: errorText || "レスポンスの解析に失敗しました" };
      }

      console.error("Unauthorized response:", errorData);

      if (response.status === 401) {
        throw new Error(
          errorData.error || "認証に失敗しました。再度ログインしてください。"
        );
      }

      throw new Error(
        errorData.errors?.[0] ||
          errorData.error ||
          errorData.message ||
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
    // IDにnon-ASCII文字が含まれている場合はエンコードする
    const encodedGameId = /[^\x00-\x7F]/.test(gameId)
      ? encodeURIComponent(gameId)
      : gameId;

    const response = await fetchWithDebug(
      `${getApiBaseUrl()}/games/${encodedGameId}/reviews?exclude_system=true`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(`Error fetching reviews: ${response.status}`);
      // エラーの詳細情報を確認
      const errorText = await response.text();
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || "レビューの取得に失敗しました");
      } catch (e) {
        throw new Error("レビューの取得に失敗しました");
      }
    }

    return await response.json();
  } catch (error) {
    console.error("Reviews fetch error:", error);
    throw new Error(
      error instanceof Error ? error.message : "レビューの取得に失敗しました"
    );
  }
}

export async function getAllReviews(
  page: number = 1,
  per_page: number = 24,
  options: { cache?: RequestCache; revalidate?: number } = {}
): Promise<ReviewsResponse> {
  const apiUrl = `${API_BASE_URL}/reviews/all?page=${page}&per_page=${per_page}`;

  try {
    console.log(`Fetching all reviews from ${apiUrl}`);
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: options.cache || "default",
      next: options.revalidate ? { revalidate: options.revalidate } : undefined,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    // デバッグ: レスポンスヘッダーを確認
    console.log("Reviews API response headers:");
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      console.log(`${key}: ${value}`);
      headers[key.toLowerCase()] = value;
    });

    const reviews = await response.json();

    // 総数と総ページ数の取得
    let totalItems = 0;
    let totalPages = 0;

    // ヘッダーからペジネーション情報を取得
    if (headers["x-total-count"]) {
      totalItems = parseInt(headers["x-total-count"]);
      totalPages = Math.ceil(totalItems / per_page);
      console.log(
        `Reviews API returned total count: ${totalItems}, pages: ${totalPages}`
      );
    } else if (headers["x-pagination"]) {
      // X-Paginationヘッダーがある場合
      try {
        const paginationInfo = JSON.parse(headers["x-pagination"]);
        if (paginationInfo.total_count) {
          totalItems = paginationInfo.total_count;
          totalPages =
            paginationInfo.total_pages || Math.ceil(totalItems / per_page);
          console.log(
            `Reviews pagination info: ${totalItems} items, ${totalPages} pages`
          );
        }
      } catch (e) {
        console.error("Error parsing X-Pagination header:", e);
      }
    }

    // データがあるけど総数情報がない場合の推測 (上限なし)
    if (totalItems <= 0 && reviews.length > 0) {
      if (reviews.length < per_page) {
        // 返されたレビュー数がページサイズより少ない場合、最後のページと判断
        totalItems = (page - 1) * per_page + reviews.length;
        totalPages = page;
        console.log(`Estimated total from last page: ${totalItems} items`);
      } else {
        // まだ続きがあると推測
        // 最小でも現在のデータ + もう1ページ分はあるはず
        const minEstimate = page * per_page + per_page;
        totalItems = minEstimate;
        totalPages = Math.ceil(totalItems / per_page);
        console.log(`Minimal estimate: ${totalItems} items`);
      }
    }

    // レスポンスオブジェクトに関連情報を含めて返す
    return {
      reviews,
      totalItems: totalItems || reviews.length,
      totalPages:
        totalPages ||
        (reviews.length < per_page ? 1 : Math.ceil(totalItems / per_page)),
    };
  } catch (error) {
    console.error("Failed to fetch all reviews:", error);
    throw error;
  }
}

export const socialLogin = async (provider: "google" | "twitter") => {
  // 認証エンドポイントへの直接アクセス
  const response = await fetch(`/auth/${provider}`, {
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
