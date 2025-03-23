"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getAuthHeaders } from "@/lib/auth";
import { getTopRankedGames } from "@/lib/bggApi";
import { registerGame } from "@/lib/api";
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import DownloadIcon from "@mui/icons-material/Download";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import InfoIcon from "@mui/icons-material/Info";

export default function BggTop100Page() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [topGames, setTopGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registrationStatus, setRegistrationStatus] = useState<{
    [key: string]: {
      status: "pending" | "success" | "error";
      message?: string;
    };
  }>({});
  const [progress, setProgress] = useState(0);
  const [totalGames, setTotalGames] = useState(0);
  const [registeredCount, setRegisteredCount] = useState(0);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      // 管理者権限を確認
      setIsAdmin(user.is_admin === true);
      if (!user.is_admin) {
        // 管理者でない場合はホームページにリダイレクト
        router.push("/");
      }
    } else if (!authLoading && !user) {
      // ログインしていない場合はログインページにリダイレクト
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const fetchTopGames = useCallback(async () => {
    setLoading(true);
    setError("");
    setTopGames([]);

    try {
      const games = await getTopRankedGames(100);
      setTopGames(games);
    } catch (err: any) {
      setError(
        `ゲーム情報の取得に失敗しました: ${err.message || "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchTopGames();
    }
  }, [isAdmin, fetchTopGames]);

  const registerTopGames = async () => {
    if (topGames.length === 0 || isRegistering) return;

    setIsRegistering(true);
    setRegistrationStatus({});
    setProgress(0);
    setTotalGames(topGames.length);
    setRegisteredCount(0);

    // 認証ヘッダーを取得
    const authHeaders = await getAuthHeaders();

    for (let i = 0; i < topGames.length; i++) {
      const game = topGames[i];
      const gameId = game.id;

      setRegistrationStatus((prev) => ({
        ...prev,
        [gameId]: { status: "pending" },
      }));

      try {
        // ゲームを登録
        await registerGame(game, authHeaders, true);

        setRegistrationStatus((prev) => ({
          ...prev,
          [gameId]: { status: "success" },
        }));

        setRegisteredCount((prev) => prev + 1);
      } catch (err: any) {
        const errorMessage = err.message || "登録に失敗しました";

        // "already exists"などのエラーの場合も成功扱いとする
        if (errorMessage.includes("既に登録されています")) {
          setRegistrationStatus((prev) => ({
            ...prev,
            [gameId]: {
              status: "success",
              message: "既に登録済み",
            },
          }));

          setRegisteredCount((prev) => prev + 1);
        } else {
          setRegistrationStatus((prev) => ({
            ...prev,
            [gameId]: {
              status: "error",
              message: errorMessage,
            },
          }));
        }
      }

      // 進捗状況を更新
      setProgress(Math.floor(((i + 1) / topGames.length) * 100));

      // BGG APIの負荷を減らすために少し待機
      if (i < topGames.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    setIsRegistering(false);
  };

  if (authLoading || !isAdmin) {
    return (
      <Container sx={{ py: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => router.push("/admin")} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          BGG TOP 100ゲーム登録
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={2}
        >
          <Typography variant="h6">
            ランキング上位100ゲームの一括登録
          </Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchTopGames}
              disabled={loading || isRegistering}
              sx={{ mr: 1 }}
            >
              更新
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<DownloadIcon />}
              onClick={registerTopGames}
              disabled={loading || topGames.length === 0 || isRegistering}
            >
              一括登録
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {isRegistering && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {registeredCount}/{totalGames} ゲーム登録完了
            </Typography>
            <LinearProgress variant="determinate" value={progress} />
          </Box>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress />
          </Box>
        ) : (
          <List sx={{ maxHeight: "70vh", overflow: "auto" }}>
            {topGames.map((game, index) => {
              const status = registrationStatus[game.id];

              return (
                <ListItem
                  key={game.id}
                  divider
                  secondaryAction={
                    status ? (
                      status.status === "success" ? (
                        <Tooltip title={status.message || "登録完了"}>
                          <CheckCircleIcon color="success" />
                        </Tooltip>
                      ) : status.status === "error" ? (
                        <Tooltip title={status.message || "エラー"}>
                          <ErrorIcon color="error" />
                        </Tooltip>
                      ) : (
                        <CircularProgress size={20} />
                      )
                    ) : null
                  }
                >
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center">
                        <Chip label={index + 1} size="small" sx={{ mr: 1 }} />
                        {game.name}
                        {game.yearPublished && ` (${game.yearPublished})`}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" component="span">
                          BGG ID: {game.id} | {game.minPlayers}-
                          {game.maxPlayers}人 | {game.maxPlayTime}分
                        </Typography>
                        <Typography
                          variant="body2"
                          component="span"
                          sx={{ ml: 1 }}
                        >
                          BGG評価: {game.averageRating?.toFixed(1) || "N/A"}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        )}
      </Paper>
    </Container>
  );
}
