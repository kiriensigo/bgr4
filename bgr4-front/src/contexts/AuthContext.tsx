"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
} | null;

type AuthContextType = {
  user: User;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
  getAuthHeaders: () => Record<string, string>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  isLoading: true,
  getAuthHeaders: () => ({}),
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // ローカルストレージからユーザー情報とトークンを取得
    const storedAuth = localStorage.getItem("auth");
    if (storedAuth) {
      const { user: storedUser } = JSON.parse(storedAuth);
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const getAuthHeaders = () => {
    const storedAuth = localStorage.getItem("auth");
    if (!storedAuth) return {};

    const { headers } = JSON.parse(storedAuth);
    return headers || {};
  };

  const handleAuthResponse = async (response: Response) => {
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.errors?.[0] || errorData.error || "認証に失敗しました"
      );
    }

    const data = await response.json();
    const authHeaders = {
      "access-token": response.headers.get("access-token"),
      client: response.headers.get("client"),
      uid: response.headers.get("uid"),
      expiry: response.headers.get("expiry"),
      "token-type": response.headers.get("token-type"),
    };

    // 全てのヘッダーが存在することを確認
    const requiredHeaders = [
      "access-token",
      "client",
      "uid",
      "expiry",
      "token-type",
    ];
    const hasAllHeaders = requiredHeaders.every(
      (header) => authHeaders[header as keyof typeof authHeaders]
    );

    if (hasAllHeaders) {
      localStorage.setItem(
        "auth",
        JSON.stringify({
          user: data.data,
          headers: authHeaders,
        })
      );
      setUser(data.data);
      return data;
    }

    throw new Error("認証ヘッダーが不完全です");
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/sign_in`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await handleAuthResponse(response);
      return data;
    } catch (error) {
      console.error("ログインエラー:", error);
      throw error;
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          password_confirmation: password,
          confirm_success_url: `${window.location.origin}/login`,
        }),
      });

      const data = await response.json();
      if (data.status === "success") {
        router.push(
          "/login?message=" +
            encodeURIComponent(
              "確認メールを送信しました。メールを確認して登録を完了してください"
            )
        );
      } else {
        throw new Error(data.errors?.[0] || "新規登録に失敗しました");
      }
    } catch (error) {
      console.error("新規登録エラー:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const headers = getAuthHeaders();
      if (Object.keys(headers).length > 0) {
        await fetch(`${API_URL}/auth/sign_out`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
        });
      }
    } catch (error) {
      console.error("ログアウトエラー:", error);
    } finally {
      setUser(null);
      localStorage.removeItem("auth");
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, signIn, signUp, signOut, isLoading, getAuthHeaders }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
