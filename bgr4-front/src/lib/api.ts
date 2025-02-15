import axios from "axios"
import Cookies from "js-cookie"

// 重複したAPI_BASE_URLの定義を統一
const API_BASE_URL = 'http://localhost:3000/api/v1';

// axiosインスタンスの設定を修正
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = Cookies.get("token")
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`
  }
  return config
})

export async function getGames() {
  const response = await fetch(`${API_BASE_URL}/games`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('ゲーム情報の取得に失敗しました');
  }

  return response.json();
}

export async function getGame(id: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/games/${id}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'ゲーム情報の取得に失敗しました');
    }

    const data = await response.json();
    console.log('Game data:', data); // デバッグ用
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

export const createReview = async (gameId: string, content: string, rating: number) => {
  const response = await api.post(`/api/v1/games/${gameId}/reviews`, {
    review: { content, rating, game_id: gameId },
  })
  return response.data.data
}

export default api

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000/api/v1'

export async function postReview(gameId: string, reviewData: any) {
  const response = await api.post(`/games/${gameId}/reviews`, {
    review: {
      ...reviewData,
      game_id: gameId,
      custom_tags: reviewData.customTags?.trim().split(/\s+/).filter((tag: string) => tag.length > 0) || []
    }
  });

  return response.data;
}

export async function getReviews(gameId: string) {
  const response = await fetch(`${API_BASE}/games/${gameId}/reviews`)
  
  if (!response.ok) {
    throw new Error('レビューの取得に失敗しました')
  }

  return response.json()
}

