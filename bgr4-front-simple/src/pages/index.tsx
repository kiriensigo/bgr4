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
  AppBar,
  Toolbar,
  createTheme,
  ThemeProvider,
  CssBaseline,
} from "@mui/material";
import Head from "next/head";

// MUIテーマの作成
const theme = createTheme({
  palette: {
    primary: {
      main: "#3f51b5", // インディゴ
    },
    secondary: {
      main: "#f50057", // ピンク
    },
    background: {
      default: "#f5f5f5",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
        },
      },
    },
  },
});

export default function Home() {
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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Head>
        <title>BGr4 フロントエンド (シンプル)</title>
        <meta
          name="description"
          content="BGr4 フロントエンドアプリケーション"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            BGr4 フロントエンド
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          BGr4 フロントエンド (シンプル)
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
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
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
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
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
                        color={
                          healthStatus === "error" ? "error" : "textPrimary"
                        }
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
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            このページはCloud Runでホストされています
          </Typography>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
