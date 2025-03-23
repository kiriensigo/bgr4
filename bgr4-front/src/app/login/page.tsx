"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Divider,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import TwitterIcon from "@mui/icons-material/Twitter";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function LoginPage() {
  const { signIn } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signIn(formData.email, formData.password);
      router.push(redirect);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("予期せぬエラーが発生しました");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    console.log("Initiating Google login...");
    // ログイン前にキャッシュをクリア
    Cookies.remove("access-token");
    Cookies.remove("client");
    Cookies.remove("uid");
    Cookies.remove("expiry");
    localStorage.removeItem("auth");

    // 現在のタイムスタンプをクエリパラメータとして追加して、キャッシュを防ぐ
    const timestamp = new Date().getTime();
    window.location.href = `${API_URL}/auth/google_oauth2?t=${timestamp}`;
  };

  const handleSocialLogin = (provider: "google_oauth2" | "twitter2") => {
    console.log(`Initiating ${provider} login...`);
    // ログイン前にキャッシュをクリア
    Cookies.remove("access-token");
    Cookies.remove("client");
    Cookies.remove("uid");
    Cookies.remove("expiry");
    localStorage.removeItem("auth");

    // 現在のタイムスタンプをクエリパラメータとして追加して、キャッシュを防ぐ
    const timestamp = new Date().getTime();
    window.location.href = `${API_URL}/auth/${provider}?t=${timestamp}`;
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box sx={{ my: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            ログイン
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<GoogleIcon />}
              onClick={() => handleSocialLogin("google_oauth2")}
              sx={{
                mb: 2,
                color: "#757575",
                borderColor: "#757575",
                "&:hover": {
                  borderColor: "#757575",
                  backgroundColor: "rgba(117, 117, 117, 0.04)",
                },
              }}
            >
              Googleでログイン
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<TwitterIcon />}
              onClick={() => handleSocialLogin("twitter2")}
              sx={{
                color: "#1DA1F2",
                borderColor: "#1DA1F2",
                "&:hover": {
                  borderColor: "#1DA1F2",
                  backgroundColor: "rgba(29, 161, 242, 0.04)",
                },
              }}
            >
              X（Twitter）でログイン
            </Button>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              または
            </Typography>
          </Divider>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} id="login-form" name="login-form">
            <TextField
              fullWidth
              label="メールアドレス"
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              required
              autoFocus
              autoComplete="email"
            />

            <TextField
              fullWidth
              label="パスワード"
              type="password"
              name="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required
              autoComplete="current-password"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 3,
                backgroundColor: "#1976d2", // MUIのデフォルトの青色
                "&:hover": {
                  backgroundColor: "#115293", // ホバー時の色も調整
                },
              }}
            >
              {loading ? "ログイン中..." : "ログイン"}
            </Button>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                メールアドレスで新規登録はこちら
              </Typography>
              <Link href="/signup" style={{ textDecoration: "none" }}>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{
                    mt: 1,
                    mb: 2,
                    textTransform: "none",
                    fontSize: "1rem",
                  }}
                >
                  新規登録
                </Button>
              </Link>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}
