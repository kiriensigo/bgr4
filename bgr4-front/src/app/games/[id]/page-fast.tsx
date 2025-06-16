"use client";

import { useEffect, useState, useCallback } from "react";
import {
  updateJapaneseName,
  addToWishlist,
  removeFromWishlist,
  updateGameFromBgg,
  type Game,
  updateSystemReviews,
} from "@/lib/api";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  FormControlLabel,
  Checkbox,
  LinearProgress,
} from "@mui/material";
import Link from "next/link";
import RateReviewIcon from "@mui/icons-material/RateReview";
import TranslateIcon from "@mui/icons-material/Translate";
import BookmarkAddIcon from "@mui/icons-material/BookmarkAdd";
import BookmarkRemoveIcon from "@mui/icons-material/BookmarkRemove";
import UpdateIcon from "@mui/icons-material/Update";
import FastGameLoader from "@/components/FastGameLoader";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

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
  expansions?: Array<{ id: string; name: string }>;
  baseGame?: { id: string; name: string };
  popular_categories?: any[];
  popular_mechanics?: any[];
  site_recommended_players?: string[];
  recommended_players?: any[];
}

const ErrorDisplay = ({
  error,
  onRetry,
}: {
  error: string;
  onRetry?: () => void;
}) => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          textAlign: "center",
          bgcolor: "error.light",
          color: "error.contrastText",
        }}
      >
        <Typography variant="h5" gutterBottom>
          エラーが発生しました
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          {error}
        </Typography>
        {onRetry && (
          <Button variant="contained" color="primary" onClick={onRetry}>
            再試行
          </Button>
        )}
      </Paper>
    </Container>
  );
};

export default function GamePageFast({ params }: GamePageProps) {
  const { user, getAuthHeaders, isAdmin } = useAuth();
  const router = useRouter();

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
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [openSystemReviewsDialog, setOpenSystemReviewsDialog] = useState(false);
  const [updatingSystemReviews, setUpdatingSystemReviews] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);

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

  // ユーザーのレビュー数を取得
  useEffect(() => {
    if (user) {
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
  }, [user, getAuthHeaders]);

  // レビュー数が5件以上あるか、または管理者かどうかを判定
  const canEditGame = reviewCount >= 5 || isAdmin;

  // 高速読み込みのコールバック
  const handleGameLoaded = useCallback((gameData: Partial<Game>) => {
    console.log("Fast loader: Game data loaded", gameData);
    setGame(gameData as ExtendedGame);
    setLoading(false);

    if (gameData.japanese_name) {
      setJapaneseName(gameData.japanese_name);
    }
    if (gameData.in_wishlist && typeof gameData.id === "number") {
      setWishlistItemId(gameData.id);
    }
  }, []);

  const handleGameLoadError = useCallback((errorMessage: string) => {
    console.error("Fast loader error:", errorMessage);
    setError(errorMessage);
    setLoading(false);
  }, []);

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSubmitJapaneseName = async () => {
    if (!game || !japaneseName.trim()) return;

    setSubmitting(true);
    try {
      const headers = getAuthHeaders();
      const updatedGame = await updateJapaneseName(
        game.bgg_id,
        japaneseName.trim(),
        headers
      );

      setGame(updatedGame as ExtendedGame);
      setSnackbarMessage("日本語名が更新されました");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setOpenDialog(false);
    } catch (error) {
      console.error("Error updating Japanese name:", error);
      setSnackbarMessage("日本語名の更新に失敗しました");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToWishlist = async () => {
    if (!game || !user) return;

    setAddingToWishlist(true);
    try {
      const headers = getAuthHeaders();
      const result = await addToWishlist(game.bgg_id, headers);

      setWishlistItemId(result.id);
      setGame((prev) => (prev ? { ...prev, in_wishlist: true } : prev));
      setSnackbarMessage("やりたいリストに追加しました");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      setSnackbarMessage("やりたいリストへの追加に失敗しました");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setAddingToWishlist(false);
    }
  };

  const handleRemoveFromWishlist = async () => {
    if (!game || !user || !wishlistItemId) return;

    setAddingToWishlist(true);
    try {
      const headers = getAuthHeaders();
      await removeFromWishlist(wishlistItemId, headers);

      setWishlistItemId(null);
      setGame((prev) => (prev ? { ...prev, in_wishlist: false } : prev));
      setSnackbarMessage("やりたいリストから削除しました");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      setSnackbarMessage("やりたいリストからの削除に失敗しました");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setAddingToWishlist(false);
    }
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
    setForceUpdate(false);
  };

  const handleCloseUpdateDialog = () => {
    setOpenUpdateDialog(false);
    setForceUpdate(false);
  };

  const handleUpdateGameFromBgg = async () => {
    if (!game) return;

    setUpdatingGame(true);
    setLoadingProgress(0);
    try {
      const headers = getAuthHeaders();
      const updatedGame = await updateGameFromBgg(
        game.bgg_id,
        forceUpdate,
        headers
      );

      setGame(updatedGame as ExtendedGame);
      setSnackbarMessage("ゲーム情報が更新されました");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setOpenUpdateDialog(false);
      setLoadingProgress(100);

      setTimeout(() => {
        setLoadingProgress(0);
      }, 1000);
    } catch (error) {
      console.error("Error updating game from BGG:", error);
      let errorMessage = "ゲーム情報の更新に失敗しました";

      if (error instanceof Error) {
        if (error.message.includes("404")) {
          errorMessage = "BGGでゲーム情報が見つかりません";
        } else if (error.message.includes("403")) {
          errorMessage = "更新権限がありません";
        } else if (error.message.includes("429")) {
          errorMessage =
            "リクエストが多すぎます。しばらく待ってから再試行してください";
        } else if (error.message.includes("timeout")) {
          errorMessage =
            "更新処理がタイムアウトしました。しばらく待ってから再試行してください";
        } else {
          errorMessage = error.message;
        }
      }

      setSnackbarMessage(errorMessage);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setLoadingProgress(0);
    } finally {
      setUpdatingGame(false);
    }
  };

  const handleOpenSystemReviewsDialog = () => {
    setOpenSystemReviewsDialog(true);
  };

  const handleCloseSystemReviewsDialog = () => {
    setOpenSystemReviewsDialog(false);
  };

  const handleUpdateSystemReviews = async () => {
    if (!game) return;

    setUpdatingSystemReviews(true);
    try {
      const headers = getAuthHeaders();
      await updateSystemReviews(game.bgg_id, headers);

      setSnackbarMessage("システムレビューが更新されました");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setOpenSystemReviewsDialog(false);

      window.location.reload();
    } catch (error) {
      console.error("Error updating system reviews:", error);
      setSnackbarMessage("システムレビューの更新に失敗しました");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setUpdatingSystemReviews(false);
    }
  };

  // エラーが発生した場合の表示
  if (error) {
    return (
      <ErrorDisplay error={error} onRetry={() => window.location.reload()} />
    );
  }

  // IDが無効な場合の表示
  if (params.id === "undefined" || !params.id) {
    return (
      <ErrorDisplay
        error="無効なゲームIDです。"
        onRetry={() => router.push("/games")}
      />
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* 高速読み込みコンポーネントを使用 */}
      <FastGameLoader
        gameId={params.id}
        onGameLoaded={handleGameLoaded}
        onError={handleGameLoadError}
      />

      {/* 管理機能（ゲームが読み込まれた後に表示） */}
      {game && user && (
        <Box sx={{ mt: 4 }}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              管理機能
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              {/* 日本語名編集ボタン */}
              <Button
                variant="outlined"
                startIcon={<TranslateIcon />}
                onClick={handleOpenDialog}
                disabled={submitting}
              >
                日本語名を編集
              </Button>

              {/* やりたいリストボタン */}
              {game.in_wishlist ? (
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<BookmarkRemoveIcon />}
                  onClick={handleRemoveFromWishlist}
                  disabled={addingToWishlist}
                >
                  やりたいリストから削除
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<BookmarkAddIcon />}
                  onClick={handleAddToWishlist}
                  disabled={addingToWishlist}
                >
                  やりたいリストに追加
                </Button>
              )}

              {/* ゲーム情報更新ボタン（権限チェック） */}
              {canEditGame && (
                <Button
                  variant="outlined"
                  color="info"
                  startIcon={<UpdateIcon />}
                  onClick={handleOpenUpdateDialog}
                  disabled={updatingGame}
                >
                  BGGから情報更新
                </Button>
              )}

              {/* システムレビュー更新ボタン（管理者のみ） */}
              {isAdmin && (
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<RateReviewIcon />}
                  onClick={handleOpenSystemReviewsDialog}
                  disabled={updatingSystemReviews}
                >
                  システムレビュー更新
                </Button>
              )}

              {/* レビュー作成ボタン */}
              <Button
                component={Link}
                href={`/games/${params.id}/review`}
                variant="contained"
                color="primary"
                startIcon={<RateReviewIcon />}
              >
                レビューを書く
              </Button>
            </Box>
          </Paper>
        </Box>
      )}

      {/* 日本語名編集ダイアログ */}
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
            variant="contained"
            disabled={submitting || !japaneseName.trim()}
          >
            {submitting ? <CircularProgress size={20} /> : "更新"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* BGG情報更新ダイアログ */}
      <Dialog
        open={openUpdateDialog}
        onClose={handleCloseUpdateDialog}
        maxWidth="sm"
        fullWidth
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
                disabled={updatingGame}
              />
            }
            label="強制更新（キャッシュを無視）"
          />
          {updatingGame && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                更新中... {loadingProgress}%
              </Typography>
              <LinearProgress variant="determinate" value={loadingProgress} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUpdateDialog} disabled={updatingGame}>
            キャンセル
          </Button>
          <Button
            onClick={handleUpdateGameFromBgg}
            variant="contained"
            disabled={updatingGame}
            startIcon={
              updatingGame ? <CircularProgress size={20} /> : <UpdateIcon />
            }
          >
            {updatingGame ? "更新中..." : "更新開始"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* システムレビュー更新ダイアログ */}
      <Dialog
        open={openSystemReviewsDialog}
        onClose={handleCloseSystemReviewsDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>システムレビューを更新</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            BGGのレビューデータを取得してシステムレビューを更新します。
          </Typography>
          <Typography variant="body2" color="text.secondary">
            この操作は管理者のみが実行できます。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseSystemReviewsDialog}
            disabled={updatingSystemReviews}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleUpdateSystemReviews}
            variant="contained"
            disabled={updatingSystemReviews}
            startIcon={
              updatingSystemReviews ? (
                <CircularProgress size={20} />
              ) : (
                <RateReviewIcon />
              )
            }
          >
            {updatingSystemReviews ? "更新中..." : "更新開始"}
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
