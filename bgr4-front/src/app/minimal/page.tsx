"use client";

import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  CircularProgress,
  Button,
  Card,
  CardContent,
  Grid,
  Divider,
} from "@mui/material";

export default function MinimalPage() {
  const [apiStatus, setApiStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [apiMessage, setApiMessage] = useState<string>("");
  const [healthStatus, setHealthStatus] = useState<
    "loading" | "success" | "error"
  >("loading");
  const [healthMessage, setHealthMessage] = useState<string>("");

  // APIのURLを環境変数から取得
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  // ルートエンドポイントにアクセスする関数
  const fetchRootEndpoint = async () => {
    try {
      setApiStatus("loading");
      const response = await fetch(`${apiUrl}/`);
      const data = await response.json();
      setApiMessage(data.message || JSON.stringify(data));
      setApiStatus("success");
    } catch (error) {
      console.error("Error fetching root endpoint:", error);
      setApiMessage("APIの接続に失敗しました");
      setApiStatus("error");
    }
  };

  // ヘルスチェックエンドポイントにアクセスする関数
  const fetchHealthEndpoint = async () => {
    try {
      setHealthStatus("loading");
      const response = await fetch(`${apiUrl}/health`);
      const data = await response.json();
      setHealthMessage(
        data.status ? `ステータス: ${data.status}` : JSON.stringify(data)
      );
      setHealthStatus("success");
    } catch (error) {
      console.error("Error fetching health endpoint:", error);
      setHealthMessage("ヘルスチェックの接続に失敗しました");
      setHealthStatus("error");
    }
  };

  // コンポーネントがマウントされたときに自動的にエンドポイントをフェッチ
  useEffect(() => {
    fetchRootEndpoint();
    fetchHealthEndpoint();
  }, []);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        BGr4 フロントエンド (最小バージョン)
      </Typography>

      <Typography
        variant="subtitle1"
        gutterBottom
        align="center"
        color="text.secondary"
      >
        バックエンドAPI接続テスト
      </Typography>

      <Divider sx={{ my: 3 }} />

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                API ルートエンドポイント
              </Typography>

              <Box sx={{ my: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  エンドポイント: {`${apiUrl}/`}
                </Typography>

                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    my: 2,
                    minHeight: 100,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor:
                      apiStatus === "error" ? "error.50" : "background.paper",
                  }}
                >
                  {apiStatus === "loading" ? (
                    <CircularProgress size={24} />
                  ) : (
                    <Typography
                      color={apiStatus === "error" ? "error" : "textPrimary"}
                    >
                      {apiMessage}
                    </Typography>
                  )}
                </Paper>

                <Button
                  variant="outlined"
                  onClick={fetchRootEndpoint}
                  disabled={apiStatus === "loading"}
                  fullWidth
                >
                  再取得
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ヘルスチェックエンドポイント
              </Typography>

              <Box sx={{ my: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  エンドポイント: {`${apiUrl}/health`}
                </Typography>

                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    my: 2,
                    minHeight: 100,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor:
                      healthStatus === "error"
                        ? "error.50"
                        : "background.paper",
                  }}
                >
                  {healthStatus === "loading" ? (
                    <CircularProgress size={24} />
                  ) : (
                    <Typography
                      color={healthStatus === "error" ? "error" : "textPrimary"}
                    >
                      {healthMessage}
                    </Typography>
                  )}
                </Paper>

                <Button
                  variant="outlined"
                  onClick={fetchHealthEndpoint}
                  disabled={healthStatus === "loading"}
                  fullWidth
                >
                  再取得
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, textAlign: "center" }}>
        <Button variant="contained" color="primary" href="/">
          ホームに戻る
        </Button>
      </Box>
    </Container>
  );
}
