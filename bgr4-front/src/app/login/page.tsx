"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/api";
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
import TwitterIcon from "@mui/icons-material/Twitter";
import GoogleIcon from "@mui/icons-material/Google";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const redirect = searchParams.get("redirect") || "/";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(formData.email, formData.password);
      router.push(redirect);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "ログインに失敗しました"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  };

  const handleTwitterLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/twitter`;
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            ログイン
          </Typography>

          {message && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {message}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="メールアドレス"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              required
              autoFocus
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
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3 }}
            >
              {loading ? "ログイン中..." : "ログイン"}
            </Button>

            <Divider sx={{ my: 2 }}>または</Divider>

            <Button
              variant="contained"
              color="primary"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleLogin}
              fullWidth
              sx={{ mt: 2 }}
            >
              Googleでログイン
            </Button>

            <Button
              variant="contained"
              fullWidth
              startIcon={<TwitterIcon />}
              sx={{
                mt: 1,
                mb: 2,
                textTransform: "none",
                fontSize: "1rem",
              }}
              onClick={handleTwitterLogin}
            >
              Twitterでログイン
            </Button>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                アカウントをお持ちでない方は
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
                  新規会員登録
                </Button>
              </Link>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}
