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

  useEffect(() => {
    const validateAndSaveAuth = async () => {
      const accessToken = searchParams.get("access-token");
      const uid = searchParams.get("uid");
      const client = searchParams.get("client");
      const expiry = searchParams.get("expiry");
      const error = searchParams.get("error");
      const provider = searchParams.get("provider");

      console.log("Received auth params:", {
        accessToken: accessToken ? "exists" : "missing",
        uid: uid ? "exists" : "missing",
        client: client ? "exists" : "missing",
        expiry: expiry ? "exists" : "missing",
        error,
        provider,
      });

      if (error) {
        const decodedError = decodeURIComponent(error);
        const errorMessage = provider
          ? `${
              provider === "google" ? "Google" : "Twitter"
            }での認証に失敗しました: ${decodedError}`
          : decodedError;
        setError(errorMessage);
        console.error("Auth error:", errorMessage);
        setTimeout(() => {
          router.push(`/login?error=${encodeURIComponent(errorMessage)}`);
        }, 2000);
        return;
      }

      if (accessToken && uid && client) {
        try {
          console.log("Validating token with backend...");

          // トークンの検証とユーザー情報の取得
          const response = await fetch(`${API_URL}/auth/validate_token`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "access-token": accessToken,
              client: client,
              uid: uid,
            },
          });

          if (!response.ok) {
            throw new Error("トークンの検証に失敗しました");
          }

          const data = await response.json();
          console.log("Token validation successful:", data);

          // トークン情報を保存
          Cookies.set("access-token", accessToken, {
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            expires: 7,
          });
          Cookies.set("uid", uid, {
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            expires: 7,
          });
          Cookies.set("client", client, {
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            expires: 7,
          });
          if (expiry) {
            Cookies.set("expiry", expiry, {
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              expires: 7,
            });
          }

          // ユーザー情報とトークンをローカルストレージに保存
          localStorage.setItem(
            "auth",
            JSON.stringify({
              user: data.data,
              headers: {
                "access-token": accessToken,
                client,
                uid,
                expiry,
              },
            })
          );

          console.log("Auth data saved, redirecting to home...");
          router.push("/");
        } catch (err) {
          console.error("Token validation error:", err);
          const errorMessage =
            "認証情報の検証に失敗しました。もう一度お試しください。";
          setError(errorMessage);
          setTimeout(() => {
            router.push(`/login?error=${encodeURIComponent(errorMessage)}`);
          }, 2000);
        }
      } else {
        const errorMessage =
          "認証に失敗しました。必要な認証情報が不足しています。";
        console.error("Missing required auth params");
        setError(errorMessage);
        setTimeout(() => {
          router.push(`/login?error=${encodeURIComponent(errorMessage)}`);
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
              認証中...
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              自動的にホームページに移動します
            </Typography>
          </>
        )}
      </Box>
    </Container>
  );
}
