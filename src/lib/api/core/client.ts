import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

// API設定
const API_URL =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
    : "http://api:3000"; // コンテナ名でアクセス

const API_BASE_URL = `${API_URL}/api/v1`;

// HTTPクライアントの作成
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30秒タイムアウト
});

// リクエストインターセプター（ログ出力）
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    if (config.data) {
      console.log("Request data:", config.data);
    }
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// レスポンスインターセプター（エラーハンドリング）
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`API Response: ${response.status} from ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error("API Error:", {
      status: error.response?.status,
      message: error.response?.data?.error || error.message,
      url: error.config?.url,
    });

    // 統一エラーレスポンス形式に変換
    const normalizedError = {
      status: error.response?.status || 500,
      message:
        error.response?.data?.error ||
        error.message ||
        "予期せぬエラーが発生しました",
      details: error.response?.data?.details,
    };

    return Promise.reject(normalizedError);
  }
);

// 共通レスポンス型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: any;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  pagination: {
    current_page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
    has_next_page: boolean;
    has_prev_page: boolean;
    next_page?: number;
    prev_page?: number;
  };
}

// APIリクエストヘルパー関数
export class ApiClient {
  static async get<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await apiClient.get(url, config);
    return response.data;
  }

  static async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await apiClient.post(url, data, config);
    return response.data;
  }

  static async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await apiClient.put(url, data, config);
    return response.data;
  }

  static async delete<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await apiClient.delete(url, config);
    return response.data;
  }

  static async patch<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await apiClient.patch(url, data, config);
    return response.data;
  }
}

export default apiClient;
