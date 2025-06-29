"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../contexts/AuthContext";
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Snackbar,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { getGame, updateGame } from "../../../../lib/api";
import Link from "next/link";

export default function EditGamePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, loading: authLoading, getAuthHeaders } = useAuth();
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // 現在の年から過去30年分の選択肢を生成
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 31 }, (_, i) => currentYear - i);

  const [formData, setFormData] = useState({
    japanese_name: "",
    japanese_description: "",
    japanese_image_url: "",
    min_players: "",
    max_players: "",
    play_time: "",
    min_play_time: "",
    japanese_publisher: "",
    designer: "",
    japanese_release_year: "",
    is_unreleased: false,
  });

  // ゲーム情報を取得
  useEffect(() => {
    const loadGame = async () => {
      try {
        // AuthContextから取得したgetAuthHeaders関数を使用
        const headers = user ? getAuthHeaders() : undefined;

        console.log("Loading game with ID:", params.id);
        const gameData = await getGame(params.id, headers);
        setGame(gameData);

        console.log("Game data loaded:", gameData);

        // 日本語版発売日から年だけを抽出
        let releaseYear = "";
        let isUnreleased = false;

        if (gameData.japanese_release_date) {
          const date = new Date(gameData.japanese_release_date);
          releaseYear = date.getFullYear().toString();
        } else {
          // 発売日がnullの場合は未発売とみなす
          isUnreleased = true;
        }

        // フォームに初期値をセット
        setFormData({
          japanese_name: gameData.japanese_name || "",
          japanese_description: gameData.japanese_description || "",
          japanese_image_url: gameData.japanese_image_url || "",
          min_players: gameData.min_players?.toString() || "",
          max_players: gameData.max_players?.toString() || "",
          play_time: gameData.play_time?.toString() || "",
          min_play_time: gameData.min_play_time?.toString() || "",
          japanese_publisher: gameData.japanese_publisher || "",
          designer: gameData.designer || "",
          japanese_release_year: releaseYear,
          is_unreleased: isUnreleased,
        });

        setLoading(false);
      } catch (err) {
        console.error("Failed to load game:", err);
        setError("ゲーム情報の取得に失敗しました");
        setLoading(false);
      }
    };

    if (!authLoading) {
      loadGame();
    }
  }, [params.id, authLoading, user, getAuthHeaders]);

  // 認証チェック
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/games/${params.id}`);
    }
  }, [user, authLoading, router, params.id]);

  // ユーザーのレビュー数を取得
  useEffect(() => {
    if (user) {
      const fetchReviewCount = async () => {
        setLoadingReviews(true);
        try {
          const response = await fetch(
            `${
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
            }/api/v1/reviews/my`,
            {
              headers: {
                ...getAuthHeaders(),
              },
              credentials: "include",
            }
          );

          if (response.ok) {
            const data = await response.json();
            setReviewCount(
              Array.isArray(data.reviews) ? data.reviews.length : 0
            );
          } else {
            console.error("レビュー数の取得に失敗しました:", response.status);
            setReviewCount(0);
          }
        } catch (error) {
          console.error("レビュー数の取得に失敗しました:", error);
          setReviewCount(0);
        } finally {
          setLoadingReviews(false);
        }
      };

      fetchReviewCount();
    }
  }, [user, getAuthHeaders]);

  // 管理者かどうかを判定
  const isAdmin =
    user?.email?.endsWith("@boardgamereview.com") ||
    user?.email === "admin@example.com";

  // レビュー数が5件以上あるか、または管理者かどうかを判定
  const canEditGame = reviewCount >= 5 || isAdmin;

  // フォーム入力の処理
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // セレクト入力の処理
  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // チェックボックスの処理
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));

    // 未発売がチェックされたら発売年をクリア
    if (name === "is_unreleased" && checked) {
      setFormData((prev) => ({ ...prev, japanese_release_year: "" }));
    }
  };

  // 数値入力の検証
  const validateNumberInput = (value: string) => {
    return value === "" || /^\d+$/.test(value);
  };

  // フォーム送信の処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // ユーザーが認証されていない場合は処理を中止
    if (!user) {
      setError("ログインが必要です");
      setSubmitting(false);
      return;
    }

    try {
      // AuthContextから取得したgetAuthHeaders関数を使用
      const headers = getAuthHeaders();

      // ヘッダーが空の場合はエラー
      if (
        !headers ||
        Object.keys(headers).filter((key) => key !== "Content-Type").length ===
          0
      ) {
        setError("認証情報が取得できません。再度ログインしてください。");
        setSubmitting(false);
        return;
      }

      console.log("Auth headers from context:", headers);
      console.log("Updating game with ID:", params.id);
      console.log("Game data to update:", formData);

      // 数値フィールドの変換
      const gameData = {
        ...formData,
        min_players: formData.min_players
          ? parseInt(formData.min_players)
          : null,
        max_players: formData.max_players
          ? parseInt(formData.max_players)
          : null,
        play_time: formData.play_time ? parseInt(formData.play_time) : null,
        min_play_time: formData.min_play_time
          ? parseInt(formData.min_play_time)
          : null,
      };

      // 日本語版発売日の処理
      if (formData.is_unreleased) {
        // 未発売の場合はnull
        gameData.japanese_release_date = null;
      } else if (formData.japanese_release_year) {
        // 年のみの場合は1月1日として設定
        gameData.japanese_release_date = new Date(
          parseInt(formData.japanese_release_year),
          0,
          1
        ).toISOString();
      } else {
        // 未設定の場合はnull
        gameData.japanese_release_date = null;
      }

      // 不要なフィールドを削除
      delete gameData.japanese_release_year;
      delete gameData.is_unreleased;

      // ゲーム情報を更新
      // ゲームのbgg_idを使用（game.bgg_idまたはgame.id）
      const gameId = game?.bgg_id || params.id;
      console.log("Using game ID for update:", gameId);

      await updateGame(gameId, gameData, headers);
      setSuccess(true);

      // 3秒後にゲーム詳細ページに戻る（リフレッシュフラグ付き）
      setTimeout(() => {
        router.push(`/games/${params.id}?refresh=true`);
      }, 3000);
    } catch (err: any) {
      console.error("Failed to update game:", err);
      setError(err.message || "ゲーム情報の更新に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="50vh"
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            ログインが必要です
          </Typography>
          <Typography variant="body1" paragraph>
            ゲーム情報を編集するには、ログインが必要です。
          </Typography>
          <Button
            component={Link}
            href={`/login?redirect=/games/${params.id}/edit`}
            variant="contained"
            color="primary"
          >
            ログインページへ
          </Button>
        </Paper>
      </Container>
    );
  }

  // レビュー数が足りない場合はメッセージを表示
  if (!canEditGame && !loadingReviews) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            レビュー数が不足しています
          </Typography>
          <Typography variant="body1" paragraph>
            ゲーム情報を編集するには、5件以上のレビューが必要です。現在のレビュー数:{" "}
            {reviewCount}件
          </Typography>
          <Typography variant="body1" paragraph>
            より多くのボードゲームをレビューして、ゲーム編集機能をアンロックしましょう！
          </Typography>
          <Button
            component={Link}
            href={`/games/${params.id}`}
            variant="contained"
            color="primary"
            sx={{ mr: 2 }}
          >
            ゲーム詳細へ戻る
          </Button>
          <Button
            component={Link}
            href="/games"
            variant="outlined"
            color="primary"
            sx={{ mr: 2 }}
          >
            ゲーム一覧へ
          </Button>
          <Button
            component={Link}
            href="/reviews/my"
            variant="outlined"
            color="primary"
          >
            マイレビューへ
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          ゲーム情報の編集
        </Typography>

        {game && (
          <Typography variant="h6" gutterBottom>
            {game.name}
          </Typography>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="日本語名"
                name="japanese_name"
                variant="outlined"
                value={formData.japanese_name}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="日本語説明"
                name="japanese_description"
                variant="outlined"
                multiline
                rows={4}
                value={formData.japanese_description}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="日本語画像URL"
                name="japanese_image_url"
                variant="outlined"
                value={formData.japanese_image_url}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="最小プレイ人数"
                name="min_players"
                variant="outlined"
                value={formData.min_players}
                onChange={(e) => {
                  if (validateNumberInput(e.target.value)) {
                    handleChange(e);
                  }
                }}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="最大プレイ人数"
                name="max_players"
                variant="outlined"
                value={formData.max_players}
                onChange={(e) => {
                  if (validateNumberInput(e.target.value)) {
                    handleChange(e);
                  }
                }}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="最小プレイ時間（分）"
                name="min_play_time"
                variant="outlined"
                value={formData.min_play_time}
                onChange={(e) => {
                  if (validateNumberInput(e.target.value)) {
                    handleChange(e);
                  }
                }}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="プレイ時間（分）"
                name="play_time"
                variant="outlined"
                value={formData.play_time}
                onChange={(e) => {
                  if (validateNumberInput(e.target.value)) {
                    handleChange(e);
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="日本語版パブリッシャー"
                name="japanese_publisher"
                variant="outlined"
                value={formData.japanese_publisher}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="デザイナー"
                name="designer"
                variant="outlined"
                value={formData.designer}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl
                fullWidth
                variant="outlined"
                disabled={formData.is_unreleased}
              >
                <InputLabel id="release-year-label">日本語版発売年</InputLabel>
                <Select
                  labelId="release-year-label"
                  name="japanese_release_year"
                  value={formData.japanese_release_year}
                  onChange={handleSelectChange}
                  label="日本語版発売年"
                >
                  <MenuItem value="">
                    <em>未選択</em>
                  </MenuItem>
                  {years.map((year) => (
                    <MenuItem key={year} value={year.toString()}>
                      {year}年
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>発売年のみを選択してください</FormHelperText>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.is_unreleased}
                    onChange={handleCheckboxChange}
                    name="is_unreleased"
                    color="primary"
                  />
                }
                label="未発売"
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={submitting}
                sx={{ mt: 2 }}
              >
                更新する
                {submitting && <CircularProgress size={24} sx={{ ml: 1 }} />}
              </Button>
            </Grid>
          </Grid>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" sx={{ width: "100%" }}>
          ゲーム情報を更新しました。ゲーム詳細ページに戻ります。
        </Alert>
      </Snackbar>
    </Container>
  );
}
