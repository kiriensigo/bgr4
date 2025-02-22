"use client";

import { useState } from "react";
import Link from "next/link";
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
import { useAuth } from "@/contexts/AuthContext";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function SignupPage() {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirmation: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // エラーをクリア
    setError(null);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("ユーザー名を入力してください");
      return false;
    }
    if (!formData.email.trim()) {
      setError("メールアドレスを入力してください");
      return false;
    }
    if (!formData.password) {
      setError("パスワードを入力してください");
      return false;
    }
    if (formData.password.length < 8) {
      setError("パスワードは8文字以上で入力してください");
      return false;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      setError(
        "パスワードは英大文字・小文字・数字をそれぞれ1文字以上含める必要があります"
      );
      return false;
    }
    if (formData.password !== formData.passwordConfirmation) {
      setError("パスワードが一致しません");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      await signUp(formData.name, formData.email, formData.password);
      // 登録成功後は自動的にホームページにリダイレクトされます
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("予期せぬエラーが発生しました。もう一度お試しください。");
      }
    } finally {
      setLoading(false);
    }
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
            新規会員登録
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
              Googleで登録
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
              X（Twitter）で登録
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

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="ユーザー名"
              name="name"
              value={formData.name}
              onChange={handleChange}
              margin="normal"
              required
              autoFocus
            />

            <TextField
              fullWidth
              label="メールアドレス"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="パスワード"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required
              helperText="8文字以上で、英大文字・小文字・数字をそれぞれ1文字以上含める必要があります"
            />

            <TextField
              fullWidth
              label="パスワード（確認）"
              type="password"
              name="passwordConfirmation"
              value={formData.passwordConfirmation}
              onChange={handleChange}
              margin="normal"
              required
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3 }}
            >
              {loading ? "登録中..." : "登録する"}
            </Button>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                すでにアカウントをお持ちの方はこちら
              </Typography>
              <Link href="/login" style={{ textDecoration: "none" }}>
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
                  ログイン
                </Button>
              </Link>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}
