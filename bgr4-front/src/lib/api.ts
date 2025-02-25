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
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      // まずAPIからゲーム情報の取得を試みる
      const response = await fetch(`${API_BASE_URL}/games/${id}`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(authHeaders || {}),
        },
      });

      // ゲームが見つかった場合はレビューも取得
      if (response.ok) {
        const gameData = await response.json();

        // レビューを取得
        const reviewsResponse = await fetch(
          `${API_BASE_URL}/games/${id}/reviews`,
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              ...(authHeaders || {}),
            },
          }
        );

        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json();
          return {
            ...gameData,
            reviews: reviewsData,
          };
        }

        return {
          ...gameData,
          reviews: [],
        };
      }

      // ゲームが見つからない場合（404）は、BGGから情報を取得して新規作成
      if (response.status === 404) {
        try {
          const bggGame = await getBGGGameDetails(id);
          // 少し待機してからリトライ
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (retryCount + 1))
          );
          const game = await createGame(bggGame);
          return {
            ...game,
            reviews: [],
          };
        } catch (error) {
          console.error("BGG game fetch error:", error);
          if (retryCount === maxRetries - 1) {
            throw new Error(
              "ゲーム情報の取得に失敗しました。しばらく待ってから再度お試しください。"
            );
          }
        }
      } else {
        // その他のエラーの場合
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            errorData.message ||
            "ゲーム情報の取得に失敗しました"
        );
      }
    } catch (error) {
      console.error("API Error:", error);
      if (retryCount === maxRetries - 1) {
        throw error;
      }
    }
    retryCount++;
  }

  throw new Error(
    "ゲーム情報の取得に失敗しました。しばらく待ってから再度お試しください。"
  );
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
