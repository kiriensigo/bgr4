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

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Cookieからトークン情報を取得
        const accessToken = Cookies.get("access-token");
        const client = Cookies.get("client");
        const uid = Cookies.get("uid");

        console.log("Checking auth with tokens:", { accessToken, client, uid });

        if (accessToken && client && uid) {
          const headers = {
            "access-token": accessToken,
            client,
            uid,
          };

          console.log("Validating token with headers:", headers);

          const response = await fetch(`${API_URL}/auth/validate_token`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...headers,
            },
            credentials: "include",
          });

          if (response.ok) {
            const data = await response.json();
            console.log("Token validation successful:", data);

            // レスポンスヘッダーから新しいトークンを取得
            const newAccessToken = response.headers.get("access-token");
            const newClient = response.headers.get("client");
            const newUid = response.headers.get("uid");
            const newExpiry = response.headers.get("expiry");

            // 新しいトークンが存在する場合は更新
            if (newAccessToken) {
              console.log("Updating tokens with new values");
              Cookies.set("access-token", newAccessToken, {
                secure: true,
                sameSite: "lax",
              });
              if (newClient)
                Cookies.set("client", newClient, {
                  secure: true,
                  sameSite: "lax",
                });
              if (newUid)
                Cookies.set("uid", newUid, { secure: true, sameSite: "lax" });
              if (newExpiry)
                Cookies.set("expiry", newExpiry, {
                  secure: true,
                  sameSite: "lax",
                });

              headers["access-token"] = newAccessToken;
              if (newClient) headers.client = newClient;
              if (newUid) headers.uid = newUid;
            }

            setUser(data.data);
            localStorage.setItem(
              "auth",
              JSON.stringify({
                user: data.data,
                headers,
              })
            );
          } else {
            console.log("Token validation failed, clearing auth data");
            // トークンが無効な場合、認証データをクリア
            Cookies.remove("access-token");
            Cookies.remove("client");
            Cookies.remove("uid");
            Cookies.remove("expiry");
            localStorage.removeItem("auth");
            setUser(null);
          }
        } else {
          console.log("No tokens found in cookies");
          const storedAuth = localStorage.getItem("auth");
          if (storedAuth) {
            const { user: storedUser, headers } = JSON.parse(storedAuth);
            // ローカルストレージのトークンで再検証
            if (headers && headers["access-token"]) {
              console.log("Attempting to validate stored tokens");
              const response = await fetch(`${API_URL}/auth/validate_token`, {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  ...headers,
                },
                credentials: "include",
              });

              if (response.ok) {
                const data = await response.json();
                console.log("Stored token validation successful");
                setUser(data.data);
              } else {
                console.log(
                  "Stored token validation failed, clearing auth data"
                );
                localStorage.removeItem("auth");
                setUser(null);
              }
            } else {
              setUser(storedUser);
            }
          }
        }
      } catch (error) {
        console.error("Auth check error:", error);
        // エラー時は認証データをクリア
        Cookies.remove("access-token");
        Cookies.remove("client");
        Cookies.remove("uid");
        Cookies.remove("expiry");
        localStorage.removeItem("auth");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const getAuthHeaders = () => {
    const headers: Record<string, string> = {};
    const accessToken = Cookies.get("access-token");
    const client = Cookies.get("client");
    const uid = Cookies.get("uid");

    if (accessToken && client && uid) {
      headers["access-token"] = accessToken;
      headers.client = client;
      headers.uid = uid;
      const expiry = Cookies.get("expiry");
      if (expiry) headers.expiry = expiry;
      return headers;
    }

    const storedAuth = localStorage.getItem("auth");
    if (storedAuth) {
      const { headers: storedHeaders } = JSON.parse(storedAuth);
      return storedHeaders || {};
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
      "token-type": response.headers.get("token-type"),
    };

    // 全てのヘッダーが存在することを確認
    const requiredHeaders = ["access-token", "client", "uid", "expiry"];
    const hasAllHeaders = requiredHeaders.every(
      (header) => authHeaders[header as keyof typeof authHeaders]
    );

    if (hasAllHeaders) {
      // トークン情報をCookieとローカルストレージの両方に保存
      Cookies.set("access-token", authHeaders["access-token"] || "", {
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: 7,
      });
      Cookies.set("client", authHeaders.client || "", {
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: 7,
      });
      Cookies.set("uid", authHeaders.uid || "", {
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: 7,
      });
      if (authHeaders.expiry) {
        Cookies.set("expiry", authHeaders.expiry, {
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          expires: 7,
        });
      }

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
      // Cookieとローカルストレージをクリア
      Cookies.remove("access-token");
      Cookies.remove("client");
      Cookies.remove("uid");
      Cookies.remove("expiry");
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
