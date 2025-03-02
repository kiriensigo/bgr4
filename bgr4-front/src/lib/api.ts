import { useAuth } from "@/contexts/AuthContext";
import { getBGGGameDetails, type BGGGameDetails } from "./bggApi";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const API_BASE_URL = `${API_URL}/api/v1`;

export interface Game {
  id: number;
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
  weight?: number;
  reviews?: Review[];
  reviews_count?: number;
  average_rule_complexity?: number;
  average_luck_factor?: number;
  average_interaction?: number;
  average_downtime?: number;
  popular_tags?: string[];
  popular_mechanics?: string[];
  site_recommended_players?: string[];
  in_wishlist?: boolean;
  bgg_url?: string;
  publisher?: string;
  designer?: string;
  release_date?: string;
  japanese_release_date?: string;
  japanese_publisher?: string;
  expansions?: Array<{ id: string; name: string }>;
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
  tags?: string[];
  custom_tags?: string[];
  short_comment: string;
  created_at: string;
  updated_at?: string;
  likes_count: number;
  liked_by_current_user: boolean;
}

export async function getGames(): Promise<Game[]> {
  const response = await fetch(`${API_BASE_URL}/games`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("ゲーム情報の取得に失敗しました");
  }

  const data = await response.json();
  console.log("API response for getGames:", data);
  return data;
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
  tags?: string[];
  recommended_players?: string[];
}

export async function searchGames(params: SearchParams): Promise<Game[]> {
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
  if (params.tags?.length) queryParams.append("tags", params.tags.join(","));
  if (params.recommended_players?.length)
    queryParams.append(
      "recommended_players",
      params.recommended_players.join(",")
    );

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
  publisher: string
): Promise<Game[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/games/search_by_publisher?publisher=${encodeURIComponent(
        publisher
      )}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "出版社での検索に失敗しました");
    }

    return response.json();
  } catch (error) {
    console.error("Error searching games by publisher:", error);
    throw error;
  }
}

// デザイナーで検索する関数
export async function searchGamesByDesigner(designer: string): Promise<Game[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/games/search_by_designer?designer=${encodeURIComponent(
        designer
      )}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "デザイナーでの検索に失敗しました");
    }

    return response.json();
  } catch (error) {
    console.error("Error searching games by designer:", error);
    throw error;
  }
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
          play_time: bggGame.playTime,
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
    // まずAPIからゲーム情報の取得を試みる
    const response = await fetch(`${API_BASE_URL}/games/${id}`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(authHeaders || {}),
      },
    });

    // ゲームが見つかった場合はそのデータを返す
    if (response.ok) {
      const gameData = await response.json();
      return gameData;
    }

    // ゲームが見つからない場合（404）はエラーメッセージを表示
    if (response.status === 404) {
      throw new Error(
        `ゲームID: ${id}はまだデータベースに登録されていません。検索画面から登録できます。`
      );
    }

    // その他のエラーの場合
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || errorData.message || "ゲーム情報の取得に失敗しました"
    );
  } catch (error) {
    console.error("API Error:", error);
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
  autoRegister: boolean = false
) {
  try {
    console.log("Sending game details to API:", gameDetails);
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

    const response = await fetch(`${API_BASE_URL}/games`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Referer: `${window.location.origin}/games/register`,
        ...(authHeaders || {}),
      },
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
      throw new Error(errorData.error || "ゲームの登録に失敗しました");
    }

    return response.json();
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
          "Content-Type": "application/json",
          Accept: "application/json",
          ...authHeaders,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || "やりたいリストからの削除に失敗しました"
      );
    }

    return response.json();
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    throw error;
  }
}
