"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getGame,
  updateJapaneseName,
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  updateGameFromBgg,
  type Game,
  gameCache,
  CACHE_EXPIRY,
  updateSystemReviews,
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Checkbox,
  LinearProgress,
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
import RefreshIcon from "@mui/icons-material/Refresh";
import GameCard from "@/components/GameCard";
import ReviewList from "@/components/ReviewList";
import GameRating from "@/components/GameRating";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { getAuthHeaders } from "@/lib/auth";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import UpdateIcon from "@mui/icons-material/Update";

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
  categories: string[];
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
  popular_categories?: any[];
  popular_mechanics?: any[];
  site_recommended_players?: string[];
  recommended_players?: any[];
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

// 人気のカテゴリーを集計する関数
const getPopularCategories = (reviews: any[]) => {
  if (!reviews || reviews.length === 0) return [];

  const categoryCount = new Map<string, number>();
  reviews.forEach((review) => {
    // categoriesとcustom_tagsが配列であることを確認し、そうでない場合は空配列を使用
    const categories = Array.isArray(review.categories)
      ? review.categories
      : [];
    const customTags = Array.isArray(review.custom_tags)
      ? review.custom_tags
      : [];

    [...categories, ...customTags].forEach((category) => {
      if (category) {
        // categoryがnullやundefinedでないことを確認
        categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
      }
    });
  });

  return Array.from(categoryCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));
};

// 人気のメカニクスを集計する関数
const getPopularMechanics = (reviews: any[]) => {
  if (!reviews || reviews.length === 0) return [];

  const mechanicsCount = new Map<string, number>();
  reviews.forEach((review) => {
    // mechanicsが配列であることを確認し、そうでない場合は空配列を使用
    const mechanics = Array.isArray(review.mechanics) ? review.mechanics : [];

    mechanics.forEach((mechanic) => {
      if (mechanic) {
        // mechanicがnullやundefinedでないことを確認
        mechanicsCount.set(mechanic, (mechanicsCount.get(mechanic) || 0) + 1);
      }
    });
  });

  return Array.from(mechanicsCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));
};

// スコアを表示するためのヘルパー関数を修正
const formatScore = (score: number | string | null | undefined): string => {
  if (score === null || score === undefined) return "未評価";
  const numScore = typeof score === "string" ? parseFloat(score) : score;
  // 0の場合は「未評価」と表示する（バックエンドでは評価値が存在しない場合に0を返している）
  return Number.isNaN(numScore) || numScore === 0
    ? "未評価"
    : numScore.toFixed(1);
};

const getNumericScore = (score: number | string | null | undefined): number => {
  if (score === null || score === undefined) return 0;
  const numScore = typeof score === "string" ? parseFloat(score) : score;
  return Number.isNaN(numScore) ? 0 : numScore;
};

// プレイ人数情報
const PlayerCountInfo = ({ game }: { game: Game }) => {
  // 基本情報セクションを削除
  return null;
};

// 出版社情報
const PublisherInfo = ({ game }: { game: Game }) => {
  const japanesePublisher = game.japanese_publisher;
  const router = useRouter();

  // 出版社がない場合は表示しない
  if (!japanesePublisher) {
    return null;
  }

  const handlePublisherClick = () => {
    router.push(
      `/search/results?publisher=${encodeURIComponent(japanesePublisher)}`
    );
  };

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary">
        出版社:
      </Typography>
      <Typography variant="body2">
        <Button
          onClick={handlePublisherClick}
          sx={{
            textTransform: "none",
            padding: "0",
            minWidth: "auto",
            color: "primary.main",
            "&:hover": {
              backgroundColor: "transparent",
              textDecoration: "underline",
            },
          }}
        >
          {japanesePublisher}
        </Button>
      </Typography>
    </Box>
  );
};

// デザイナー情報
const DesignerInfo = ({ game }: { game: Game }) => {
  const designer = game.designer || "不明";

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary">
        デザイナー:
      </Typography>
      <Typography variant="body2">
        <Link href={`/games/designer/${encodeURIComponent(designer)}`} passHref>
          {designer}
        </Link>
      </Typography>
    </Box>
  );
};

export default function GamePage({ params }: GamePageProps) {
  const { user, getAuthHeaders, isAdmin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const refresh = searchParams.get("refresh") === "true";

  const [game, setGame] = useState<ExtendedGame | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [japaneseName, setJapaneseName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "info" | "warning"
  >("success");
  const [wishlistItemId, setWishlistItemId] = useState<number | null>(null);
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  const [updatingGame, setUpdatingGame] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0); // ローディングの進捗状態
  const [openSystemReviewsDialog, setOpenSystemReviewsDialog] = useState(false);
  const [updatingSystemReviews, setUpdatingSystemReviews] = useState(false);

  // ローディングの進捗状態を更新するタイマー
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (updatingGame) {
      // 0から100までの進捗を10秒かけて更新
      let progress = 0;
      timer = setInterval(() => {
        progress += 5; // 5%ずつ増加
        // 95%で止める（100%は完了時に設定）
        if (progress <= 95) {
          setLoadingProgress(progress);
        } else {
          if (timer) clearInterval(timer);
        }
      }, 200); // 10秒で95%まで進む（200ms * 19 ≈ 3.8秒）
    } else {
      setLoadingProgress(0);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [updatingGame]);

  const fetchGameData = useCallback(
    async (forceRefresh = false) => {
      try {
        setLoading(true);
        setError(null);

        // キャッシュをチェック
        const cacheKey = `game-${params.id}`;
        const cachedData = gameCache[cacheKey];
        const now = Date.now();

        // 有効なキャッシュがある場合はそれを使用（強制リフレッシュでない場合）
        if (
          !forceRefresh &&
          !refresh &&
          cachedData &&
          now - cachedData.timestamp < CACHE_EXPIRY
        ) {
          console.log("Using cached game data");
          setGame(cachedData.data as ExtendedGame);
          if (cachedData.data.japanese_name) {
            setJapaneseName(cachedData.data.japanese_name);
          }
          if (cachedData.data.in_wishlist) {
            // やりたいリストに追加されている場合、wishlistItemIdを取得する必要がある
            setWishlistItemId(cachedData.data.id);
          }
          setLoading(false);
          return;
        }

        try {
          // まずAPIからゲーム情報の取得を試みる
          const headers = user ? getAuthHeaders() : {};

          // パラメータのIDをログに出力
          console.log("Game ID from params:", params.id);
          console.log("Params object:", params);
          console.log("URL path:", window.location.pathname);

          // IDが存在しない場合はエラーを投げる
          if (!params.id) {
            throw new Error("ゲームIDが指定されていません");
          }

          // キャッシュを無効化するオプションを追加
          const options = {
            headers,
            cache: "no-cache" as RequestCache,
          };

          const data = (await getGame(params.id, headers)) as ExtendedGame;
          console.log("Fetched game data:", {
            ...data,
            reviews: data.reviews
              ? `${data.reviews.length} reviews`
              : "no reviews",
            hasReviews: data.reviews && data.reviews.length > 0,
          });

          // 評価値のデバッグ情報を追加
          console.log("Game ratings:", {
            rule_complexity: data.average_rule_complexity,
            luck_factor: data.average_luck_factor,
            interaction: data.average_interaction,
            downtime: data.average_downtime,
            formatted_rule_complexity: formatScore(
              data.average_rule_complexity
            ),
            formatted_luck_factor: formatScore(data.average_luck_factor),
            formatted_interaction: formatScore(data.average_interaction),
            formatted_downtime: formatScore(data.average_downtime),
          });

          setGame(data);
          if (data.japanese_name) {
            setJapaneseName(data.japanese_name);
          }
          if (data.in_wishlist) {
            // やりたいリストに追加されている場合、wishlistItemIdを取得する必要がある
            setWishlistItemId(data.id);
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
        }
      } catch (err) {
        console.error("Error in fetchGameData:", err);
        setError(
          err instanceof Error ? err.message : "予期せぬエラーが発生しました"
        );
      } finally {
        setLoading(false);
      }
    },
    [params.id, user, getAuthHeaders, refresh]
  );

  useEffect(() => {
    // ゲームデータを取得
    fetchGameData(refresh);
  }, [fetchGameData, params.id, refresh]);

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
      const data = await addToWishlist(game.bgg_id, authHeaders);
      setWishlistItemId(data.id);
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

  // BGGからゲーム情報を更新するダイアログを開く
  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  // BGGからゲーム情報を更新するダイアログを閉じる
  const handleCloseUpdateDialog = () => {
    setOpenUpdateDialog(false);
    setForceUpdate(false);
  };

  // BGGからゲーム情報を更新する
  const handleUpdateGameFromBgg = async () => {
    if (!user) return;

    try {
      // 更新中フラグを設定
      setUpdatingGame(true);
      setLoadingProgress(0); // 進捗をリセット

      // 少し待ってローディングインジケーターが確実に表示されるようにする
      await new Promise((resolve) => setTimeout(resolve, 100));

      const authHeaders = await getAuthHeaders();

      if (!authHeaders) {
        throw new Error("認証情報が取得できませんでした");
      }

      // ダイアログを閉じる（ローディング状態を表示するため）
      handleCloseUpdateDialog();

      // 成功メッセージを表示
      setSnackbarMessage("ゲーム情報を更新中です...");
      setSnackbarSeverity("info");
      setSnackbarOpen(true);

      // タイムアウト処理を追加
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("更新処理がタイムアウトしました")),
          15000
        ); // 15秒でタイムアウト
      });

      // 実際の更新処理
      const updatePromise = updateGameFromBgg(
        params.id,
        forceUpdate,
        authHeaders
      );

      // Promise.raceでどちらか早い方を採用
      const updatedGame = (await Promise.race([
        updatePromise,
        timeoutPromise,
      ])) as Game;

      // 完了を示す
      setLoadingProgress(100);

      // ゲーム情報を更新
      setGame(updatedGame as ExtendedGame);

      // 日本語名があれば更新
      if (updatedGame.japanese_name) {
        setJapaneseName(updatedGame.japanese_name);
      }

      // キャッシュを更新
      const cacheKey = `game-${params.id}`;
      gameCache[cacheKey] = {
        data: updatedGame,
        timestamp: Date.now(),
      };

      // 成功メッセージを表示
      setSnackbarMessage("ゲーム情報を更新しました。ページをリロードします...");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      // 少し待ってからページをリロード
      setTimeout(() => {
        // キャッシュをクリアしてからリロード
        const cacheKey = `game-${params.id}`;
        if (gameCache[cacheKey]) {
          delete gameCache[cacheKey];
        }
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Error updating game from BGG:", error);
      setSnackbarMessage(
        error instanceof Error
          ? error.message
          : "ゲーム情報の更新に失敗しました"
      );
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      // 少し待ってから更新中フラグを解除（完了アニメーションを見せるため）
      setTimeout(() => {
        setUpdatingGame(false);
        setLoadingProgress(0);
      }, 1000); // 完了アニメーションを見せるために設定
    }
  };

  // システムレビューを更新するダイアログを開く
  const handleOpenSystemReviewsDialog = () => {
    setOpenSystemReviewsDialog(true);
  };

  // システムレビューを更新するダイアログを閉じる
  const handleCloseSystemReviewsDialog = () => {
    setOpenSystemReviewsDialog(false);
  };

  // システムレビューを更新する
  const handleUpdateSystemReviews = async () => {
    if (!isAdmin || !game) return;

    try {
      // 更新中フラグを設定
      setUpdatingSystemReviews(true);

      // 少し待ってローディングインジケーターが確実に表示されるようにする
      await new Promise((resolve) => setTimeout(resolve, 100));

      const authHeaders = getAuthHeaders();

      if (!authHeaders) {
        throw new Error("認証情報が取得できませんでした");
      }

      // ダイアログを閉じる（ローディング状態を表示するため）
      handleCloseSystemReviewsDialog();

      // 成功メッセージを表示
      setSnackbarMessage("システムレビューを更新中です...");
      setSnackbarSeverity("info");
      setSnackbarOpen(true);

      // システムレビューを更新
      await updateSystemReviews(game.bgg_id, authHeaders);

      // 成功メッセージを表示
      setSnackbarMessage(
        "システムレビューを更新しました。ページをリロードします..."
      );
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      // 少し待ってからページをリロード
      setTimeout(() => {
        // キャッシュをクリアしてからリロード
        const cacheKey = `game-${params.id}`;
        if (gameCache[cacheKey]) {
          delete gameCache[cacheKey];
        }
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("システムレビューの更新に失敗しました:", error);
      setSnackbarMessage(
        `システムレビューの更新に失敗しました: ${
          error instanceof Error ? error.message : "不明なエラー"
        }`
      );
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setUpdatingSystemReviews(false);
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
          {typeof error === "string" &&
            error.includes("まだデータベースに登録されていません") && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1" gutterBottom>
                  このゲームはまだデータベースに登録されていません。
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  component={Link}
                  href="/games/register"
                  sx={{ mt: 1 }}
                >
                  ゲーム登録ページへ
                </Button>
              </Box>
            )}
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
    <>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* ゲーム情報の更新中にオーバーレイを表示 */}
        {updatingGame && (
          <Box
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              zIndex: 9999999, // 最大のz-indexを設定
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              backdropFilter: "blur(3px)",
            }}
            inert={updatingGame ? undefined : true}
          >
            <Paper
              elevation={4}
              sx={{
                p: 4,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                borderRadius: 2,
                maxWidth: "90%",
                width: 350,
              }}
            >
              {loadingProgress === 100 ? (
                <>
                  <CheckCircleIcon
                    color="success"
                    sx={{ fontSize: 60, mb: 2 }}
                  />
                  <Typography variant="h6" align="center" gutterBottom>
                    更新が完了しました！
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                  >
                    ページをリロードしています...
                  </Typography>
                  <LinearProgress
                    sx={{ width: "100%", mt: 2 }}
                    color="success"
                  />
                </>
              ) : (
                <>
                  <CircularProgress
                    variant="determinate"
                    value={loadingProgress}
                    size={60}
                    sx={{ mb: 2 }}
                  />
                  <Typography variant="h6" align="center" gutterBottom>
                    BGGからゲーム情報を更新中...
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                  >
                    しばらくお待ちください
                  </Typography>
                  <Box sx={{ width: "100%", mt: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={loadingProgress}
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      align="center"
                      sx={{ display: "block", mt: 1 }}
                    >
                      {loadingProgress}% 完了
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      align="center"
                      sx={{ display: "block", mt: 0.5 }}
                    >
                      画像の読み込みには時間がかかる場合があります
                    </Typography>
                  </Box>
                </>
              )}
            </Paper>
          </Box>
        )}

        <Paper elevation={3} sx={{ p: 4 }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              {/* ゲーム画像 */}
              {game.japanese_image_url || game.image_url ? (
                <Box sx={{ position: "relative" }}>
                  <Image
                    src={game.japanese_image_url || game.image_url || ""}
                    alt={game.japanese_name || game.name || ""}
                    width={500}
                    height={500}
                    style={{ width: "100%", height: "auto" }}
                    priority={true}
                    onError={(e) => {
                      // 画像の読み込みに失敗した場合の処理
                      const target = e.target as HTMLImageElement;
                      target.onerror = null; // 無限ループを防ぐ
                      target.src = "/images/no-image.png"; // デフォルト画像を表示
                    }}
                  />
                  {/* 画像の読み込み中に表示するオーバーレイ */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: "rgba(255, 255, 255, 0.7)",
                      opacity:
                        game.japanese_image_url || game.image_url ? 0 : 1,
                      transition: "opacity 0.5s ease",
                    }}
                  >
                    <CircularProgress />
                  </Box>
                </Box>
              ) : (
                <Box
                  sx={{
                    width: "100%",
                    height: 300,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    bgcolor: "grey.100",
                    borderRadius: 1,
                  }}
                >
                  <Typography color="text.secondary">
                    画像がありません
                  </Typography>
                </Box>
              )}
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
                    sx={{ mb: 2 }}
                  >
                    {game.in_wishlist
                      ? "やりたいリストから削除"
                      : "やりたいリストに追加"}
                    {addingToWishlist && (
                      <CircularProgress size={24} sx={{ ml: 1 }} />
                    )}
                  </Button>
                </Tooltip>
              )}

              {/* BGGリンク */}
              <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                <Button
                  variant="outlined"
                  color="primary"
                  href={`https://boardgamegeek.com/boardgame/${game.bgg_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  startIcon={<OpenInNewIcon />}
                >
                  BGGで詳細を見る
                </Button>

                {/* レビューを書くボタン */}
                <Link
                  href={`/games/${game.bgg_id}/review`}
                  style={{ textDecoration: "none" }}
                >
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<RateReviewIcon />}
                  >
                    レビューを書く
                  </Button>
                </Link>
              </Box>

              {/* スコアと基本情報 */}
              <Paper sx={{ p: 2, mb: 3, bgcolor: "grey.50" }}>
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <GroupIcon color="primary" sx={{ mr: 1 }} />
                        <Typography>
                          {game.min_players}～{game.max_players}人
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <AccessTimeIcon color="primary" sx={{ mr: 1 }} />
                        <Typography>
                          {game.min_play_time &&
                          game.min_play_time !== game.play_time
                            ? `${game.min_play_time}〜${game.play_time}分`
                            : `${game.play_time}分`}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  {/* 出版社と発売日情報 */}
                  <Grid item xs={12}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      {game.japanese_publisher && (
                        <Typography>
                          出版社:{" "}
                          <Link
                            href={`/search/results?publisher=${encodeURIComponent(
                              game.japanese_publisher
                            )}`}
                          >
                            {game.japanese_publisher}
                          </Link>
                        </Typography>
                      )}
                      {(game.release_date || game.japanese_release_date) && (
                        <Typography>
                          発売:{" "}
                          {game.japanese_release_date
                            ? new Date(
                                game.japanese_release_date || ""
                              ).getFullYear()
                            : game.release_date
                            ? new Date(game.release_date).getFullYear()
                            : "不明"}
                          年
                        </Typography>
                      )}
                    </Box>
                  </Grid>

                  {/* デザイナー情報 */}
                  {game.designer && (
                    <Grid item xs={12}>
                      <Typography>
                        デザイナー:{" "}
                        <Link
                          href={`/games/designer/${encodeURIComponent(
                            game.designer
                          )}`}
                        >
                          {game.designer}
                        </Link>
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>

              {/* ゲーム説明文（クリックで表示/非表示） */}
              {(game.japanese_description || game.description) && (
                <Box sx={{ mb: 3 }}>
                  <Accordion>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls="game-description-content"
                      id="game-description-header"
                    >
                      <Typography variant="h6">ゲーム説明</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Paper sx={{ p: 3, bgcolor: "grey.50" }}>
                        <Typography
                          variant="body1"
                          sx={{ whiteSpace: "pre-wrap" }}
                        >
                          {game.japanese_description || game.description}
                        </Typography>
                      </Paper>
                    </AccordionDetails>
                  </Accordion>
                </Box>
              )}

              {/* 評価スコア */}
              <Box sx={{ display: "flex", gap: 4, mb: 3 }}>
                <Box>
                  <Typography
                    variant="subtitle1"
                    color="text.secondary"
                    fontWeight="bold"
                  >
                    ユーザー評価
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="h4" color="primary" fontWeight="bold">
                      {formatScore(game.average_overall_score)}
                    </Typography>
                    <GameRating
                      score={game.average_overall_score}
                      reviewsCount={game.reviews_count}
                      size="large"
                    />
                  </Box>
                </Box>
              </Box>

              {/* レビュー評価の平均 */}
              <Box sx={{ mt: 3, mb: 4 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      ルールの複雑さ
                    </Typography>
                    <Typography
                      variant="h6"
                      color="primary.dark"
                      fontWeight="medium"
                    >
                      {formatScore(game.average_rule_complexity)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      運要素
                    </Typography>
                    <Typography
                      variant="h6"
                      color="primary.dark"
                      fontWeight="medium"
                    >
                      {formatScore(game.average_luck_factor)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      相互作用
                    </Typography>
                    <Typography
                      variant="h6"
                      color="primary.dark"
                      fontWeight="medium"
                    >
                      {formatScore(game.average_interaction)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      ダウンタイム
                    </Typography>
                    <Typography
                      variant="h6"
                      color="primary.dark"
                      fontWeight="medium"
                    >
                      {formatScore(game.average_downtime)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* おすすめプレイ人数 */}
              {game.site_recommended_players &&
                game.site_recommended_players.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      おすすめプレイ人数
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {game.site_recommended_players.map(
                        (count: string, index: number) => {
                          // 7の場合は「7人以上」と表示
                          const displayText =
                            count === "7" ? "7人以上" : `${count}人`;
                          return (
                            <Chip
                              key={`player-${count}-${index}`}
                              label={displayText}
                              color="primary"
                              variant="outlined"
                              sx={{ m: 0.5 }}
                            />
                          );
                        }
                      )}
                    </Box>
                  </Box>
                )}

              {/* 人気カテゴリー */}
              {game.popular_categories &&
                game.popular_categories.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      人気カテゴリー
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {game.popular_categories.map((category, index) => {
                        // categoryがオブジェクトの場合の処理
                        let displayText;
                        let key = `category-${index}`;

                        if (typeof category === "object" && category !== null) {
                          // nameプロパティがある場合はそれを使用
                          if (category.name) {
                            displayText = category.name;
                            key = `category-name-${category.name}-${index}`;
                          }
                          // countプロパティがある場合はそれを使用
                          else if (category.count) {
                            displayText = category.count;
                            key = `category-count-${category.count}-${index}`;
                          }
                          // どちらもない場合はJSONを文字列化
                          else {
                            try {
                              displayText = JSON.stringify(category);
                            } catch (e) {
                              displayText = "不明";
                            }
                          }
                        } else {
                          // プリミティブ値の場合はそのまま使用
                          displayText = category;
                          key = `category-${category}-${index}`;
                        }

                        return (
                          <Chip
                            key={key}
                            label={displayText}
                            color="secondary"
                            variant="outlined"
                            sx={{ m: 0.5 }}
                          />
                        );
                      })}
                    </Box>
                  </Box>
                )}

              {/* 人気メカニクス */}
              {game.popular_mechanics && game.popular_mechanics.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    人気メカニクス
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {game.popular_mechanics.map((mechanic, index) => {
                      // mechanicがオブジェクトの場合の処理
                      let displayText;
                      let key = `mechanic-${index}`;

                      if (typeof mechanic === "object" && mechanic !== null) {
                        // nameプロパティがある場合はそれを使用
                        if (mechanic.name) {
                          displayText = mechanic.name;
                          key = `mechanic-name-${mechanic.name}-${index}`;
                        }
                        // countプロパティがある場合はそれを使用
                        else if (mechanic.count) {
                          displayText = mechanic.count;
                          key = `mechanic-count-${mechanic.count}-${index}`;
                        }
                        // どちらもない場合はJSONを文字列化
                        else {
                          try {
                            displayText = JSON.stringify(mechanic);
                          } catch (e) {
                            displayText = "不明";
                          }
                        }
                      } else {
                        // プリミティブ値の場合はそのまま使用
                        displayText = mechanic;
                        key = `mechanic-${mechanic}-${index}`;
                      }

                      return (
                        <Chip
                          key={key}
                          label={displayText}
                          color="info"
                          variant="outlined"
                          sx={{ m: 0.5 }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              )}

              {/* 関連ゲーム情報（拡張情報とベースゲーム情報）*/}
              {(() => {
                // ベースゲームがある場合のみベースゲーム情報を表示
                const baseGameComponent = game?.baseGame ? (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      ベースゲーム
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap" }}>
                      <Link
                        href={`/games/${game.baseGame.id}`}
                        style={{ textDecoration: "none" }}
                      >
                        <Chip
                          label={game.baseGame.name}
                          color="primary"
                          variant="outlined"
                          sx={{ m: 0.5 }}
                          clickable
                        />
                      </Link>
                    </Box>
                  </Box>
                ) : null;

                // Dividerの表示条件を変更
                return baseGameComponent ? (
                  <>
                    <Divider sx={{ my: 4 }} />
                    {baseGameComponent}
                  </>
                ) : null;
              })()}

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

              {/* 管理者のみに表示するボタン */}
              {isAdmin && (
                <>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleOpenUpdateDialog}
                    startIcon={<RefreshIcon />}
                    sx={{ mt: 1, mb: 1 }}
                  >
                    BGGから更新
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleOpenSystemReviewsDialog}
                    startIcon={<UpdateIcon />}
                    sx={{ mt: 1, mb: 1, ml: 1 }}
                  >
                    システムレビュー更新
                  </Button>
                </>
              )}
            </Grid>
          </Grid>
        </Paper>

        {/* 日本語名登録ダイアログ */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          slotProps={{
            backdrop: {
              inert: openDialog ? "true" : "false",
            },
          }}
        >
          <DialogTitle>日本語名の登録</DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>
              このゲームの日本語名を登録してください。
            </Typography>
            <TextField
              autoFocus
              margin="dense"
              id="japaneseName"
              label="日本語名"
              type="text"
              fullWidth
              variant="outlined"
              value={japaneseName}
              onChange={(e) => setJapaneseName(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>キャンセル</Button>
            <Button
              onClick={handleSubmitJapaneseName}
              color="primary"
              disabled={submitting || !japaneseName.trim()}
            >
              登録
              {submitting && <CircularProgress size={24} sx={{ ml: 1 }} />}
            </Button>
          </DialogActions>
        </Dialog>

        {/* BGGからゲーム情報を更新するダイアログ */}
        <Dialog
          open={openUpdateDialog}
          onClose={handleCloseUpdateDialog}
          slotProps={{
            backdrop: {
              inert: openUpdateDialog ? "true" : "false",
            },
          }}
        >
          <DialogTitle>BGGからゲーム情報を更新</DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>
              BoardGameGeekから最新のゲーム情報を取得して更新します。
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={forceUpdate}
                  onChange={(e) => setForceUpdate(e.target.checked)}
                />
              }
              label="強制更新（既存の情報も上書きする）"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              ※通常は空欄の項目のみ更新されます。強制更新を選択すると、既存の情報も上書きされます。
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseUpdateDialog}>キャンセル</Button>
            <Button
              onClick={handleUpdateGameFromBgg}
              color="primary"
              disabled={updatingGame}
            >
              更新
              {updatingGame && <CircularProgress size={24} sx={{ ml: 1 }} />}
            </Button>
          </DialogActions>
        </Dialog>

        {/* システムレビューを更新するダイアログ */}
        <Dialog
          open={openSystemReviewsDialog}
          onClose={handleCloseSystemReviewsDialog}
          slotProps={{
            backdrop: {
              inert: openSystemReviewsDialog ? "true" : "false",
            },
          }}
        >
          <DialogTitle>システムレビューを更新</DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>
              BoardGameGeekから最新のシステムレビューを取得して更新します。
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseSystemReviewsDialog}>キャンセル</Button>
            <Button
              onClick={handleUpdateSystemReviews}
              color="primary"
              disabled={updatingSystemReviews}
            >
              更新
              {updatingSystemReviews && (
                <CircularProgress size={24} sx={{ ml: 1 }} />
              )}
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
    </>
  );
}
