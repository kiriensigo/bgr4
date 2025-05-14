import React, { useEffect, useState } from "react";
import {
  Typography,
  Box,
  Paper,
  CircularProgress,
  Button,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Pagination,
  TextField,
  InputAdornment,
} from "@mui/material";
import Link from "next/link";
import SearchIcon from "@mui/icons-material/Search";
import Layout from "../components/Layout";

// ゲームの型定義
interface Game {
  id: number;
  name: string;
  image_url?: string;
  min_players?: number;
  max_players?: number;
  playing_time?: number;
  description?: string;
}

// モックデータ
const mockGames: Game[] = [
  {
    id: 1,
    name: "カタン",
    image_url:
      "https://cf.geekdo-images.com/W3Bsga_uLP9kO91gZ7H8yw__imagepage/img/M_3Vg1j2HlNgkv7PL2xl2BJE2bw=/fit-in/900x600/filters:no_upscale():strip_icc()/pic2419375.jpg",
    min_players: 3,
    max_players: 4,
    playing_time: 60,
    description: "資源を集めて道や都市を作り、勝利点を競うゲーム",
  },
  {
    id: 2,
    name: "ドミニオン",
    image_url:
      "https://cf.geekdo-images.com/j6iQpZ4XkemZP07HNCODBA__imagepage/img/_tNxKUkYOIWHGCPJuefIh-B1CSc=/fit-in/900x600/filters:no_upscale():strip_icc()/pic394356.jpg",
    min_players: 2,
    max_players: 4,
    playing_time: 30,
    description: "デッキ構築型のカードゲーム",
  },
  {
    id: 3,
    name: "パンデミック",
    image_url:
      "https://cf.geekdo-images.com/S3ybV1LAp-8SnHIXLLjVqA__imagepage/img/kIBu36OGgj4YZQBBjQoeWJccfQA=/fit-in/900x600/filters:no_upscale():strip_icc()/pic1534148.jpg",
    min_players: 2,
    max_players: 4,
    playing_time: 45,
    description: "協力型のボードゲーム。世界的な感染症の拡大を防ぐ",
  },
  {
    id: 4,
    name: "アグリコラ",
    image_url:
      "https://cf.geekdo-images.com/dDDo2Hexl80ucK1IlqTk-g__imagepage/img/5GQyYRNIgGABs0hGgQpNlZkjRRc=/fit-in/900x600/filters:no_upscale():strip_icc()/pic831744.jpg",
    min_players: 1,
    max_players: 5,
    playing_time: 120,
    description: "農場を発展させるワーカープレイスメントゲーム",
  },
  {
    id: 5,
    name: "テラフォーミングマーズ",
    image_url:
      "https://cf.geekdo-images.com/wg9oOLcsKvDesSUdZQ4rxw__imagepage/img/FS1RE8Ue6nk1pNbPI3l-OSapQGc=/fit-in/900x600/filters:no_upscale():strip_icc()/pic3536616.jpg",
    min_players: 1,
    max_players: 5,
    playing_time: 120,
    description: "火星を地球化するエンジンビルディングゲーム",
  },
  {
    id: 6,
    name: "スプレンダー",
    image_url:
      "https://cf.geekdo-images.com/rwOMxx4q5yuElIvo-1-OFw__imagepage/img/qXhR0IoDK-3Z7G5wFUf0pWSgzKY=/fit-in/900x600/filters:no_upscale():strip_icc()/pic1904079.jpg",
    min_players: 2,
    max_players: 4,
    playing_time: 30,
    description: "宝石を集めてカードを獲得するエンジンビルディングゲーム",
  },
  {
    id: 7,
    name: "7つの習慣",
    image_url:
      "https://cf.geekdo-images.com/0K1AOciqlMVUWFPLTJSiww__imagepage/img/pC5hC440R46jn4EpfdYV5rL4VOc=/fit-in/900x600/filters:no_upscale():strip_icc()/pic2576399.jpg",
    min_players: 2,
    max_players: 7,
    playing_time: 30,
    description: "カードを出し合って7つの不思議を建設する",
  },
  {
    id: 8,
    name: "カルカソンヌ",
    image_url:
      "https://cf.geekdo-images.com/okM0dq_bEXnbyQTOvHfwRA__imagepage/img/axgQKZCS7xdW1hMvlgMV9bZfLnA=/fit-in/900x600/filters:no_upscale():strip_icc()/pic6544250.png",
    min_players: 2,
    max_players: 5,
    playing_time: 45,
    description: "タイルを配置して領地を作るゲーム",
  },
  {
    id: 9,
    name: "ごきぶりポーカー",
    image_url:
      "https://cf.geekdo-images.com/CvQHXtKnZ9mp0gUYhca8qA__imagepage/img/I6PX0nHmS7OfxZLLzVObXUj_Xww=/fit-in/900x600/filters:no_upscale():strip_icc()/pic5241325.png",
    min_players: 2,
    max_players: 6,
    playing_time: 20,
    description: "ブラフとポーカーの要素を持つカードゲーム",
  },
  {
    id: 10,
    name: "ニムト",
    image_url:
      "https://cf.geekdo-images.com/hvHzVOGAYrX7JKhwHq4KKA__imagepage/img/8hVkGSKqbZ8eWDKx6IxrLAQvJmE=/fit-in/900x600/filters:no_upscale():strip_icc()/pic7642400.jpg",
    min_players: 2,
    max_players: 10,
    playing_time: 45,
    description: "カードを出し合って、牛のペナルティを避けるゲーム",
  },
  {
    id: 11,
    name: "ラブレター",
    image_url:
      "https://cf.geekdo-images.com/T1ltXwapFUtghS9A7_tf4g__imagepage/img/mPZvf5oH7bBz5tnN-JlrhOQH8fk=/fit-in/900x600/filters:no_upscale():strip_icc()/pic1401448.jpg",
    min_players: 2,
    max_players: 4,
    playing_time: 20,
    description: "シンプルなカードゲーム。お姫様にラブレターを届けよう",
  },
  {
    id: 12,
    name: "宝石の煌き",
    image_url:
      "https://cf.geekdo-images.com/nNYnZIX9xDEDLV6NtRWDKw__imagepage/img/qTrG9-miBGFU-9rWZ5hBd7aCEGM=/fit-in/900x600/filters:no_upscale():strip_icc()/pic5638608.jpg",
    min_players: 1,
    max_players: 4,
    playing_time: 45,
    description: "宝石を集めてカードを獲得するエンジンビルディングゲーム",
  },
];

export default function Games() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [useLocalData, setUseLocalData] = useState<boolean>(
    process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true"
  );
  const [apiDebugInfo, setApiDebugInfo] = useState<string | null>(null);

  // APIのURLを環境変数から取得
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const gamesPerPage = 12;

  console.log("API URL:", apiUrl); // APIのURLをログに出力
  console.log("Use Mock Data:", process.env.NEXT_PUBLIC_USE_MOCK_DATA);

  // ゲーム一覧を取得する関数
  const fetchGames = async (pageNum: number, keyword: string = "") => {
    try {
      setLoading(true);
      setError(null);
      setApiDebugInfo(null);

      // 環境変数でモックデータを使うように設定されている場合
      if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true") {
        console.log("環境変数の設定によりモックデータを使用します");
        handleLocalData(pageNum, keyword);
        return;
      }

      const requestUrl = `${apiUrl}/games?page=${pageNum}&per_page=${gamesPerPage}${
        keyword ? `&keyword=${encodeURIComponent(keyword)}` : ""
      }`;
      
      console.log("リクエストURL:", requestUrl);
      
      // APIからゲーム一覧を取得
      const response = await fetch(requestUrl);
      
      console.log("APIレスポンスステータス:", response.status);
      const responseText = await response.text();
      console.log("APIレスポンステキスト:", responseText);
      
      setApiDebugInfo(`ステータス: ${response.status}, レスポンス: ${responseText.substring(0, 100)}${responseText.length > 100 ? '...' : ''}`);

      if (!response.ok) {
        throw new Error(`APIエラー: ${response.status} - ${responseText}`);
      }

      let data;
      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch (parseError) {
        console.error("JSONパースエラー:", parseError);
        throw new Error(`APIレスポンスのJSONパースに失敗しました: ${responseText}`);
      }

      console.log("パースされたデータ:", data);

      // データがオブジェクトで、gamesプロパティがある場合
      if (data && data.games) {
        setGames(data.games);
        setTotalPages(Math.ceil(data.total_count / gamesPerPage) || 1);
      } else if (Array.isArray(data)) {
        // データが直接配列の場合
        setGames(data);
        // ページ数の情報がない場合は、取得したゲーム数から推定
        setTotalPages(Math.ceil(data.length / gamesPerPage) || 1);
      } else {
        setGames([]);
        setTotalPages(1);
        // データがない場合はモックデータにフォールバック
        throw new Error("APIからのデータ形式が不正または空です");
      }
    } catch (error) {
      console.error("ゲーム一覧の取得に失敗しました:", error);
      setError(
        `APIからのゲーム一覧の取得に失敗しました: ${error instanceof Error ? error.message : String(error)}。モックデータを表示しています。`
      );
      setUseLocalData(true);

      // モックデータを使用
      const filteredGames = keyword
        ? mockGames.filter((game) =>
            game.name.toLowerCase().includes(keyword.toLowerCase())
          )
        : mockGames;

      // ページネーション用のデータを計算
      const start = (pageNum - 1) * gamesPerPage;
      const end = start + gamesPerPage;
      const paginatedGames = filteredGames.slice(start, end);

      setGames(paginatedGames);
      setTotalPages(Math.ceil(filteredGames.length / gamesPerPage) || 1);
    } finally {
      setLoading(false);
    }
  };

  // ローカルデータを使用した検索とページネーション
  const handleLocalData = (pageNum: number, keyword: string = "") => {
    setLoading(true);

    // キーワードでフィルタリング
    const filteredGames = keyword
      ? mockGames.filter((game) =>
          game.name.toLowerCase().includes(keyword.toLowerCase())
        )
      : mockGames;

    // ページネーション用のデータを計算
    const start = (pageNum - 1) * gamesPerPage;
    const end = start + gamesPerPage;
    const paginatedGames = filteredGames.slice(start, end);

    setGames(paginatedGames);
    setTotalPages(Math.ceil(filteredGames.length / gamesPerPage) || 1);
    setLoading(false);
  };

  // ページ変更ハンドラー
  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPage(value);
    window.scrollTo(0, 0);

    if (useLocalData) {
      handleLocalData(value, searchTerm);
    } else {
      fetchGames(value, searchTerm);
    }
  };

  // 検索ハンドラー
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);

    // 検索タイムアウトをクリア
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // 入力が終わってから0.5秒後に検索を実行
    const timeout = setTimeout(() => {
      setPage(1);
      if (useLocalData) {
        handleLocalData(1, value);
      } else {
        fetchGames(1, value);
      }
    }, 500);

    setSearchTimeout(timeout);
  };

  // コンポーネントがマウントされたときにゲーム一覧を取得
  useEffect(() => {
    fetchGames(page, searchTerm);
    
    // 環境変数の確認
    console.log("環境変数:", {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NODE_ENV: process.env.NODE_ENV
    });
  }, []);

  // コンポーネントがアンマウントされるときにタイムアウトをクリア
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  return (
    <Layout
      title="ゲーム一覧"
      description="BGr4のゲーム一覧ページ"
      currentPath="/games"
    >
      <Typography variant="h4" component="h1" gutterBottom align="center">
        ボードゲーム一覧
      </Typography>

      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="ゲーム名で検索..."
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {useLocalData && (
        <Paper
          elevation={1}
          sx={{
            p: 2,
            mb: 3,
            bgcolor: "info.light",
            color: "info.contrastText",
          }}
        >
          <Typography>
            APIサーバーに接続できないため、モックデータを表示しています。
          </Typography>
          {error && (
            <Typography sx={{ mt: 1, fontSize: '0.9rem' }}>
              エラー詳細: {error}
            </Typography>
          )}
          {apiDebugInfo && (
            <Typography sx={{ mt: 1, fontSize: '0.8rem', fontFamily: 'monospace' }}>
              API Debug: {apiDebugInfo}
            </Typography>
          )}
        </Paper>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error && !useLocalData ? (
        <Paper
          elevation={1}
          sx={{ p: 3, textAlign: "center", color: "error.main" }}
        >
          {error}
        </Paper>
      ) : games.length === 0 ? (
        <Paper elevation={1} sx={{ p: 3, textAlign: "center" }}>
          ゲームが見つかりませんでした
        </Paper>
      ) : (
        <>
          <Grid container spacing={3}>
            {games.map((game) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={game.id}>
                <Card>
                  <CardMedia
                    component="img"
                    height="200"
                    image={
                      game.image_url ||
                      "https://via.placeholder.com/300x200?text=No+Image"
                    }
                    alt={game.name}
                    sx={{ objectFit: "contain", bgcolor: "#f0f0f0" }}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h2" gutterBottom noWrap>
                      {game.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      プレイ人数: {game.min_players || "?"}-
                      {game.max_players || "?"}人
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      プレイ時間:{" "}
                      {game.playing_time ? `約${game.playing_time}分` : "不明"}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        component={Link}
                        href={`/games/${game.id}`}
                      >
                        詳細を見る
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
              size="large"
            />
          </Box>
        </>
      )}
    </Layout>
  );
}
