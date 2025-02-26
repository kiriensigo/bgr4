import { useAuth } from "@/contexts/AuthContext";
import { getBGGGameDetails, type BGGGameDetails } from "./bggApi";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const API_BASE_URL = `${API_URL}/api/v1`;

interface Game {
  id: string;
  bgg_id: string;
  name: string;
  description: string;
  image_url: string;
  min_players: number;
  max_players: number;
  play_time: number;
  reviews: any[];
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

  return response.json();
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
  if (params.keyword) queryParams.append("keyword", params.keyword);
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
      throw new Error("ゲームが見つかりません。検索画面から登録してください。");
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
  if (
    !authHeaders["access-token"] ||
    !authHeaders["client"] ||
    !authHeaders["uid"]
  ) {
    console.error("Missing auth headers:", authHeaders);
    throw new Error("ログインが必要です");
  }

  console.log("Sending review with headers:", authHeaders);
  console.log("Review data:", reviewData);

  try {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({ review: reviewData }),
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 401) {
        const errorText = await response.text();
        console.error("Unauthorized response:", errorText);
        throw new Error("ログインが必要です");
      }
      const data = await response.json();
      throw new Error(data.errors?.[0] || "レビューの投稿に失敗しました");
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
  authHeaders?: Record<string, string>
) {
  try {
    const response = await fetch(`${API_BASE_URL}/games`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Referer: `${window.location.origin}/games/register`,
        ...(authHeaders || {}),
      },
      credentials: "include",
      body: JSON.stringify({
        game: {
          bgg_id: gameDetails.id,
          name: gameDetails.name,
          description: gameDetails.description,
          image_url: gameDetails.image,
          min_players: gameDetails.minPlayers,
          max_players: gameDetails.maxPlayers,
          play_time: gameDetails.playTime,
          average_score: gameDetails.averageRating,
          weight: gameDetails.weight,
          best_num_players: gameDetails.bestPlayers,
          recommended_num_players: gameDetails.recommendedPlayers,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "ゲームの登録に失敗しました");
    }

    return response.json();
  } catch (error) {
    console.error("Error registering game:", error);
    throw error;
  }
}
