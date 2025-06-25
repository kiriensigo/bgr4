"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  getGame,
  getGameBasicInfo,
  getGameStatistics,
  getGameReviews,
  getRelatedGames,
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
  Link as MuiLink,
  Skeleton,
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
import EditIcon from "@mui/icons-material/Edit";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import UpdateIcon from "@mui/icons-material/Update";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";

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

export default function GamePageOptimized({ params }: GamePageProps) {
  const { user, getAuthHeaders, isAdmin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const refresh = searchParams.get("refresh") === "true";
  const hasInitialized = useRef(false);

  // 状態管理
  const [game, setGame] = useState<ExtendedGame | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    basicInfo: true,
    reviews: true,
    statistics: true,
    relatedGames: true,
  });

  // 段階的に読み込まれるデータの状態
  const [gameStatistics, setGameStatistics] = useState<any>(null);
  const [gameReviews, setGameReviews] = useState<any[]>([]);
  const [relatedGames, setRelatedGames] = useState<any>(null);
  const [totalReviewsPages, setTotalReviewsPages] = useState(0);

  // その他の状態
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
  const [reviewCount, setReviewCount] = useState(0);

  // 段階的読み込みの実装（最適化版）
  const fetchGameData = useCallback(
    async (forceRefresh = false) => {
      // IDがundefinedの場合は処理を中止
      if (params.id === "undefined" || !params.id) {
        console.log("Invalid game ID, skipping data fetch");
        setError("無効なゲームIDです。ゲーム一覧ページに戻ってください。");
        setLoading(false);
        return;
      }

      // 初期化済みで強制更新でない場合はスキップ
      if (hasInitialized.current && !forceRefresh) {
        console.log("Already initialized, skipping fetch");
        return;
      }

      console.log("Starting optimized data fetch...");
      setLoading(true);
      setError(null);

      const headers = user ? getAuthHeaders() : {};

      try {
        // ステップ1: 基本情報を取得（最優先）
        console.log("Fetching basic game info...");
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

        // ステップ2-4を並行実行（一度だけ）
        console.log("Fetching additional data concurrently...");
        const [statsResult, reviewsResult, relatedResult] =
          await Promise.allSettled([
            getGameStatistics(params.id, headers),
            getGameReviews(params.id, 1, headers),
            getRelatedGames(params.id, headers),
          ]);

        // 統計情報の処理
        if (statsResult.status === "fulfilled") {
          console.log("Statistics received:", statsResult.value);
          setGameStatistics(statsResult.value);
          setGame((prevGame) =>
            prevGame ? { ...prevGame, ...statsResult.value } : null
          );
        } else {
          console.error("Failed to fetch statistics:", statsResult.reason);
        }
        setLoadingStates((prev) => ({ ...prev, statistics: false }));

        // レビューの処理
        if (reviewsResult.status === "fulfilled") {
          console.log("Reviews received:", reviewsResult.value);
          setGameReviews(reviewsResult.value.reviews);
          setTotalReviewsPages(reviewsResult.value.totalPages);
          setGame((prevGame) =>
            prevGame
              ? {
                  ...prevGame,
                  reviews: reviewsResult.value.reviews,
                  reviews_count: reviewsResult.value.totalItems,
                }
              : null
          );
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

        // 初期化完了をマーク
        hasInitialized.current = true;
        console.log("Optimized data fetch completed");
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
      }
    },
    [params.id, user, getAuthHeaders]
  );

  // IDが変わった時の初期化
  useEffect(() => {
    // 新しいIDの場合、初期化フラグをリセット
    hasInitialized.current = false;
    fetchGameData();
  }, [params.id]); // fetchGameDataを依存配列から除外

  // refreshパラメータの処理
  useEffect(() => {
    if (refresh) {
      // URLからrefreshパラメータを削除
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);

      // 更新完了のスナックバーを表示
      setSnackbarMessage("ゲーム情報が更新されました");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      // 強制再読み込み
      hasInitialized.current = false;
      fetchGameData(true);
    }
  }, [refresh]); // fetchGameDataを依存配列から除外

  // レビュー数の取得
  useEffect(() => {
    if (user) {
      const fetchReviewCount = async () => {
        try {
          const response = await fetch(
            `${
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
            }/api/v1/reviews/my`,
            {
              headers: { ...getAuthHeaders() },
              credentials: "include",
            }
          );

          if (response.ok) {
            const data = await response.json();
            setReviewCount(
              Array.isArray(data.reviews) ? data.reviews.length : 0
            );
          } else {
            setReviewCount(0);
          }
        } catch (error) {
          console.error("レビュー数の取得に失敗しました:", error);
          setReviewCount(0);
        }
      };

      fetchReviewCount();
    }
  }, [user, getAuthHeaders]);

  const canEditGame = reviewCount >= 5 || isAdmin;

  if (loading && !game) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, textAlign: "center" }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            ゲーム情報を読み込み中...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Typography variant="h6" color="error">
            {error}
          </Typography>
          <Button onClick={() => fetchGameData(true)} sx={{ mt: 2 }}>
            再試行
          </Button>
        </Box>
      </Container>
    );
  }

  if (!game) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Typography variant="h6">ゲームが見つかりません</Typography>
          <Button onClick={() => router.push("/games")} sx={{ mt: 2 }}>
            ゲーム一覧に戻る
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 2, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {game.japanese_name || game.name}
        </Typography>
        {game.japanese_name && game.name !== game.japanese_name && (
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {game.name}
          </Typography>
        )}

        {/* 基本情報表示 */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="body1" paragraph>
                {game.description}
              </Typography>

              {/* 統計情報のスケルトン表示 */}
              {loadingStates.statistics ? (
                <Box>
                  <Skeleton variant="text" width={200} />
                  <Skeleton variant="text" width={150} />
                </Box>
              ) : (
                gameStatistics && (
                  <Box>
                    <Typography variant="h6">ゲーム統計</Typography>
                    <Typography>
                      平均評価: {gameStatistics.average_rating}
                    </Typography>
                    <Typography>
                      レビュー数: {gameStatistics.review_count}
                    </Typography>
                  </Box>
                )
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                ゲーム情報
              </Typography>
              <Typography>
                プレイヤー: {game.min_players} - {game.max_players}人
              </Typography>
              <Typography>
                プレイ時間: {game.min_playtime} - {game.max_playtime}分
              </Typography>
              <Typography>年齢: {game.min_age}歳以上</Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* レビューセクション */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            レビュー
          </Typography>
          {loadingStates.reviews ? (
            <Box>
              <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
            </Box>
          ) : (
            <Box>
              {gameReviews.length > 0 ? (
                gameReviews.map((review) => (
                  <Paper key={review.id} sx={{ p: 2, mb: 2 }}>
                    <Typography variant="h6">{review.user.name}</Typography>
                    <Rating value={review.overall_score} readOnly />
                    <Typography>{review.short_comment}</Typography>
                  </Paper>
                ))
              ) : (
                <Typography>レビューはまだありません</Typography>
              )}
            </Box>
          )}
        </Box>

        {/* 関連ゲームセクション */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            関連ゲーム
          </Typography>
          {loadingStates.relatedGames ? (
            <Box sx={{ display: "flex", gap: 2 }}>
              <Skeleton variant="rectangular" width={200} height={150} />
              <Skeleton variant="rectangular" width={200} height={150} />
              <Skeleton variant="rectangular" width={200} height={150} />
            </Box>
          ) : (
            <Box>
              {relatedGames && relatedGames.length > 0 ? (
                <Grid container spacing={2}>
                  {relatedGames.map((relatedGame: any) => (
                    <Grid item xs={12} sm={6} md={4} key={relatedGame.id}>
                      <GameCard game={relatedGame} />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography>関連ゲームはありません</Typography>
              )}
            </Box>
          )}
        </Box>

        {/* スナックバー */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarSeverity}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
}
