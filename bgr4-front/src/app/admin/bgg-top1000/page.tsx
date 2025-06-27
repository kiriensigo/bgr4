"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RefreshIcon from "@mui/icons-material/Refresh";
import InfoIcon from "@mui/icons-material/Info";

export default function BGGTop1000Page() {
  const router = useRouter();
  const { user, loading: authLoading, getAuthHeaders } = useAuth();
  const [loading, setLoading] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<any>(null);
  const [systemStats, setSystemStats] = useState<any>(null);
  const [dbStats, setDbStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  // 管理者権限チェック
  useEffect(() => {
    if (
      !authLoading &&
      (!user || !user.email?.endsWith("@boardgamereview.com"))
    ) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // 統計情報の取得
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const authHeaders = getAuthHeaders();

      // 登録状況の取得
      const statusResponse = await fetch(
        "http://localhost:3000/api/v1/admin/bgg_registration_status",
        {
          headers: authHeaders,
        }
      );
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setRegistrationStatus(statusData);
      }

      // システムレビュー統計の取得
      const systemResponse = await fetch(
        "http://localhost:3000/api/v1/admin/system_reviews_stats",
        {
          headers: authHeaders,
        }
      );
      if (systemResponse.ok) {
        const systemData = await systemResponse.json();
        setSystemStats(systemData);
      }

      // データベース統計の取得
      const dbResponse = await fetch(
        "http://localhost:3000/api/v1/admin/database_stats",
        {
          headers: authHeaders,
        }
      );
      if (dbResponse.ok) {
        const dbData = await dbResponse.json();
        setDbStats(dbData);
      }
    } catch (error) {
      console.error("統計情報の取得エラー:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.email?.endsWith("@boardgamereview.com")) {
      fetchStats();
    }
  }, [user]);

  // BGG上位1000位の登録開始
  const handleStartRegistration = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const authHeaders = getAuthHeaders();
      const response = await fetch(
        "http://localhost:3000/api/v1/admin/register_bgg_top_1000",
        {
          method: "POST",
          headers: authHeaders,
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSuccess(data.message);
        setConfirmDialogOpen(false);

        // 処理開始後、定期的に進行状況を更新
        const interval = setInterval(() => {
          fetchStats();
        }, 30000); // 30秒ごと

        // 5分後にインターバルを停止
        setTimeout(() => {
          clearInterval(interval);
        }, 300000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "登録の開始に失敗しました");
      }
    } catch (error) {
      setError("ネットワークエラーが発生しました");
      console.error("Registration error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!user || !user.email?.endsWith("@boardgamereview.com")) {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/admin")}
          sx={{ mb: 2 }}
        >
          管理者ページに戻る
        </Button>
        <Typography variant="h4" component="h1" gutterBottom>
          BGG上位1000位 ゲーム登録
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          BoardGameGeek（BGG）の上位1000位のゲームを一括登録します。
          この処理には時間がかかります（約2〜3時間）。
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* 実行ボタン */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                BGG上位1000位ゲーム登録
              </Typography>
              <Typography variant="body2" paragraph>
                以下の処理が自動実行されます：
              </Typography>
              <Box component="ul" sx={{ pl: 2, mb: 2 }}>
                <Typography component="li" variant="body2">
                  BGGランキングページから上位1000位のゲームIDを取得
                </Typography>
                <Typography component="li" variant="body2">
                  各ゲームの詳細情報をBGG APIから取得
                </Typography>
                <Typography component="li" variant="body2">
                  BGGカテゴリー・メカニクスを当サイト形式に変換
                </Typography>
                <Typography component="li" variant="body2">
                  ゲーム名・説明の日本語翻訳（必要に応じて）
                </Typography>
                <Typography component="li" variant="body2">
                  各ゲームに10件のシステムレビューを作成
                </Typography>
              </Box>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<PlayArrowIcon />}
                onClick={() => setConfirmDialogOpen(true)}
                disabled={loading}
                fullWidth
              >
                {loading ? (
                  <>
                    <CircularProgress size={24} sx={{ mr: 1 }} />
                    処理中...
                  </>
                ) : (
                  "BGG上位1000位ゲーム登録を開始"
                )}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* 統計情報 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="h6">現在の統計</Typography>
                <Button
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={fetchStats}
                  disabled={statsLoading}
                >
                  更新
                </Button>
              </Box>

              {statsLoading ? (
                <CircularProgress size={24} />
              ) : dbStats ? (
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>総ゲーム数</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={dbStats.total_games.toLocaleString()}
                            color="primary"
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>登録済みゲーム数</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={dbStats.registered_games.toLocaleString()}
                            color="success"
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>ユーザーレビュー数</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={dbStats.user_reviews.toLocaleString()}
                            color="info"
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>日本語名付きゲーム</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={dbStats.games_with_japanese_names.toLocaleString()}
                            color="secondary"
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>今日追加されたゲーム</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={dbStats.recent_activity.games_added_today.toLocaleString()}
                            color={
                              dbStats.recent_activity.games_added_today > 0
                                ? "success"
                                : "default"
                            }
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2">統計情報を読み込み中...</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* システムレビュー統計 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                システムレビュー統計
              </Typography>

              {systemStats ? (
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>総システムレビュー数</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={systemStats.total_system_reviews.toLocaleString()}
                            color="primary"
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>システムレビュー付きゲーム</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={systemStats.games_with_system_reviews.toLocaleString()}
                            color="success"
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>レビュー不足ゲーム</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={systemStats.games_needing_system_reviews.toLocaleString()}
                            color={
                              systemStats.games_needing_system_reviews > 0
                                ? "warning"
                                : "success"
                            }
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2">
                  システムレビュー統計を読み込み中...
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 最近の活動 */}
        {registrationStatus && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  最近の登録活動（過去1時間）
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary">
                        {registrationStatus.recent_games_registered}
                      </Typography>
                      <Typography variant="body2">新規ゲーム登録</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="secondary">
                        {registrationStatus.recent_system_reviews_created}
                      </Typography>
                      <Typography variant="body2">
                        システムレビュー作成
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box textAlign="center">
                      <Typography variant="body2" color="text.secondary">
                        最終更新:{" "}
                        {new Date(
                          registrationStatus.last_updated
                        ).toLocaleString("ja-JP")}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* 確認ダイアログ */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <InfoIcon color="warning" sx={{ mr: 1 }} />
            BGG上位1000位ゲーム登録の確認
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            この処理は以下の特徴があります：
          </DialogContentText>
          <Box component="ul" sx={{ mt: 2, pl: 2 }}>
            <Typography component="li" variant="body2" gutterBottom>
              約2〜3時間の処理時間が必要です
            </Typography>
            <Typography component="li" variant="body2" gutterBottom>
              BGG APIに大量のリクエストを送信します
            </Typography>
            <Typography component="li" variant="body2" gutterBottom>
              バックグラウンドで実行されるため、ページを閉じても継続されます
            </Typography>
            <Typography component="li" variant="body2" gutterBottom>
              処理中は他のBGG API依存機能が影響を受ける可能性があります
            </Typography>
          </Box>
          <DialogContentText sx={{ mt: 2 }}>
            実行してもよろしいですか？
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>
            キャンセル
          </Button>
          <Button
            onClick={handleStartRegistration}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            実行する
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
