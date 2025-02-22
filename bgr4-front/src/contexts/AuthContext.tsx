"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

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

  const getHostname = () => {
    if (typeof window === "undefined") return "";
    return window.location.hostname === "localhost"
      ? "localhost"
      : window.location.hostname;
  };

  const cookieOptions = {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    expires: 7,
    path: "/",
    domain: getHostname(),
  };

  const clearAllAuthCookies = () => {
    const cookieOptions = {
      path: "/",
      domain: getHostname(),
    };

    ["access-token", "client", "uid", "expiry"].forEach((key) => {
      Cookies.remove(key, cookieOptions);
    });

    if (typeof window !== "undefined") {
      localStorage.removeItem("auth");
    }

    console.log("Cleared all auth cookies:", {
      accessToken: Cookies.get("access-token"),
      client: Cookies.get("client"),
      uid: Cookies.get("uid"),
      expiry: Cookies.get("expiry"),
    });
  };

  const checkAuth = async () => {
    try {
      const accessToken = Cookies.get("access-token");
      const client = Cookies.get("client");
      const uid = Cookies.get("uid");
      const expiry = Cookies.get("expiry");

      if (!accessToken || !client || !uid) {
        clearAllAuthCookies();
        setUser(null);
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/auth/validate_token`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "access-token": accessToken,
          client: client,
          uid: uid,
        },
        credentials: "include",
      });

      if (!response.ok) {
        clearAllAuthCookies();
        setUser(null);
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      if (data.success) {
        setUser(data.data);

        // 新しいトークンがレスポンスヘッダーにある場合のみ更新
        const newAccessToken = response.headers.get("access-token");
        const newClient = response.headers.get("client");
        const newUid = response.headers.get("uid");
        const newExpiry = response.headers.get("expiry");

        if (newAccessToken && newClient && newUid && newExpiry) {
          const tokens = {
            "access-token": newAccessToken,
            client: newClient,
            uid: newUid,
            expiry: newExpiry,
          };

          Object.entries(tokens).forEach(([key, value]) => {
            if (value) {
              Cookies.set(key, value, cookieOptions);
            }
          });
        }
      } else {
        clearAllAuthCookies();
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check error:", error);
      clearAllAuthCookies();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const getAuthHeaders = () => {
    const headers: Record<string, string> = {};
    const accessToken = Cookies.get("access-token");
    const client = Cookies.get("client");
    const uid = Cookies.get("uid");
    const expiry = Cookies.get("expiry");

    console.log("Getting auth headers from cookies:", {
      accessToken,
      client,
      uid,
      expiry,
    });

    if (accessToken && client && uid) {
      headers["access-token"] = accessToken;
      headers.client = client;
      headers.uid = uid;
      if (expiry) headers.expiry = expiry;
      return headers;
    }

    return headers;
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
    };

    // 全てのヘッダーが存在することを確認
    const requiredHeaders = ["access-token", "client", "uid"];
    const hasAllHeaders = requiredHeaders.every(
      (header) => authHeaders[header as keyof typeof authHeaders]
    );

    if (hasAllHeaders) {
      clearAllAuthCookies();

      // 新しいトークンを保存
      Object.entries(authHeaders).forEach(([key, value]) => {
        if (value) {
          Cookies.set(key, value, cookieOptions);
        }
      });

      console.log("Cookies after setting in handleAuthResponse:", {
        accessToken: Cookies.get("access-token"),
        client: Cookies.get("client"),
        uid: Cookies.get("uid"),
        expiry: Cookies.get("expiry"),
      });

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
      clearAllAuthCookies();
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
