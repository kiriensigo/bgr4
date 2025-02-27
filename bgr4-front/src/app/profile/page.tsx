"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Typography,
  Box,
  Avatar,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Divider,
} from "@mui/material";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, isLoading, getAuthHeaders } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    currentPassword: "",
    newPassword: "",
    newPasswordConfirmation: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    } else if (user) {
      // ユーザープロフィールを取得
      const fetchUserProfile = async () => {
        try {
          const response = await fetch(
            `${
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
            }/api/v1/users/profile`,
            {
              headers: getAuthHeaders(),
            }
          );

          if (response.ok) {
            const data = await response.json();
            setFormData((prev) => ({
              ...prev,
              name: user.name,
              bio: data.bio || "",
            }));
          } else {
            // プロフィールが取得できない場合は名前だけセット
            setFormData((prev) => ({
              ...prev,
              name: user.name,
              bio: "",
            }));
          }
        } catch (error) {
          console.error("プロフィール取得エラー:", error);
          setFormData((prev) => ({
            ...prev,
            name: user.name,
            bio: "",
          }));
        }
      };

      fetchUserProfile();
    }
  }, [user, isLoading, router, getAuthHeaders]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // bioフィールドの場合、100文字制限を適用
    if (name === "bio" && value.length > 100) {
      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // プロフィール情報の更新
      const profileResponse = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
        }/api/v1/users/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            name: formData.name,
            bio: formData.bio,
          }),
        }
      );

      if (!profileResponse.ok) {
        const data = await profileResponse.json();
        throw new Error(data.error || "プロフィールの更新に失敗しました");
      }

      // パスワード変更が入力されている場合のみパスワード更新
      if (formData.currentPassword && formData.newPassword) {
        const passwordResponse = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
          }/auth/password`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...getAuthHeaders(),
            },
            body: JSON.stringify({
              current_password: formData.currentPassword,
              password: formData.newPassword,
              password_confirmation: formData.newPasswordConfirmation,
            }),
          }
        );

        if (!passwordResponse.ok) {
          const data = await passwordResponse.json();
          throw new Error(data.errors?.[0] || "パスワードの更新に失敗しました");
        }
      }

      setSuccess("プロフィールを更新しました");
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        newPasswordConfirmation: "",
      }));
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("予期せぬエラーが発生しました");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !user) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container component="main" maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mb: 4,
            }}
          >
            <Avatar
              src={user.avatar_url}
              alt={user.name}
              sx={{ width: 120, height: 120, mb: 2 }}
            />
            <Typography variant="h4" component="h1" gutterBottom>
              プロフィール設定
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  基本情報
                </Typography>
                <TextField
                  fullWidth
                  label="ユーザー名"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="自己紹介"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  margin="normal"
                  multiline
                  rows={3}
                  inputProps={{ maxLength: 100 }}
                  helperText={`${formData.bio.length}/100文字`}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" gutterBottom>
                  パスワード変更
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  パスワードを変更する場合のみ入力してください
                </Typography>
                <TextField
                  fullWidth
                  label="現在のパスワード"
                  type="password"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="新しいパスワード"
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  margin="normal"
                  helperText="8文字以上で、英大文字・小文字・数字をそれぞれ1文字以上含める必要があります"
                />
                <TextField
                  fullWidth
                  label="新しいパスワード（確認）"
                  type="password"
                  name="newPasswordConfirmation"
                  value={formData.newPasswordConfirmation}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isSubmitting}
                sx={{ minWidth: 200 }}
              >
                {isSubmitting ? "更新中..." : "更新する"}
              </Button>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}
