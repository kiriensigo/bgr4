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

export async function postReview(gameId: string, reviewData: any) {
  const token = Cookies.get('token');
  
  if (!token) {
    throw new Error('ログインが必要です');
  }

  try {
    const response = await api.post(`/games/${gameId}/reviews`, {
      review: reviewData
    });

    return response.data;
  } catch (error) {
    console.error('Review post error:', error);
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error('ログインが必要です');
      }
      throw new Error(error.response?.data?.error || 'レビューの投稿に失敗しました');
    }
    throw error;
  }
}

export async function getReviews(gameId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/reviews`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('レビューの取得に失敗しました');
    }

    return await response.json();
  } catch (error) {
    console.error('Reviews fetch error:', error);
    throw new Error('レビューの取得に失敗しました');
  }
}

export default api

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000/api/v1'

export async function createReview(gameId: string, reviewData: any) {
  const token = localStorage.getItem('token'); // または適切な場所からトークンを取得

  try {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // トークンを追加
      },
      credentials: 'include',
      body: JSON.stringify({ review: reviewData })
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 401) {
        throw new Error('ログインが必要です');
      }
      throw new Error(errorData.error || 'レビューの投稿に失敗しました');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

export async function login(email: string, password: string) {
  try {
    const response = await api.post('/auth/login', {
      email,
      password
    });

    const { token } = response.data;
    Cookies.set('token', token); // トークンをCookieに保存

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error('メールアドレスまたはパスワードが正しくありません');
      }
      throw new Error(error.response?.data?.error || 'ログインに失敗しました');
    }
    throw error;
  }
}

export function logout() {
  Cookies.remove('token');
}

export async function signup(data: {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}) {
  try {
    const response = await api.post('/auth/signup', {
      user: {  // userパラメータでラップする
        name: data.name,
        email: data.email,
        password: data.password,
        password_confirmation: data.passwordConfirmation  // スネークケースに変更
      }
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 422) {
        throw new Error(error.response.data.error || '入力内容に誤りがあります');
      }
      throw new Error(error.response?.data?.error || '登録に失敗しました');
    }
    throw error;
  }
}

export async function getAllReviews() {
  try {
    const response = await fetch(`${API_BASE_URL}/reviews/all`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('レビューの取得に失敗しました');
    }

    return await response.json();
  } catch (error) {
    console.error('Reviews fetch error:', error);
    throw new Error('レビューの取得に失敗しました');
  }
}

// ソーシャルログイン用の関数を追加
export const socialLogin = async (provider: 'google' | 'twitter') => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/${provider}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('ソーシャルログインに失敗しました');
  }

  return response.json();
};

// コールバック処理用の関数
export const handleAuthCallback = async (token: string) => {
  if (token) {
    localStorage.setItem('token', token);
    return true;
  }
  return false;
};

