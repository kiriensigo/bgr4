"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import { Container, CircularProgress, Typography, Box } from "@mui/material";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  const clearAllAuthCookies = () => {
    const cookieOptions = {
      path: "/",
      domain:
        window.location.hostname === "localhost"
          ? "localhost"
          : window.location.hostname,
    };

    // 既存のトークンを確実にクリア
    ["access-token", "client", "uid", "expiry"].forEach((key) => {
      Cookies.remove(key, cookieOptions);
    });

    localStorage.removeItem("auth");

    console.log("Cleared all auth cookies:", {
      accessToken: Cookies.get("access-token"),
      client: Cookies.get("client"),
      uid: Cookies.get("uid"),
      expiry: Cookies.get("expiry"),
    });
  };

  const saveAuthData = (tokens: Record<string, string>, userData: any) => {
    const cookieOptions = {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      expires: 7,
      path: "/",
      domain:
        window.location.hostname === "localhost"
          ? "localhost"
          : window.location.hostname,
    };

    // トークンを保存
    Object.entries(tokens).forEach(([key, value]) => {
      if (value) {
        try {
          Cookies.set(key, value, cookieOptions);
        } catch (e) {
          console.error(`Error setting cookie ${key}:`, e);
        }
      }
    });

    // ユーザー情報を保存
    try {
      localStorage.setItem(
        "auth",
        JSON.stringify({
          user: userData,
          headers: tokens,
        })
      );
    } catch (e) {
      console.error("Error saving to localStorage:", e);
    }

    console.log("Auth data saved. Current cookies:", {
      accessToken: Cookies.get("access-token"),
      client: Cookies.get("client"),
      uid: Cookies.get("uid"),
      expiry: Cookies.get("expiry"),
    });
  };

  useEffect(() => {
    const validateAndSaveAuth = async () => {
      try {
        // 既存のトークンをクリア
        clearAllAuthCookies();

        // URLパラメータからトークン情報を取得
        const accessToken = searchParams.get("access-token");
        const uid = searchParams.get("uid");
        const client = searchParams.get("client");
        const expiry = searchParams.get("expiry");

        console.log("Received auth params:", {
          accessToken: accessToken ? "exists" : "missing",
          uid: uid ? "exists" : "missing",
          client: client ? "exists" : "missing",
          expiry: expiry ? "exists" : "missing",
        });

        if (!accessToken || !uid || !client || !expiry) {
          throw new Error("必要な認証情報が不足しています");
        }

        const tokens = {
          "access-token": accessToken,
          client,
          uid,
          expiry,
        };

        // トークンを一時的に保存
        saveAuthData(tokens, null);

        // トークンの検証
        const response = await fetch(`${API_URL}/auth/validate_token`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...tokens,
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("トークンの検証に失敗しました");
        }

        const data = await response.json();

        if (data.success) {
          // 検証成功後、最終的なトークンとユーザー情報を保存
          saveAuthData(tokens, data.data);

          // 少し待ってからリダイレクト
          setTimeout(() => {
            setIsProcessing(false);
            router.push("/");
          }, 1000);
        } else {
          throw new Error("認証に失敗しました");
        }
      } catch (error) {
        console.error("Authentication error:", error);
        clearAllAuthCookies();
        setError(error instanceof Error ? error.message : "認証に失敗しました");
        setIsProcessing(false);

        setTimeout(() => {
          router.push(
            `/login?error=${encodeURIComponent(
              error instanceof Error ? error.message : "認証に失敗しました"
            )}`
          );
        }, 2000);
      }
    };

    validateAndSaveAuth();
  }, [router, searchParams]);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          gap: 2,
        }}
      >
        {error ? (
          <Typography color="error" variant="h6" align="center">
            {error}
          </Typography>
        ) : (
          <>
            <CircularProgress />
            <Typography variant="h6" align="center">
              {isProcessing ? "認証中..." : "認証が完了しました"}
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              {isProcessing
                ? "しばらくお待ちください"
                : "自動的にホームページに移動します"}
            </Typography>
          </>
        )}
      </Box>
    </Container>
  );
}
