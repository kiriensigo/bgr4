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

export async function searchGames(query: string): Promise<Game[]> {
  const response = await fetch(
    `${API_BASE_URL}/games/search?q=${encodeURIComponent(query)}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("ゲームの検索に失敗しました");
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
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || errorData.message || "ゲーム情報の作成に失敗しました"
      );
    }

    return response.json();
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

    // ゲームが見つかった場合はそのまま返す
    if (response.ok) {
      return response.json();
    }

    // ゲームが見つからない場合（404）は、BGGから情報を取得して新規作成
    if (response.status === 404) {
      try {
        const bggGame = await getBGGGameDetails(id);
        return await createGame(bggGame);
      } catch (error) {
        console.error("BGG game fetch error:", error);
        throw new Error("ゲーム情報の取得に失敗しました");
      }
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

  const response = await fetch(`${API_BASE_URL}/games/${gameId}/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "access-token": authHeaders["access-token"],
      client: authHeaders["client"],
      uid: authHeaders["uid"],
      expiry: authHeaders["expiry"],
      "token-type": authHeaders["token-type"],
    },
    body: JSON.stringify(reviewData),
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
};

export async function getReviews(gameId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/reviews`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

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
    const response = await fetch(`${API_BASE_URL}/reviews/all`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

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
