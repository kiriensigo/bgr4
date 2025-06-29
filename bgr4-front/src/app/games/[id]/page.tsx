"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  getGameBasicInfo,
  getGameStatistics,
  getGameReviews,
  getRelatedGames,
  updateGameFromBgg,
  type Game,
  updateSystemReviews,
} from "../../../lib/api";
import {
  Container,
  Typography,
  Grid,
  Box,
  Paper,
  Button,
  Divider,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Checkbox,
  LinearProgress,
  Skeleton,
} from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import GroupIcon from "@mui/icons-material/Group";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import RateReviewIcon from "@mui/icons-material/RateReview";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import RefreshIcon from "@mui/icons-material/Refresh";
<<<<<<< HEAD
import GameCard from "../../../components/GameCard";
import ReviewList from "../../../components/ReviewList";
import GameRating from "../../../components/GameRating";
import { useAuth } from "../../../contexts/AuthContext";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { formatDate } from "../../../lib/utils";
import { getAuthHeaders } from "../../../lib/auth";
=======
import ReviewList from "../../../components/ReviewList";
import GameRating from "../../../components/GameRating";
import { useAuth } from "../../../contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";

>>>>>>> 391c7a7cccd3f676731b6712fbf739c4deb914d7
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EditIcon from "@mui/icons-material/Edit";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import UpdateIcon from "@mui/icons-material/Update";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
<<<<<<< HEAD
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";

// page.tsx で使用する Game 型を api.ts からインポートするように変更
// これにより、型の不整合が解消される
// import type { Game } from "../../../types/game";

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
=======
>>>>>>> 391c7a7cccd3f676731b6712fbf739c4deb914d7

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
  expansions?: Array<{ id: string; name: string; bgg_id?: string }>;
  baseGame?: { id: string; name: string; bgg_id?: string };
  popular_categories?: any[];
  popular_mechanics?: any[];
  site_recommended_players?: string[];
  recommended_players?: any[];
}

// 段階的読み込みの状態を管理する型
interface LoadingStates {
  basicInfo: boolean;
  reviews: boolean;
  statistics: boolean;
  relatedGames: boolean;
}

// スコアを表示するためのヘルパー関数を修正
const formatScore = (
  score: number | string | null | undefined,
  isLoading: boolean = false
): string => {
  if (isLoading) return "...";
  if (score === null || score === undefined) return "N/A";
  if (typeof score === "string") {
    const parsed = parseFloat(score);
    return isNaN(parsed) ? "N/A" : parsed.toFixed(1);
  }
  return typeof score === "number" ? score.toFixed(1) : "N/A";
};

// エラー表示コンポーネントを追加
const ErrorDisplay = ({
  error,
  onRetry,
}: {
  error: string;
  onRetry?: () => void;
}) => {
  const router = useRouter();

  return (
    <Paper
      elevation={3}
      sx={{
        p: 4,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        maxWidth: 600,
        mx: "auto",
        mt: 4,
      }}
    >
      <ErrorOutlineIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
      <Typography variant="h5" gutterBottom>
        エラーが発生しました
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {error}
      </Typography>
      <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
        {onRetry && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={onRetry}
          >
            再試行
          </Button>
        )}
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/games")}
        >
          ゲーム一覧に戻る
        </Button>
      </Box>
    </Paper>
  );
};

export default function GamePage({ params }: GamePageProps) {
  const { user, getAuthHeaders, isAdmin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const refresh = searchParams.get("refresh") === "true";

  // IDがundefinedの場合はゲーム一覧ページにリダイレクト
  useEffect(() => {
    if (params.id === "undefined" || !params.id) {
      console.log("Invalid game ID detected, redirecting to games list");
      router.push("/games");
    }
  }, [params.id, router]);

  const [game, setGame] = useState<ExtendedGame | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "info" | "warning"
  >("success");

  const [updatingGame, setUpdatingGame] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0); // ローディングの進捗状態
  const [openSystemReviewsDialog, setOpenSystemReviewsDialog] = useState(false);
  const [updatingSystemReviews, setUpdatingSystemReviews] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);
  const [imageLoading, setImageLoading] = useState(true); // 画像読み込み状態を管理
  const [imageError, setImageError] = useState(false); // 画像読み込みエラー状態を管理

  // 重複実行防止用のref
  const isInitializedRef = useRef(false);
  const fetchInProgressRef = useRef(false);
  const reviewCountFetchedRef = useRef(false);
  // 前回のIDを記録

  // 段階的読み込みの状態管理
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    basicInfo: true,
    reviews: true,
    statistics: true,
    relatedGames: true,
  });

  // 段階的に読み込まれるデータの状態

  const [gameReviews, setGameReviews] = useState<any[]>([]);

  // データ読み込み済みフラグを追加

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

  // ユーザーのレビュー数を取得
  useEffect(() => {
    if (user && !reviewCountFetchedRef.current) {
      reviewCountFetchedRef.current = true;

      const fetchReviewCount = async () => {
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
        }
      };

      fetchReviewCount();
    }

    // ユーザーがログアウトした場合はフラグをリセット
    if (!user) {
      reviewCountFetchedRef.current = false;
      setReviewCount(0);
    }
  }, [user]); // getAuthHeadersを依存配列から除去

  // レビュー数が5件以上あるか、または管理者かどうかを判定
  const canEditGame = reviewCount >= 5 || isAdmin;

  // 段階的読み込みの実装
  const fetchGameData = useCallback(
    async (forceRefresh = false) => {
      // 重複実行防止
      if (fetchInProgressRef.current && !forceRefresh) {
        console.log("Fetch already in progress, skipping...");
        return;
      }

      // IDがundefinedの場合は処理を中止
      if (params.id === "undefined" || !params.id) {
        console.log("Invalid game ID, skipping data fetch");
        setError("無効なゲームIDです。ゲーム一覧ページに戻ってください。");
        setLoading(false);
        return;
      }

      // 強制更新でない場合、既に初期化済みならスキップ
      if (isInitializedRef.current && !forceRefresh) {
        console.log("Already initialized, skipping fetch");
        return;
      }

      fetchInProgressRef.current = true;
      setLoading(true);
      setError(null);

      const headers = user ? getAuthHeaders() : {};

      try {
        // ステップ1: 基本情報を取得（最優先）
        console.log("Step 1: Fetching basic game info...");
        setLoadingStates((prev) => ({ ...prev, basicInfo: true }));

        const basicInfo = await getGameBasicInfo(params.id, headers);
        console.log("Basic info received:", basicInfo);
        setGame(basicInfo as ExtendedGame);

        if (basicInfo.japanese_name) {
          setJapaneseName(basicInfo.japanese_name);
        }
        if (basicInfo.in_wishlist && typeof basicInfo.id === "number") {
          setWishlistItemId(basicInfo.id);
        }

        setLoadingStates((prev) => ({ ...prev, basicInfo: false }));
        setLoading(false); // 基本情報が読み込まれたらメインのローディングを終了

        // ステップ2-4を並行実行（重複回避のため一度だけ実行）
        console.log("Fetching additional data concurrently...");
        const [statsResult, reviewsResult, relatedResult] =
          await Promise.allSettled([
            getGameStatistics(params.id, headers),
            getGameReviews(params.id, 1, 5, headers),
            getRelatedGames(params.id, headers),
          ]);

        // 統計情報の処理
        if (statsResult.status === "fulfilled") {
          console.log("Statistics received:", statsResult.value);
          setGameStatistics(statsResult.value);
          setGame((prevGame) => {
            if (prevGame) {
              return { ...prevGame, ...statsResult.value };
            }
            return prevGame;
          });
        } else {
          console.error("Failed to fetch statistics:", statsResult.reason);
        }
        setLoadingStates((prev) => ({ ...prev, statistics: false }));

        // レビューの処理
        if (reviewsResult.status === "fulfilled") {
          console.log("Reviews received:", reviewsResult.value);
          setGameReviews(reviewsResult.value.reviews);
          setTotalReviewsPages(reviewsResult.value.totalPages);
          setGame((prevGame) => {
            if (prevGame) {
              return {
                ...prevGame,
                reviews: reviewsResult.value.reviews,
                reviews_count: reviewsResult.value.totalItems,
              };
            }
            return prevGame;
          });
        } else {
          console.error("Failed to fetch reviews:", reviewsResult.reason);
        }
        setLoadingStates((prev) => ({ ...prev, reviews: false }));

        // 関連ゲームの処理
        if (relatedResult.status === "fulfilled") {
          console.log("Related games received:", relatedResult.value);
          setRelatedGames(relatedResult.value);
        } else {
          console.error("Failed to fetch related games:", relatedResult.reason);
        }
        setLoadingStates((prev) => ({ ...prev, relatedGames: false }));

        // 読み込み完了をマーク
        setHasLoadedData(true);
        isInitializedRef.current = true; // 初期化完了をマーク
        console.log("All progressive loading completed");
      } catch (error) {
        console.error("Error fetching game data:", error);
        setError(
          error instanceof Error
            ? error.message
            : "ゲーム情報の取得に失敗しました。"
        );
        setLoading(false);
        setLoadingStates({
          basicInfo: false,
          reviews: false,
          statistics: false,
          relatedGames: false,
        });
      } finally {
        fetchInProgressRef.current = false;
      }
    },
    [params.id, user] // hasLoadedDataとgetAuthHeadersを依存配列から除去
  );

  // ゲームデータの初期読み込み（idが変わった時のみ）
  useEffect(() => {
    console.log("[DEBUG] Initial load useEffect triggered:", {
      gameId: params.id,
      isInitialized: isInitializedRef.current,
      fetchInProgress: fetchInProgressRef.current,
    });

    // IDがundefinedの場合は処理を中止
    if (params.id === "undefined" || !params.id) {
      console.log("[DEBUG] Invalid game ID, skipping");
      return;
    }

    // 既に初期化済みの場合はスキップ
    if (isInitializedRef.current) {
      console.log("[DEBUG] Already initialized, skipping");
      return;
    }

    // 新しいIDに変わった場合、初期化フラグをリセット
    if (isInitializedRef.current) {
      isInitializedRef.current = false;
    }

    console.log("[DEBUG] Calling fetchGameData from initial load");
    // ゲームデータを取得
    fetchGameData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]); // intentionally excluding fetchGameData to prevent infinite loop

  // refreshパラメータの処理を分離
  useEffect(() => {
    if (refresh) {
      // URLからrefreshパラメータを削除
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);

      // 更新完了のスナックバーを表示
      setSnackbarMessage("ゲーム情報が更新されました");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      // 初期化フラグをリセットして強制再読み込み
      isInitializedRef.current = false;
      fetchGameData(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]); // intentionally excluding fetchGameData to prevent infinite loop

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

  // ページのレンダリング
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          minHeight="50vh"
        >
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            ゲーム情報を読み込み中...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ErrorDisplay
          error={error}
          onRetry={() => {
            setError(null);
            fetchGameData(true);
          }}
        />
      </Container>
    );
  }

  if (!game) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ErrorDisplay error="ゲーム情報が見つかりませんでした。" />
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
                    onLoad={() => {
                      setImageLoading(false);
                      setImageError(false);
                    }}
                    onError={(e) => {
                      // 画像の読み込みに失敗した場合の処理
                      console.warn(
                        "画像の読み込みに失敗、プレースホルダーを使用",
                        e
                      );
                      const target = e.target as HTMLImageElement;
                      target.onerror = null; // 無限ループを防ぐ
                      target.src = "/placeholder-game.svg";
                      target.style.display = "block"; // プレースホルダー画像を表示
                      setImageLoading(false);
                      setImageError(true);
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
                      opacity: imageLoading && !imageError ? 1 : 0,
                      transition: "opacity 0.5s ease",
                      pointerEvents:
                        imageLoading && !imageError ? "auto" : "none",
                    }}
                  >
                    <CircularProgress />
                  </Box>
                  {/* 画像エラー時に表示するコンテンツ */}
                  {imageError && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: "grey.100",
                        borderRadius: 1,
                        padding: 2, // パディングを追加
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          textAlign: "center", // テキストを中央揃えに
                          width: "100%",
                          height: "100%",
                        }}
                      >
                        <ImageNotSupportedIcon
                          sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
                        />
                        <Typography variant="body1" color="text.secondary">
                          画像を読み込めませんでした
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              ) : (
                // 画像がない場合の表示
                <Box
                  sx={{
                    width: "100%",
                    paddingTop: "100%",
                    position: "relative",
                    backgroundColor: "grey.100",
                    borderRadius: 1,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      padding: 2, // パディングを追加
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        textAlign: "center", // テキストを中央揃えに
                        width: "100%",
                        height: "100%",
                      }}
                    >
                      <ImageNotSupportedIcon
                        sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
                      />
                      <Typography variant="body1" color="text.secondary">
                        画像がありません
                      </Typography>
                    </Box>
                  </Box>
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

              {/* 日本語名登録ボタンを削除し、ゲーム情報編集ボタンを追加 */}
              {user && canEditGame && (
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<EditIcon />}
                  component={Link}
                  href={`/games/${game.bgg_id}/edit`}
                  sx={{ mb: 2, mr: 2 }}
                >
                  ゲーム情報を編集
                </Button>
              )}

              {/* やりたいリストボタン */}
              {/* やりたいリストボタンを非表示にする */}

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
                    {loadingStates.statistics ? (
                      <Skeleton variant="text" width={60} height={48} />
                    ) : (
                      <Typography
                        variant="h4"
                        color="primary"
                        fontWeight="bold"
                      >
                        {formatScore(game.average_overall_score)}
                      </Typography>
                    )}
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
                    {loadingStates.statistics ? (
                      <Skeleton variant="text" width={40} height={32} />
                    ) : (
                      <Typography
                        variant="h6"
                        color="primary.dark"
                        fontWeight="medium"
                      >
                        {formatScore(game.average_rule_complexity)}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      運要素
                    </Typography>
                    {loadingStates.statistics ? (
                      <Skeleton variant="text" width={40} height={32} />
                    ) : (
                      <Typography
                        variant="h6"
                        color="primary.dark"
                        fontWeight="medium"
                      >
                        {formatScore(game.average_luck_factor)}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      相互作用
                    </Typography>
                    {loadingStates.statistics ? (
                      <Skeleton variant="text" width={40} height={32} />
                    ) : (
                      <Typography
                        variant="h6"
                        color="primary.dark"
                        fontWeight="medium"
                      >
                        {formatScore(game.average_interaction)}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      ダウンタイム
                    </Typography>
                    {loadingStates.statistics ? (
                      <Skeleton variant="text" width={40} height={32} />
                    ) : (
                      <Typography
                        variant="h6"
                        color="primary.dark"
                        fontWeight="medium"
                      >
                        {formatScore(game.average_downtime)}
                      </Typography>
                    )}
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
                        (playerData: any, index: number) => {
                          // オブジェクトからcountプロパティを取得
                          const count =
                            typeof playerData === "object" &&
                            playerData !== null
                              ? playerData.count
                              : playerData;

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
              {loadingStates.statistics ? (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    人気カテゴリー
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Skeleton variant="rounded" width={80} height={32} />
                    <Skeleton variant="rounded" width={100} height={32} />
                    <Skeleton variant="rounded" width={90} height={32} />
                  </Box>
                </Box>
              ) : (
                game.popular_categories &&
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
                            } catch {
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
                )
              )}

              {/* 人気メカニクス */}
              {loadingStates.statistics ? (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    人気メカニクス
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Skeleton variant="rounded" width={110} height={32} />
                    <Skeleton variant="rounded" width={90} height={32} />
                    <Skeleton variant="rounded" width={120} height={32} />
                  </Box>
                </Box>
              ) : (
                game.popular_mechanics &&
                game.popular_mechanics.length > 0 && (
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
                            } catch {
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
                )
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
                        href={`/games/${
                          game.baseGame.bgg_id || game.baseGame.id
                        }`}
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
                    {`レビュー数: ${gameReviews ? gameReviews.length : 0}`}
                  </Typography>
                </Box>
              )}

              <ReviewList reviews={gameReviews || []} initialPageSize={5} />

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

                  {/* サイト登録済みチェックボックス（管理者のみ表示） */}
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={Boolean(game.registered_on_site)}
                        disabled
                      />
                    }
                    label="サイト登録済み"
                  />
                </>
              )}
            </Grid>
          </Grid>
        </Paper>

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
