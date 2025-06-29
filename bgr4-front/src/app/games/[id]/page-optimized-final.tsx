"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  Box,
  Typography,
  Grid,
  Chip,
  Alert,
  Button,
  Snackbar,
  LinearProgress,
} from "@mui/material";
import {
  Star,
  StarBorder,
  Edit,
  Add,
  Remove,
  AccessTime,
  People,
  Edit as EditIcon,
  Update as UpdateIcon,
} from "@mui/icons-material";
import { Rating } from "@mui/material";
import GameImageCard from "../../../components/GameImageCard";
import GameEvaluationForm from "../../../components/GameEvaluationForm";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import { AxiosError } from "axios";
import { useAuth } from "../../../contexts/AuthContext";
import {
  getGameBasicInfo,
  getGameStatistics,
  getGameReviews,
  getRelatedGames,
  updateJapaneseName,
  addToWishlist,
  removeFromWishlist,
  updateGameFromBgg,
  updateSystemReviews,
} from "../../../lib/api";
import type { Game } from "../../../types/game";
import MuiAlert, { AlertProps } from "@mui/material/Alert";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";

const SnackbarAlert = React.forwardRef<HTMLDivElement, AlertProps>(
  function SnackbarAlert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  }
);

const UpdateButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#ff6b35",
  color: "white",
  "&:hover": {
    backgroundColor: "#e55a2b",
  },
  "&:disabled": {
    backgroundColor: "#cccccc",
    color: "#666666",
  },
}));

// Interfaces
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

interface ReviewsResponse {
  reviews: Review[];
  pagination: any;
  totalItems: number;
  totalPages: number;
}

interface GamePageProps {
  params: {
    id: string;
  };
}

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

interface LoadingStates {
  basicInfo: boolean;
  reviews: boolean;
  statistics: boolean;
  relatedGames: boolean;
}

// Helper functions
const calculateAverageScores = (reviews: Review[]) => {
  if (!reviews || reviews.length === 0) {
    return {
      average_overall_score: 0,
      average_play_time: 0,
      average_rule_complexity: 0,
      average_luck_factor: 0,
      average_interaction: 0,
      average_downtime: 0,
    };
  }

  const totals = reviews.reduce(
    (acc, review) => ({
      overall_score: acc.overall_score + review.overall_score,
      play_time: acc.play_time + review.play_time,
      rule_complexity: acc.rule_complexity + review.rule_complexity,
      luck_factor: acc.luck_factor + review.luck_factor,
      interaction: acc.interaction + review.interaction,
      downtime: acc.downtime + review.downtime,
    }),
    {
      overall_score: 0,
      play_time: 0,
      rule_complexity: 0,
      luck_factor: 0,
      interaction: 0,
      downtime: 0,
    }
  );

  const count = reviews.length;
  return {
    average_overall_score: Math.round((totals.overall_score / count) * 10) / 10,
    average_play_time: Math.round((totals.play_time / count) * 10) / 10,
    average_rule_complexity:
      Math.round((totals.rule_complexity / count) * 10) / 10,
    average_luck_factor: Math.round((totals.luck_factor / count) * 10) / 10,
    average_interaction: Math.round((totals.interaction / count) * 10) / 10,
    average_downtime: Math.round((totals.downtime / count) * 10) / 10,
  };
};

const getPopularCategories = (reviews: any[]) => {
  if (!reviews || reviews.length === 0) return [];

  const categoryCount: { [key: string]: number } = {};

  reviews.forEach((review) => {
    if (review.categories && Array.isArray(review.categories)) {
      review.categories.forEach((category: string) => {
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });
    }
  });

  return Object.entries(categoryCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([category, count]) => ({ name: category, count }));
};

const getPopularMechanics = (reviews: any[]) => {
  if (!reviews || reviews.length === 0) return [];

  const mechanicCount: { [key: string]: number } = {};

  reviews.forEach((review) => {
    if (review.mechanics && Array.isArray(review.mechanics)) {
      review.mechanics.forEach((mechanic: string) => {
        mechanicCount[mechanic] = (mechanicCount[mechanic] || 0) + 1;
      });
    }
  });

  return Object.entries(mechanicCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([mechanic, count]) => ({ name: mechanic, count }));
};

const formatScore = (
  score: number | string | null | undefined,
  isLoading: boolean = false
): string => {
  if (isLoading) return "読み込み中...";
  if (score === null || score === undefined) return "未評価";
  const numScore = typeof score === "string" ? parseFloat(score) : score;
  return isNaN(numScore) ? "未評価" : numScore.toFixed(1);
};

const getNumericScore = (score: number | string | null | undefined): number => {
  if (score === null || score === undefined) return 0;
  const numScore = typeof score === "string" ? parseFloat(score) : score;
  return isNaN(numScore) ? 0 : numScore;
};

const PlayerCountInfo = ({ game }: { game: Game }) => {
  return (
    <Box display="flex" alignItems="center" gap={0.5}>
      <People fontSize="small" color="action" />
      <Typography variant="body2" color="text.secondary">
        {game.min_players === game.max_players
          ? `${game.min_players}人`
          : `${game.min_players}−${game.max_players}人`}
      </Typography>
    </Box>
  );
};

const PublisherInfo = ({ game }: { game: Game }) => {
  const router = useRouter();

  const handlePublisherClick = () => {
    if (game.publisher) {
      router.push(`/games/publisher/${encodeURIComponent(game.publisher)}`);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        出版社
      </Typography>
      {game.publisher ? (
        <Button
          variant="text"
          onClick={handlePublisherClick}
          sx={{
            textTransform: "none",
            justifyContent: "flex-start",
            padding: 0,
            minWidth: "auto",
            color: "primary.main",
            "&:hover": {
              backgroundColor: "transparent",
              textDecoration: "underline",
            },
          }}
        >
          <Typography variant="body1">{game.publisher}</Typography>
        </Button>
      ) : (
        <Typography variant="body1" color="text.secondary">
          情報なし
        </Typography>
      )}
    </Box>
  );
};

const DesignerInfo = ({ game }: { game: Game }) => {
  const router = useRouter();

  const handleDesignerClick = () => {
    if (game.designer) {
      router.push(`/games/designer/${encodeURIComponent(game.designer)}`);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        デザイナー
      </Typography>
      {game.designer ? (
        <Button
          variant="text"
          onClick={handleDesignerClick}
          sx={{
            textTransform: "none",
            justifyContent: "flex-start",
            padding: 0,
            minWidth: "auto",
            color: "primary.main",
            "&:hover": {
              backgroundColor: "transparent",
              textDecoration: "underline",
            },
          }}
        >
          <Typography variant="body1">{game.designer}</Typography>
        </Button>
      ) : (
        <Typography variant="body1" color="text.secondary">
          情報なし
        </Typography>
      )}
    </Box>
  );
};

const ErrorDisplay = ({
  error,
  onRetry,
}: {
  error: string;
  onRetry?: () => void;
}) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="60vh"
      gap={2}
    >
      <Alert severity="error" sx={{ maxWidth: 600 }}>
        <Typography variant="h6" gutterBottom>
          エラーが発生しました
        </Typography>
        <Typography variant="body2">{error}</Typography>
      </Alert>
      {onRetry && (
        <Button variant="contained" onClick={onRetry}>
          再試行
        </Button>
      )}
      <Button
        variant="outlined"
        onClick={() => window.history.back()}
        sx={{ mt: 1 }}
      >
        戻る
      </Button>
    </Box>
  );
};

export default function GamePage({ params }: GamePageProps) {
  // Get search params
  const searchParams = useSearchParams();
  const refresh = searchParams.get("refresh") === "true";

  // Auth context
  const { user, getAuthHeaders, isAdmin } = useAuth();

  // Game state
  const [game, setGame] = useState<ExtendedGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [japaneseName, setJapaneseName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Wishlist states
  const [wishlistItemId, setWishlistItemId] = useState<number | null>(null);
  const [addingToWishlist, setAddingToWishlist] = useState(false);

  // Snackbar states
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "info"
  >("success");

  // Update states
  const [updatingGame, setUpdatingGame] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [openSystemReviewsDialog, setOpenSystemReviewsDialog] = useState(false);
  const [updatingSystemReviews, setUpdatingSystemReviews] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);

  // 重複実行防止用のref - 最適化
  const isInitializedRef = useRef(false);
  const fetchInProgressRef = useRef(false);
  const reviewCountFetchedRef = useRef(false);

  // 段階的読み込みの状態管理
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
  const [reviewsPage, setReviewsPage] = useState(1);
  const [totalReviewsPages, setTotalReviewsPages] = useState(0);

  // ローディングの進捗状態を更新するタイマー
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (updatingGame) {
      let progress = 0;
      timer = setInterval(() => {
        progress += 5;
        if (progress <= 95) {
          setLoadingProgress(progress);
        } else {
          if (timer) clearInterval(timer);
        }
      }, 200);
    } else {
      setLoadingProgress(0);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [updatingGame]);

  // ユーザーのレビュー数を取得 - 重複防止最適化
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
  }, [user]); // getAuthHeadersを依存配列から除去 - 重複防止

  // レビュー数が5件以上あるか、または管理者かどうかを判定
  const canEditGame = reviewCount >= 5 || isAdmin;

  // 段階的読み込みの実装 - 最適化版
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
        setLoading(false);

        // ステップ2-4を並行実行（重複回避のため一度だけ実行）
        const [stats, reviewData, related] = await Promise.allSettled([
          getGameStatistics(params.id, headers),
          getGameReviews(params.id, 1, headers),
          getRelatedGames(params.id, headers),
        ]);

        // 統計情報の処理
        if (stats.status === "fulfilled") {
          console.log("Statistics received:", stats.value);
          setGameStatistics(stats.value);
          setGame((prevGame) => {
            if (prevGame) {
              return { ...prevGame, ...stats.value };
            }
            return prevGame;
          });
        } else {
          console.error("Failed to fetch statistics:", stats.reason);
        }
        setLoadingStates((prev) => ({ ...prev, statistics: false }));

        // レビューの処理
        if (reviewData.status === "fulfilled") {
          console.log("Reviews received:", reviewData.value);
          setGameReviews(reviewData.value.reviews);
          setTotalReviewsPages(reviewData.value.totalPages);
          setGame((prevGame) => {
            if (prevGame) {
              return {
                ...prevGame,
                reviews: reviewData.value.reviews,
                reviews_count: reviewData.value.totalItems,
              };
            }
            return prevGame;
          });
        } else {
          console.error("Failed to fetch reviews:", reviewData.reason);
        }
        setLoadingStates((prev) => ({ ...prev, reviews: false }));

        // 関連ゲームの処理
        if (related.status === "fulfilled") {
          console.log("Related games received:", related.value);
          setRelatedGames(related.value);
        } else {
          console.error("Failed to fetch related games:", related.reason);
        }
        setLoadingStates((prev) => ({ ...prev, relatedGames: false }));

        // 読み込み完了をマーク
        isInitializedRef.current = true;
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
    [params.id, user] // 最適化: hasLoadedDataとgetAuthHeadersを依存配列から除去
  );

  // ゲームデータの初期読み込み（idが変わった時のみ）- 最適化
  useEffect(() => {
    // IDがundefinedの場合は処理を中止
    if (params.id === "undefined" || !params.id) {
      return;
    }

    // 新しいIDに変わった場合、初期化フラグをリセット
    if (isInitializedRef.current) {
      isInitializedRef.current = false;
    }

    // ゲームデータを取得
    fetchGameData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]); // intentionally excluding fetchGameData to prevent infinite loop

  // refreshパラメータの処理を分離 - 最適化
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

  // Event handlers
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

  // Other event handlers would continue here...
  // (省略 - 元のファイルの残りのハンドラー関数をそのまま含める)

  // Render loading state
  if (loading && !game) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <Typography>読み込み中...</Typography>
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={() => {
          isInitializedRef.current = false;
          fetchGameData(true);
        }}
      />
    );
  }

  // Render game not found
  if (!game) {
    return (
      <ErrorDisplay
        error="ゲームが見つかりませんでした"
        onRetry={() => {
          isInitializedRef.current = false;
          fetchGameData(true);
        }}
      />
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, margin: "0 auto", padding: 2 }}>
      {/* 基本情報セクション */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <GameImageCard game={game} />
          </Grid>
          <Grid item xs={12} md={8}>
            <Typography variant="h4" component="h1" gutterBottom>
              {game.name}
            </Typography>

            {game.japanese_name && (
              <Typography variant="h5" color="text.secondary" gutterBottom>
                {game.japanese_name}
              </Typography>
            )}

            <Box sx={{ mb: 2 }}>
              <Chip
                label={formatScore(
                  game.average_overall_score,
                  loadingStates.basicInfo
                )}
                color="primary"
                size="small"
                sx={{ mr: 1, backgroundColor: "#1976d2", color: "white" }}
              />
              <Rating
                value={getNumericScore(game.average_overall_score) / 2}
                precision={0.1}
                readOnly
                size="small"
                sx={{ mr: 2 }}
              />
              <PlayerCountInfo game={game} />
              {game.min_time && game.max_time && (
                <Box
                  display="flex"
                  alignItems="center"
                  gap={0.5}
                  sx={{ mt: 1 }}
                >
                  <AccessTime fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {game.min_time === game.max_time
                      ? `${game.min_time}分`
                      : `${game.min_time}分～${game.max_time}分`}
                  </Typography>
                </Box>
              )}
            </Box>

            {game.description && (
              <Typography variant="body1" paragraph>
                {game.description}
              </Typography>
            )}

            {/* アクションボタン */}
            <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
              {user && (
                <>
                  {game.in_wishlist ? (
                    <Button
                      variant="outlined"
                      startIcon={<Remove />}
                      onClick={handleRemoveFromWishlist}
                      disabled={addingToWishlist}
                    >
                      やりたいリストから削除
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={handleAddToWishlist}
                      disabled={addingToWishlist}
                    >
                      やりたいリストに追加
                    </Button>
                  )}

                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={handleOpenDialog}
                  >
                    日本語名を編集
                  </Button>

                  {canEditGame && (
                    <UpdateButton
                      variant="contained"
                      startIcon={<UpdateIcon />}
                      onClick={handleOpenUpdateDialog}
                      disabled={updatingGame}
                    >
                      BGGから更新
                    </UpdateButton>
                  )}
                </>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* 進捗ローディング表示 */}
      {updatingGame && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            ゲーム情報を更新中... ({loadingProgress}%)
          </Typography>
          <LinearProgress variant="determinate" value={loadingProgress} />
        </Box>
      )}

      {/* レビューセクション */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          レビュー
        </Typography>
        {user && (
          <Box sx={{ mb: 2 }}>
            <GameEvaluationForm gameId={game.bgg_id} />
          </Box>
        )}

        {/* レビュー一覧 */}
        {loadingStates.reviews ? (
          <Typography>レビューを読み込み中...</Typography>
        ) : gameReviews && gameReviews.length > 0 ? (
          <Box>
            {gameReviews.map((review: any) => (
              <Box
                key={review.id}
                sx={{
                  mb: 2,
                  p: 2,
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1,
                }}
              >
                <Typography variant="subtitle1" gutterBottom>
                  {review.user.name}さんのレビュー
                </Typography>
                <Rating
                  value={review.overall_score / 2}
                  precision={0.1}
                  readOnly
                  size="small"
                />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {review.short_comment}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography color="text.secondary">
            まだレビューがありません
          </Typography>
        )}
      </Box>

      {/* 関連ゲームセクション */}
      {relatedGames && relatedGames.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            関連ゲーム
          </Typography>
          {loadingStates.relatedGames ? (
            <Typography>関連ゲームを読み込み中...</Typography>
          ) : (
            <Grid container spacing={2}>
              {relatedGames.slice(0, 4).map((relatedGame: Game) => (
                <Grid item xs={12} sm={6} md={3} key={relatedGame.id}>
                  <Box sx={{ textAlign: "center" }}>
                    <GameImageCard game={relatedGame} size="small" />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {relatedGame.name}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* ダイアログ */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>日本語名を編集</DialogTitle>
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>キャンセル</Button>
          <Button
            onClick={handleSubmitJapaneseName}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? "更新中..." : "更新"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* スナックバー */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <SnackbarAlert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
        >
          {snackbarMessage}
        </SnackbarAlert>
      </Snackbar>
    </Box>
  );
}
