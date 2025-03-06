"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { postReview, getGame } from "@/lib/api";
import { FlashMessage } from "@/components/FlashMessage";
import { useAuth } from "@/contexts/AuthContext";
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Chip,
  Snackbar,
} from "@mui/material";
import { containerStyle, cardStyle, LAYOUT_CONFIG } from "@/styles/layout";
import { CustomSlider } from "@/components/GameEvaluationForm/CustomSlider";
import Cookies from "js-cookie";

interface Game {
  id: string;
  bgg_id: string;
  name: string;
  image_url: string;
  description: string;
  min_players: number;
  max_players: number;
  play_time: number;
  average_score: number;
}

interface GameDetails {
  id: string;
  name: string;
  image: string;
  bggLink: string;
  amazonLink: string;
  rakutenLink: string;
}

interface Review {
  overall_score: number;
  rule_complexity: number;
  luck_factor: number;
  interaction: number;
  downtime: number;
  recommended_players: string[];
  mechanics: string[];
  categories: string[];
  custom_tags: string;
  short_comment: string;
}

const MECHANICS = [
  "エリア支配",
  "ダイスロール",
  "オークション",
  "デッキ/バッグビルド",
  "拡大再生産",
  "エンジンビルド",
  "正体隠匿",
  "モジュラーボード",
  "ルート構築",
  "ドラフト",
  "バースト",
  "同時手番",
  "タイル配置",
  "プレイヤー別能力",
  "ワカプレ",
  "賭け",
];

const CATEGORIES = [
  "協力",
  "チーム戦",
  "子供",
  "ソロ向き",
  "ペア向き",
  "多人数向き",
  "推理",
  "ブラフ",
  "記憶",
  "交渉",
  "演技",
  "紙ペン",
  "動物",
  "かわいい",
  "映え",
  "カードゲーム",
  "トリテ",
  "パーティー",
  "パズル",
  "ウォーゲーム",
  "ワードゲーム",
  "レガシー・キャンペーン",
];

type NumericReviewKey = {
  [K in keyof Review]: Review[K] extends number ? K : never;
}[keyof Review];

export default function ReviewPage({ params }: { params: { id: string } }) {
  const { user, getAuthHeaders } = useAuth();
  const [game, setGame] = useState<GameDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const router = useRouter();

  const [review, setReview] = useState<Review>({
    overall_score: 7.5,
    rule_complexity: 3,
    luck_factor: 3,
    interaction: 3,
    downtime: 3,
    recommended_players: [],
    mechanics: [],
    categories: [],
    custom_tags: "",
    short_comment: "",
  });

  // ページロード時の認証チェック
  useEffect(() => {
    if (!user && !loading) {
      router.push(
        `/login?redirect=${encodeURIComponent(`/games/${params.id}/review`)}`
      );
    }
  }, [user, loading, router, params.id]);

  useEffect(() => {
    const headers = getAuthHeaders();
    if (
      !user ||
      !headers["access-token"] ||
      !headers["client"] ||
      !headers["uid"]
    ) {
      router.push(
        `/login?redirect=${encodeURIComponent(`/games/${params.id}/review`)}`
      );
      return;
    }

    async function fetchGameDetails() {
      try {
        setLoading(true);
        setError(null);

        const headers = getAuthHeaders();
        const gameData = await getGame(params.id, headers);
        setGame({
          id: params.id,
          name: gameData.name,
          image: gameData.image_url || "",
          bggLink: `https://boardgamegeek.com/boardgame/${params.id}`,
          amazonLink: `https://www.amazon.co.jp/s?k=${encodeURIComponent(
            gameData.name
          )}+ボードゲーム`,
          rakutenLink: `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(
            gameData.name
          )}+ボードゲーム/`,
        });

        // 既存のレビューを取得
        const reviewsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/games/${params.id}/reviews`,
          {
            headers: {
              "Content-Type": "application/json",
              ...headers,
            },
            credentials: "include",
          }
        );

        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json();
          const userReview = reviewsData.find(
            (review: any) => review.user.id === user?.id
          );
          if (userReview) {
            setExistingReview(userReview);
            // 既存のレビューデータでフォームを初期化
            setReview({
              overall_score: userReview.overall_score,
              rule_complexity: userReview.rule_complexity || 3,
              luck_factor: userReview.luck_factor || 3,
              interaction: userReview.interaction || 3,
              downtime: userReview.downtime || 3,
              recommended_players: userReview.recommended_players || [],
              mechanics: userReview.mechanics || [],
              categories: userReview.categories || [],
              custom_tags: (userReview.custom_tags || []).join(" "),
              short_comment: userReview.short_comment || "",
            });
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "エラーが発生しました");
        console.error("Game fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchGameDetails();
  }, [user, getAuthHeaders, params.id, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setReview((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSliderChange =
    (name: keyof Review) => (_event: Event, value: number | number[]) => {
      setReview((prev) => ({
        ...prev,
        [name]: value,
      }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (review.recommended_players.length === 0) {
      setFlashMessage("おすすめプレイ人数を選択してください");
      return;
    }

    if (!review.short_comment) {
      setFlashMessage("コメントを入力してください");
      return;
    }

    setSubmitting(true);

    try {
      const finalHeaders = getAuthHeaders();
      const reviewData = {
        overall_score: review.overall_score,
        rule_complexity: review.rule_complexity,
        luck_factor: review.luck_factor,
        interaction: review.interaction,
        downtime: review.downtime,
        recommended_players: review.recommended_players,
        mechanics: review.mechanics,
        categories: review.categories,
        custom_tags: review.custom_tags
          .split(/\s+/)
          .filter((tag) => tag.length > 0),
        short_comment: review.short_comment,
      };

      console.log("Sending review data:", { review: reviewData });

      await postReview(params.id, { review: reviewData }, finalHeaders);
      setSuccessMessage(
        existingReview ? "レビューを修正しました" : "レビューを投稿しました"
      );
      setTimeout(() => {
        router.push("/reviews/my");
      }, 2000);
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message === "ログインが必要です" ||
          error.message.includes("認証")
        ) {
          console.error("Authentication error:", error);
          // 認証エラーの場合、Cookieをクリアして再ログインを促す
          Object.keys(Cookies.get()).forEach((key) => {
            if (["access-token", "client", "uid", "expiry"].includes(key)) {
              Cookies.remove(key);
            }
          });
          router.push(
            `/login?redirect=${encodeURIComponent(
              `/games/${params.id}/review`
            )}`
          );
        } else {
          setFlashMessage(error.message);
        }
      } else {
        setFlashMessage("予期せぬエラーが発生しました");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !game) {
    return (
      <Container>
        <Typography color="error" align="center" sx={{ py: 8 }}>
          {error || "ゲームが見つかりませんでした"}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={containerStyle}>
      <Box sx={containerStyle}>
        <Link href={`/games/${params.id}`} style={{ textDecoration: "none" }}>
          <Button variant="outlined" sx={{ mb: 2 }}>
            ← 戻る
          </Button>
        </Link>

        <Paper elevation={3} sx={cardStyle}>
          <Grid container spacing={LAYOUT_CONFIG.gridSpacing}>
            <Grid item xs={12} md={4}>
              <Box sx={{ position: "relative", pt: "100%" }}>
                <Image
                  src={game.image}
                  alt={game.name}
                  fill
                  style={{ objectFit: "contain" }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <Typography variant="h4" component="h1" gutterBottom>
                {existingReview
                  ? `${game.name}のレビューを修正`
                  : `${game.name}のレビュー`}
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Link href={game.bggLink} target="_blank">
                  <Typography color="primary">BoardGameGeekで見る</Typography>
                </Link>
                <Link href={game.amazonLink} target="_blank">
                  <Typography color="primary">Amazonで見る</Typography>
                </Link>
                <Link href={game.rakutenLink} target="_blank">
                  <Typography color="primary">楽天で見る</Typography>
                </Link>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        <Paper elevation={3} sx={cardStyle}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={LAYOUT_CONFIG.gridSpacing}>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    総合評価: {review.overall_score || "0"}
                  </Typography>
                  <CustomSlider
                    value={review.overall_score}
                    onChange={handleSliderChange("overall_score")}
                    min={0}
                    max={10}
                    step={0.5}
                    marks={[
                      { value: 0, label: "0" },
                      { value: 2.5, label: "2.5" },
                      { value: 5, label: "5" },
                      { value: 7.5, label: "7.5" },
                      { value: 10, label: "10" },
                    ]}
                    valueLabelDisplay="auto"
                    disabled={submitting}
                    onChangeCommitted={(_event, value) => {
                      if (typeof value === "number" && value < 5) {
                        setReview((prev) => ({ ...prev, overall_score: 5 }));
                      }
                    }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 1 }}
                  >
                    （5点以上から選択可能)
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    ルールの複雑さ: {review.rule_complexity}
                  </Typography>
                  <CustomSlider
                    value={review.rule_complexity}
                    onChange={handleSliderChange("rule_complexity")}
                    min={1}
                    max={5}
                    step={1}
                    marks={[
                      { value: 1, label: "簡単" },
                      { value: 3, label: "普通" },
                      { value: 5, label: "複雑" },
                    ]}
                    valueLabelDisplay="auto"
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    運要素: {review.luck_factor}
                  </Typography>
                  <CustomSlider
                    value={review.luck_factor}
                    onChange={handleSliderChange("luck_factor")}
                    min={1}
                    max={5}
                    step={1}
                    marks={[
                      { value: 1, label: "低い" },
                      { value: 3, label: "普通" },
                      { value: 5, label: "高い" },
                    ]}
                    valueLabelDisplay="auto"
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    インタラクション: {review.interaction}
                  </Typography>
                  <CustomSlider
                    value={review.interaction}
                    onChange={handleSliderChange("interaction")}
                    min={1}
                    max={5}
                    step={1}
                    marks={[
                      { value: 1, label: "少ない" },
                      { value: 3, label: "普通" },
                      { value: 5, label: "多い" },
                    ]}
                    valueLabelDisplay="auto"
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    ダウンタイム: {review.downtime}
                  </Typography>
                  <CustomSlider
                    value={review.downtime}
                    onChange={handleSliderChange("downtime")}
                    min={1}
                    max={5}
                    step={1}
                    marks={[
                      { value: 1, label: "短い" },
                      { value: 3, label: "普通" },
                      { value: 5, label: "長い" },
                    ]}
                    valueLabelDisplay="auto"
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    必須項目: おすすめプレイ人数
                    <Box component="span" sx={{ color: "error.main", ml: 0.5 }}>
                      *
                    </Box>
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {[1, 2, 3, 4, 5, "6人以上"].map((num) => (
                      <Chip
                        key={num}
                        label={`${num}人`}
                        onClick={() => {
                          setReview((prev) => ({
                            ...prev,
                            recommended_players:
                              prev.recommended_players.includes(String(num))
                                ? prev.recommended_players.filter(
                                    (p) => p !== String(num)
                                  )
                                : [...prev.recommended_players, String(num)],
                          }));
                        }}
                        color={
                          review.recommended_players.includes(String(num))
                            ? "primary"
                            : "default"
                        }
                        sx={{ m: 0.5 }}
                      />
                    ))}
                  </Box>
                  {review.recommended_players.length === 0 && (
                    <Typography
                      color="error"
                      variant="caption"
                      sx={{ display: "block", mt: 1 }}
                    >
                      おすすめのプレイ人数をできるだけ多く選択してください
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    カテゴリー
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {CATEGORIES.map((category) => (
                      <Chip
                        key={category}
                        label={category}
                        onClick={() => {
                          setReview((prev) => ({
                            ...prev,
                            categories: prev.categories.includes(category)
                              ? prev.categories.filter((c) => c !== category)
                              : [...prev.categories, category],
                          }));
                        }}
                        color={
                          review.categories.includes(category)
                            ? "primary"
                            : "default"
                        }
                        sx={{ m: 0.5 }}
                      />
                    ))}
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    メカニクス
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {MECHANICS.map((mechanic) => (
                      <Chip
                        key={mechanic}
                        label={mechanic}
                        onClick={() => {
                          setReview((prev) => ({
                            ...prev,
                            mechanics: prev.mechanics.includes(mechanic)
                              ? prev.mechanics.filter((m) => m !== mechanic)
                              : [...prev.mechanics, mechanic],
                          }));
                        }}
                        color={
                          review.mechanics.includes(mechanic)
                            ? "primary"
                            : "default"
                        }
                        sx={{ m: 0.5 }}
                      />
                    ))}
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    カスタムタグ
                  </Typography>
                  <TextField
                    fullWidth
                    name="custom_tags"
                    value={review.custom_tags}
                    onChange={handleChange}
                    placeholder="スペース区切りでタグを入力（全角スペースも可）"
                    helperText="例: 初心者向け 戦略的 テーブルトーク"
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={12}>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    必須項目: ５０文字以内のコメント
                    <Box component="span" sx={{ color: "error.main", ml: 0.5 }}>
                      *
                    </Box>
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    name="short_comment"
                    value={review.short_comment}
                    onChange={handleChange}
                    placeholder="このゲームの魅力を一言で表現してください（必須）"
                    inputProps={{ maxLength: 50 }}
                    helperText={`${review.short_comment.length}/50文字`}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={12}>
                <Box sx={{ display: "flex", justifyContent: "center" }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={
                      submitting ||
                      review.recommended_players.length === 0 ||
                      !review.short_comment
                    }
                    sx={{ minWidth: 200 }}
                  >
                    {submitting
                      ? "送信中..."
                      : existingReview
                      ? "レビューを修正"
                      : "レビューを投稿"}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>

      {flashMessage && (
        <FlashMessage
          message={flashMessage}
          onClose={() => setFlashMessage(null)}
        />
      )}

      <Snackbar
        open={!!successMessage}
        autoHideDuration={2000}
        message={successMessage}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Container>
  );
}
