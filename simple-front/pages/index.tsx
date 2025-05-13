import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Chip,
} from "@mui/material";

interface ApiResponse {
  status: string;
  message: string;
}

export default function Home() {
  const [apiStatus, setApiStatus] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // APIの接続状態を確認する
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        setLoading(true);
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL ||
          "https://bgr4-api-db-349403738734.asia-northeast1.run.app";
        const response = await fetch(`${apiUrl}/api/health`);

        if (!response.ok) {
          throw new Error(`APIサーバーに接続できません: ${response.status}`);
        }

        const data = await response.json();
        setApiStatus(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "予期せぬエラーが発生しました"
        );
      } finally {
        setLoading(false);
      }
    };

    checkApiStatus();
  }, []);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h2" component="h1" gutterBottom align="center">
        ボードゲームレビュー
      </Typography>

      <Typography
        variant="h5"
        gutterBottom
        align="center"
        color="textSecondary"
        sx={{ mb: 4 }}
      >
        シンプルなボードゲームレビューサイト
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          APIステータス
        </Typography>

        {loading ? (
          <Typography>APIに接続中...</Typography>
        ) : error ? (
          <Typography color="error">エラー: {error}</Typography>
        ) : apiStatus ? (
          <Box>
            <Typography color="success.main">
              {apiStatus.message || "APIに接続できました！"}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              ステータス: {apiStatus.status}
            </Typography>
          </Box>
        ) : (
          <Typography color="warning.main">
            APIからのレスポンスがありません
          </Typography>
        )}
      </Paper>

      <Typography variant="h4" gutterBottom sx={{ mt: 6, mb: 3 }}>
        人気のボードゲーム
      </Typography>

      <Grid container spacing={3}>
        {[
          {
            id: 1,
            name: "カタン",
            image:
              "https://cf.geekdo-images.com/W3Bsga_uLP9kO91gZ7H8yw__thumb/img/8a9HeqFydO7Uun_le9bXWPnidcA=/fit-in/200x150/filters:strip_icc()/pic2419375.jpg",
            rating: 4.5,
            players: "2-4人",
            time: "60-120分",
          },
          {
            id: 2,
            name: "アグリコラ",
            image:
              "https://cf.geekdo-images.com/dDDo2Hexl80ucK1IlqTk-g__thumb/img/MQn8Yz-nK9-RVz3y_zpdIlj2His=/fit-in/200x150/filters:strip_icc()/pic831744.jpg",
            rating: 4.7,
            players: "1-5人",
            time: "30-120分",
          },
          {
            id: 3,
            name: "パンデミック",
            image:
              "https://cf.geekdo-images.com/S3ybV1LAp-8SnHIXLLjVqA__thumb/img/oqViRj6nVxK3m36NluTxU1PZkrk=/fit-in/200x150/filters:strip_icc()/pic1534148.jpg",
            rating: 4.3,
            players: "2-4人",
            time: "45分",
          },
        ].map((game) => (
          <Grid item xs={12} sm={6} md={4} key={game.id}>
            <Card
              sx={{ height: "100%", display: "flex", flexDirection: "column" }}
            >
              <CardActionArea>
                <CardMedia
                  component="img"
                  height="140"
                  image={game.image}
                  alt={game.name}
                />
                <CardContent>
                  <Typography gutterBottom variant="h6" component="div">
                    {game.name}
                  </Typography>
                  <Box
                    sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}
                  >
                    <Chip
                      label={`評価: ${game.rating}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      label={game.players}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                    <Chip
                      label={game.time}
                      size="small"
                      color="info"
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 6, textAlign: "center" }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          href="https://bgr4-front-review-349403738734.asia-northeast1.run.app"
        >
          詳細なレビューサイトへ
        </Button>
      </Box>
    </Container>
  );
}
