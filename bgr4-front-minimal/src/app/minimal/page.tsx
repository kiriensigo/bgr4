"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";

export default function MinimalPage() {
  const [apiStatus, setApiStatus] = useState("未接続");
  const [healthStatus, setHealthStatus] = useState("未確認");
  const [loading, setLoading] = useState({ root: false, health: false });
  const [error, setError] = useState({ root: null, health: null });

  // ルートAPIをチェック
  const checkRootApi = async () => {
    setLoading((prev) => ({ ...prev, root: true }));
    setError((prev) => ({ ...prev, root: null }));

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "https://bgr4-api-db-349403738734.asia-northeast1.run.app";
      const response = await fetch(`${apiUrl}/`);

      if (!response.ok) {
        throw new Error(`APIサーバーに接続できません: ${response.status}`);
      }

      const data = await response.text();
      setApiStatus(data || "接続成功");
    } catch (err) {
      setError((prev) => ({
        ...prev,
        root:
          err instanceof Error ? err.message : "予期せぬエラーが発生しました",
      }));
      setApiStatus("接続エラー");
    } finally {
      setLoading((prev) => ({ ...prev, root: false }));
    }
  };

  // ヘルスチェックAPI
  const checkHealthApi = async () => {
    setLoading((prev) => ({ ...prev, health: true }));
    setError((prev) => ({ ...prev, health: null }));

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "https://bgr4-api-db-349403738734.asia-northeast1.run.app";
      const response = await fetch(`${apiUrl}/api/health`);

      if (!response.ok) {
        throw new Error(`ヘルスチェックに失敗しました: ${response.status}`);
      }

      const data = await response.json();
      setHealthStatus(data.status === "ok" ? "正常" : JSON.stringify(data));
    } catch (err) {
      setError((prev) => ({
        ...prev,
        health:
          err instanceof Error ? err.message : "予期せぬエラーが発生しました",
      }));
      setHealthStatus("エラー");
    } finally {
      setLoading((prev) => ({ ...prev, health: false }));
    }
  };

  // 初回ロード時に両方のAPIをチェック
  useEffect(() => {
    checkRootApi();
    checkHealthApi();
  }, []);

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" textAlign="center" gutterBottom>
        ボードゲームレビュー ミニマル
      </Typography>

      <Typography variant="body1" textAlign="center" sx={{ mb: 4 }}>
        シンプルなフロントエンドテストアプリ（ミニマル版）
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            API ルートエンドポイント
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body1">
              状態: <strong>{apiStatus}</strong>
            </Typography>

            {error.root && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {error.root}
              </Alert>
            )}
          </Box>

          <Button
            variant="contained"
            onClick={checkRootApi}
            disabled={loading.root}
            startIcon={loading.root && <CircularProgress size={20} />}
          >
            {loading.root ? "確認中..." : "再確認"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            API ヘルスチェック
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body1">
              状態: <strong>{healthStatus}</strong>
            </Typography>

            {error.health && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {error.health}
              </Alert>
            )}
          </Box>

          <Button
            variant="contained"
            color="secondary"
            onClick={checkHealthApi}
            disabled={loading.health}
            startIcon={loading.health && <CircularProgress size={20} />}
          >
            {loading.health ? "確認中..." : "再確認"}
          </Button>
        </CardContent>
      </Card>

      <Box sx={{ mt: 4, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          API URL:{" "}
          {process.env.NEXT_PUBLIC_API_URL ||
            "https://bgr4-api-db-349403738734.asia-northeast1.run.app"}
        </Typography>
      </Box>
    </Container>
  );
}
