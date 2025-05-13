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
  CardMedia,
  CardActions,
  Rating,
  Chip,
  Stack,
} from "@mui/material";
import Head from "next/head";
import axios from "axios";

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

// ゲームデータのインターフェース
interface Game {
  id: number;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  image?: string;
  rating?: number;
}

// ダミーデータ
const dummyGames: Game[] = [
  {
    id: 1,
    name: "カタン",
    description:
      "資源を集めて開拓するボードゲーム。戦略的な取引と運の要素が絶妙に組み合わさっています。",
    minPlayers: 3,
    maxPlayers: 4,
    rating: 4.5,
  },
  {
    id: 2,
    name: "ドミニオン",
    description:
      "手札構築型のカードゲーム。自分のデッキを強化しながら領土を拡大していきます。",
    minPlayers: 2,
    maxPlayers: 4,
    rating: 4.2,
  },
  {
    id: 3,
    name: "カルカソンヌ",
    description:
      "タイルを配置して街や道路、修道院を作り上げるゲーム。シンプルなルールで奥深い戦略性があります。",
    minPlayers: 2,
    maxPlayers: 5,
    rating: 4.0,
  },
  {
    id: 4,
    name: "パンデミック",
    description:
      "協力型ボードゲーム。世界中に広がる感染症と戦いながら、キュアを見つけ出すミッションに挑みます。",
    minPlayers: 2,
    maxPlayers: 4,
    rating: 4.7,
  },
  {
    id: 5,
    name: "アグリコラ",
    description:
      "農場経営シミュレーションゲーム。限られたアクションの中で効率的に農場を発展させる戦略が重要です。",
    minPlayers: 1,
    maxPlayers: 5,
    rating: 4.3,
  },
];

export default function Home() {
  const [games, setGames] = useState<Game[]>(dummyGames);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // APIのURLを環境変数から取得
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  // ゲームのプレースホルダー画像URL
  const getPlaceholderImage = (id: number) => {
    return `https://via.placeholder.com/300x200?text=Game+${id}`;
  };

  // ゲームデータを取得する（実際のAPIが使える場合）
  const fetchGames = async () => {
    try {
      setLoading(true);
      setError(null);
      // 実際のAPIがある場合はコメントを外す
      // const response = await axios.get(`${apiUrl}/games`);
      // setGames(response.data);

      // ダミーデータを使用（デモ用）
      setTimeout(() => {
        setGames(dummyGames);
        setLoading(false);
      }, 500);
    } catch (err) {
      console.error("Error fetching games:", err);
      setError("ゲームデータの取得に失敗しました");
      setLoading(false);
    }
  };

  // コンポーネントがマウントされたときにデータを取得
  useEffect(() => {
    fetchGames();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Head>
        <title>BGr4 - ボードゲームレビュー</title>
        <meta
          name="description"
          content="お気に入りのボードゲームを見つけよう！レビューやランキングをチェック"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            BGr4 - ボードゲームレビュー
          </Typography>
          <Button color="inherit">ログイン</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4, textAlign: "center" }}>
          <Typography variant="h4" component="h1" gutterBottom>
            お気に入りのボードゲームを見つけよう！
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            様々なボードゲームのレビューやランキングをチェックして、あなたにぴったりのゲームを見つけましょう。
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            人気のボードゲーム
          </Typography>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Paper sx={{ p: 3, textAlign: "center", bgcolor: "error.50" }}>
              <Typography color="error">{error}</Typography>
              <Button
                variant="outlined"
                color="primary"
                sx={{ mt: 2 }}
                onClick={fetchGames}
              >
                再試行
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {games.map((game) => (
                <Grid item xs={12} sm={6} md={4} key={game.id}>
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="200"
                      image={game.image || getPlaceholderImage(game.id)}
                      alt={game.name}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography gutterBottom variant="h5" component="div">
                        {game.name}
                      </Typography>
                      <Box
                        sx={{ mb: 2, display: "flex", alignItems: "center" }}
                      >
                        <Rating
                          value={game.rating || 0}
                          precision={0.1}
                          readOnly
                          size="small"
                        />
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ ml: 1 }}
                        >
                          ({game.rating})
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                        <Chip
                          label={`${game.minPlayers}-${game.maxPlayers}人`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {game.description}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small" color="primary">
                        詳細を見る
                      </Button>
                      <Button size="small" color="secondary">
                        レビューを書く
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            このサイトはCloud Runでホストされています
          </Typography>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
