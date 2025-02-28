"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getGame,
  updateJapaneseName,
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  type Game,
} from "@/lib/api";
import {
  Container,
  Typography,
  Grid,
  Box,
  Paper,
  Button,
  Rating,
  Divider,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Tooltip,
} from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import GroupIcon from "@mui/icons-material/Group";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import StarIcon from "@mui/icons-material/Star";
import RateReviewIcon from "@mui/icons-material/RateReview";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import TranslateIcon from "@mui/icons-material/Translate";
import BookmarkAddIcon from "@mui/icons-material/BookmarkAdd";
import BookmarkRemoveIcon from "@mui/icons-material/BookmarkRemove";
import GameCard from "@/components/GameCard";
import ReviewList from "@/components/ReviewList";
import GameRating from "@/components/GameRating";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";
import { formatDate } from "@/lib/utils";

interface Review {
  id: number;
  user: {
    id: number;
    name: string;
  };
  game_id: string;
  overall_score: number;
  play_time: number;
  rule_complexity: number;
  luck_factor: number;
  interaction: number;
  downtime: number;
  recommended_players: string[];
  mechanics: string[];
  tags: string[];
  custom_tags: string[];
  short_comment: string;
  created_at: string;
  likes_count: number;
  liked_by_current_user: boolean;
}

interface GamePageProps {
  params: {
    id: string;
  };
}

// Gameインターフェースを拡張
interface ExtendedGame extends Game {
  publisher?: string;
  designer?: string;
  release_date?: string;
  japanese_release_date?: string;
  japanese_publisher?: string;
  expansions?: Array<{ id: string; name: string }>;
  baseGame?: { id: string; name: string };
}

// レビューの平均点を計算する関数
// この関数はバックエンドから取得した平均点がない場合のフォールバックとして使用
const calculateAverageScores = (reviews: Review[]) => {
  if (!reviews || reviews.length === 0) return null;

  const validReviews = reviews.filter(
    (review) =>
      review.rule_complexity &&
      review.luck_factor &&
      review.interaction &&
      review.downtime
  );

  if (validReviews.length === 0) return null;

  return {
    rule_complexity: Number(
      (
        validReviews.reduce((sum, r) => sum + r.rule_complexity, 0) /
        validReviews.length
      ).toFixed(1)
    ),
    luck_factor: Number(
      (
        validReviews.reduce((sum, r) => sum + r.luck_factor, 0) /
        validReviews.length
      ).toFixed(1)
    ),
    interaction: Number(
      (
        validReviews.reduce((sum, r) => sum + r.interaction, 0) /
        validReviews.length
      ).toFixed(1)
    ),
    downtime: Number(
      (
        validReviews.reduce((sum, r) => sum + r.downtime, 0) /
        validReviews.length
      ).toFixed(1)
    ),
  };
};

// 人気のタグを集計する関数
const getPopularTags = (reviews: any[]) => {
  if (!reviews || reviews.length === 0) return [];

  const tagCount = new Map<string, number>();
  reviews.forEach((review) => {
    // tagsとcustom_tagsが配列であることを確認し、そうでない場合は空配列を使用
    const tags = Array.isArray(review.tags) ? review.tags : [];
    const customTags = Array.isArray(review.custom_tags)
      ? review.custom_tags
      : [];

    [...tags, ...customTags].forEach((tag) => {
      if (tag) {
        // tagがnullやundefinedでないことを確認
        tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
      }
    });
  });

  return Array.from(tagCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);
};

// スコアを表示するためのヘルパー関数を修正
const formatScore = (score: number | string | null | undefined): string => {
  if (score === null || score === undefined) return "未評価";
  const numScore = typeof score === "string" ? parseFloat(score) : score;
  return Number.isNaN(numScore) ? "未評価" : numScore.toFixed(1);
};

const getNumericScore = (score: number | string | null | undefined): number => {
  if (score === null || score === undefined) return 0;
  const numScore = typeof score === "string" ? parseFloat(score) : score;
  return Number.isNaN(numScore) ? 0 : numScore;
};

// キャッシュ用のオブジェクト
const gameCache: Record<string, { data: ExtendedGame; timestamp: number }> = {};
// キャッシュの有効期限（5分）
const CACHE_EXPIRY = 5 * 60 * 1000;

export default function GamePage({ params }: GamePageProps) {
  const { user, getAuthHeaders } = useAuth();
  const pathname = usePathname();
  const [game, setGame] = useState<ExtendedGame | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [japaneseName, setJapaneseName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );
  const [wishlistItemId, setWishlistItemId] = useState<number | null>(null);
  const [addingToWishlist, setAddingToWishlist] = useState(false);

  // やりたいリストからゲームのIDを取得する
  const fetchWishlistItemId = useCallback(
    async (gameId: string) => {
      if (!user) return;

      try {
        const authHeaders = getAuthHeaders();
        const wishlistItems = await getWishlist(authHeaders);
        const item = wishlistItems.find((item) => item.game_id === gameId);
        if (item) {
          setWishlistItemId(item.id);
        }
      } catch (error) {
        console.error("Error fetching wishlist item ID:", error);
      }
    },
    [user, getAuthHeaders]
  );

  const fetchGameData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // キャッシュをチェック
      const cacheKey = `game-${params.id}`;
      const cachedData = gameCache[cacheKey];
      const now = Date.now();

      // 有効なキャッシュがある場合はそれを使用
      if (cachedData && now - cachedData.timestamp < CACHE_EXPIRY) {
        console.log("Using cached game data");
        setGame(cachedData.data as ExtendedGame);
        if (cachedData.data.japanese_name) {
          setJapaneseName(cachedData.data.japanese_name);
        }
        if (cachedData.data.in_wishlist) {
          // やりたいリストに追加されている場合、wishlistItemIdを取得する必要がある
          fetchWishlistItemId(params.id);
        }
        setLoading(false);
        return;
      }

      const headers = user ? getAuthHeaders() : {};
      const data = (await getGame(params.id, headers)) as ExtendedGame;
      console.log("Fetched game data:", {
        ...data,
        reviews: data.reviews ? `${data.reviews.length} reviews` : "no reviews",
        hasReviews: data.reviews && data.reviews.length > 0,
      });
      setGame(data);
      if (data.japanese_name) {
        setJapaneseName(data.japanese_name);
      }
      if (data.in_wishlist) {
        // やりたいリストに追加されている場合、wishlistItemIdを取得する必要がある
        fetchWishlistItemId(params.id);
      }

      // キャッシュに保存
      gameCache[cacheKey] = {
        data,
        timestamp: now,
      };
    } catch (err) {
      console.error("Error fetching game:", err);
      setError(
        err instanceof Error ? err.message : "予期せぬエラーが発生しました"
      );
    } finally {
      setLoading(false);
    }
  }, [params.id, user, getAuthHeaders, fetchWishlistItemId]);

  useEffect(() => {
    fetchGameData();
  }, [fetchGameData]);

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSubmitJapaneseName = async () => {
    if (!game) return;

    setSubmitting(true);
    try {
      const authHeaders = getAuthHeaders();
      const updatedGame = await updateJapaneseName(
        game.bgg_id,
        japaneseName,
        authHeaders
      );
      setGame(updatedGame);
      setOpenDialog(false);
      setSnackbarMessage("日本語名を登録しました");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error updating Japanese name:", error);
      setSnackbarMessage(
        error instanceof Error ? error.message : "日本語名の登録に失敗しました"
      );
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  // やりたいリストに追加する
  const handleAddToWishlist = async () => {
    if (!user || !game) return;

    setAddingToWishlist(true);
    try {
      const authHeaders = getAuthHeaders();
      const result = await addToWishlist(game.bgg_id, authHeaders);
      setWishlistItemId(result.id);
      setGame({
        ...game,
        in_wishlist: true,
      });
      setSnackbarMessage("やりたいリストに追加しました");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      setSnackbarMessage(
        error instanceof Error
          ? error.message
          : "やりたいリストへの追加に失敗しました"
      );
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setAddingToWishlist(false);
    }
  };

  // やりたいリストから削除する
  const handleRemoveFromWishlist = async () => {
    if (!user || !game || wishlistItemId === null) return;

    setAddingToWishlist(true);
    try {
      const authHeaders = getAuthHeaders();
      await removeFromWishlist(wishlistItemId, authHeaders);
      setWishlistItemId(null);
      setGame({
        ...game,
        in_wishlist: false,
      });
      setSnackbarMessage("やりたいリストから削除しました");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      setSnackbarMessage(
        error instanceof Error
          ? error.message
          : "やりたいリストからの削除に失敗しました"
      );
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setAddingToWishlist(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Paper sx={{ p: 3, textAlign: "center", bgcolor: "error.light" }}>
          <Typography color="error" variant="h6">
            {error}
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (!game) {
    return (
      <Container sx={{ py: 4 }}>
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography>ゲームが見つかりませんでした</Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Image
              src={game.japanese_image_url || game.image_url || ""}
              alt={game.japanese_name || game.name || ""}
              width={500}
              height={500}
              style={{ width: "100%", height: "auto" }}
            />
          </Grid>
          <Grid item xs={12} md={8}>
            <Typography variant="h4" component="h1" gutterBottom>
              {game.japanese_name || game.name}
            </Typography>
            {game.japanese_name && game.japanese_name !== game.name && (
              <Typography
                variant="subtitle1"
                color="text.secondary"
                gutterBottom
              >
                原題: {game.name}
              </Typography>
            )}

            {/* 日本語名登録ボタン */}
            {user && (
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<TranslateIcon />}
                onClick={handleOpenDialog}
                sx={{ mb: 2, mr: 2 }}
              >
                {game.japanese_name ? "日本語名を編集" : "日本語名を登録"}
              </Button>
            )}

            {/* やりたいリストボタン */}
            {user && (
              <Tooltip
                title={
                  game.in_wishlist
                    ? "やりたいリストから削除"
                    : "やりたいリストに追加"
                }
              >
                <Button
                  variant="outlined"
                  color={game.in_wishlist ? "error" : "primary"}
                  startIcon={
                    game.in_wishlist ? (
                      <BookmarkRemoveIcon />
                    ) : (
                      <BookmarkAddIcon />
                    )
                  }
                  onClick={
                    game.in_wishlist
                      ? handleRemoveFromWishlist
                      : handleAddToWishlist
                  }
                  disabled={addingToWishlist}
                  sx={{ mb: 2, mr: 2 }}
                >
                  {game.in_wishlist ? "やりたい解除" : "やりたい！"}
                </Button>
              </Tooltip>
            )}

            {/* BGGリンク */}
            <Button
              variant="outlined"
              color="primary"
              href={`https://boardgamegeek.com/boardgame/${game.bgg_id}`}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<OpenInNewIcon />}
              sx={{ mb: 2 }}
            >
              Board Game Geekで詳細を見る
            </Button>

            {/* スコアと基本情報 */}
            <Paper sx={{ p: 3, mb: 3, bgcolor: "grey.50" }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <GroupIcon color="primary" />
                    <Typography>
                      {game.min_players}～{game.max_players}人
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <AccessTimeIcon color="primary" />
                    <Typography>
                      {game.min_play_time &&
                      game.play_time &&
                      game.min_play_time !== game.play_time
                        ? `${game.min_play_time}〜${game.play_time}分`
                        : `${game.play_time}分`}
                    </Typography>
                  </Box>
                </Grid>

                {/* 出版社情報を追加 */}
                {(game.publisher || game.japanese_publisher) && (
                  <Grid item xs={12} sm={6}>
                    <Box
                      sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}
                    >
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        sx={{ minWidth: "80px" }}
                      >
                        出版社:
                      </Typography>
                      <Typography>
                        {game.japanese_publisher || game.publisher}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {/* デザイナー情報を追加 */}
                {game.designer && (
                  <Grid item xs={12} sm={6}>
                    <Box
                      sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}
                    >
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        sx={{ minWidth: "80px" }}
                      >
                        デザイナー:
                      </Typography>
                      <Typography>{game.designer}</Typography>
                    </Box>
                  </Grid>
                )}

                {/* 発売日情報を追加 */}
                {(game.release_date || game.japanese_release_date) && (
                  <Grid item xs={12} sm={6}>
                    <Box
                      sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}
                    >
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        sx={{ minWidth: "80px" }}
                      >
                        発売日:
                      </Typography>
                      <Typography>
                        {game.japanese_release_date
                          ? formatDate(game.japanese_release_date)
                          : formatDate(game.release_date)}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Paper>

            {/* 評価スコア */}
            <Box sx={{ display: "flex", gap: 4, mb: 3 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  評価
                </Typography>
                <GameRating
                  score={game.average_score}
                  reviewsCount={game.reviews_count}
                  size="medium"
                />
              </Box>
            </Box>

            {/* おすすめプレイ人数 */}
            {game.site_recommended_players &&
              game.site_recommended_players.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    おすすめプレイ人数
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {game.site_recommended_players.map((count: string) => (
                      <Chip
                        key={count}
                        label={`${count}人`}
                        color="primary"
                        sx={{ m: 0.5 }}
                      />
                    ))}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    ※ レビュー投稿者の50%以上が推奨したプレイ人数です
                  </Typography>
                </Box>
              )}

            {/* 人気タグ */}
            {game.popular_tags && game.popular_tags.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  人気タグ
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {game.popular_tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      color="secondary"
                      variant="outlined"
                      sx={{ m: 0.5 }}
                    />
                  ))}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  ※ レビュー投稿者が最も多く選択したタグです
                </Typography>
              </Box>
            )}

            {/* 人気メカニクス */}
            {game.popular_mechanics && game.popular_mechanics.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  人気メカニクス
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {game.popular_mechanics.map((mechanic) => (
                    <Chip
                      key={mechanic}
                      label={mechanic}
                      color="info"
                      variant="outlined"
                      sx={{ m: 0.5 }}
                    />
                  ))}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  ※ レビュー投稿者が最も多く選択したメカニクスです
                </Typography>
              </Box>
            )}

            {/* レビュー評価の平均 */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                レビュー評価の平均
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    ルールの複雑さ
                  </Typography>
                  <Typography variant="body1">
                    {formatScore(game.average_rule_complexity)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    運要素
                  </Typography>
                  <Typography variant="body1">
                    {formatScore(game.average_luck_factor)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    相互作用
                  </Typography>
                  <Typography variant="body1">
                    {formatScore(game.average_interaction)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    ダウンタイム
                  </Typography>
                  <Typography variant="body1">
                    {formatScore(game.average_downtime)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            {/* 人気のタグを追加 */}
            {game.reviews && game.reviews.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  人気のタグ
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {getPopularTags(game.reviews).map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* 拡張情報 */}
            {game.expansions && game.expansions.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  拡張
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {game.expansions.map((expansion) => (
                    <Link
                      key={expansion.id}
                      href={`/games/${expansion.id}`}
                      style={{ textDecoration: "none" }}
                    >
                      <Chip
                        label={expansion.name}
                        color="primary"
                        variant="outlined"
                        sx={{ m: 0.5 }}
                        clickable
                      />
                    </Link>
                  ))}
                </Box>
              </Box>
            )}

            {/* ベースゲーム情報 */}
            {game.baseGame && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  ベースゲーム
                </Typography>
                <Link
                  href={`/games/${game.baseGame.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <Chip
                    label={game.baseGame.name}
                    color="secondary"
                    variant="outlined"
                    sx={{ m: 0.5 }}
                    clickable
                  />
                </Link>
              </Box>
            )}

            <Divider sx={{ my: 4 }} />

            {/* レビューセクション */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6">レビュー</Typography>
              <Link
                href={`/games/${game.bgg_id}/review`}
                style={{ textDecoration: "none" }}
              >
                <Button
                  variant="outlined"
                  startIcon={<RateReviewIcon />}
                  size="small"
                >
                  レビューを書く
                </Button>
              </Link>
            </Box>

            {/* レビューデータのデバッグ情報 */}
            {process.env.NODE_ENV === "development" && (
              <Box sx={{ mb: 2, p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
                <Typography
                  variant="caption"
                  component="pre"
                  sx={{ whiteSpace: "pre-wrap" }}
                >
                  {`レビュー数: ${game.reviews ? game.reviews.length : 0}`}
                </Typography>
              </Box>
            )}

            <ReviewList reviews={game.reviews || []} />
          </Grid>
        </Grid>
      </Paper>

      {/* 日本語名登録ダイアログ */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {game?.japanese_name ? "日本語名を編集" : "日本語名を登録"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="日本語名"
            type="text"
            fullWidth
            variant="outlined"
            value={japaneseName}
            onChange={(e) => setJapaneseName(e.target.value)}
            disabled={submitting}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            キャンセル
          </Button>
          <Button
            onClick={handleSubmitJapaneseName}
            color="primary"
            disabled={submitting || !japaneseName.trim()}
          >
            {submitting ? "送信中..." : "保存"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* スナックバー */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}
