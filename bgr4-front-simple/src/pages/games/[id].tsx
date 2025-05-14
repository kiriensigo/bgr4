import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  Typography,
  Box,
  Paper,
  CircularProgress,
  Button,
  Grid,
  Divider,
  Chip,
  Rating,
  Card,
  CardContent,
  CardHeader,
  Avatar,
} from "@mui/material";
import Link from "next/link";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PeopleIcon from "@mui/icons-material/People";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CategoryIcon from "@mui/icons-material/Category";
import SettingsIcon from "@mui/icons-material/Settings";
import StarIcon from "@mui/icons-material/Star";
import Layout from "../../components/Layout";

// ゲームの型定義
interface Game {
  id: number;
  name: string;
  image_url?: string;
  min_players?: number;
  max_players?: number;
  playing_time?: number;
  description?: string;
  mechanics?: string[];
  categories?: string[];
  designer?: string;
  publisher?: string;
  year_published?: number;
  complexity?: number;
  bgg_rating?: number;
}

// レビューの型定義
interface Review {
  id: number;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

// モックゲームデータ
const mockGames: Game[] = [
  {
    id: 1,
    name: "カタン",
    image_url:
      "https://cf.geekdo-images.com/W3Bsga_uLP9kO91gZ7H8yw__imagepage/img/M_3Vg1j2HlNgkv7PL2xl2BJE2bw=/fit-in/900x600/filters:no_upscale():strip_icc()/pic2419375.jpg",
    min_players: 3,
    max_players: 4,
    playing_time: 60,
    description:
      "資源を集めて道や都市を作り、勝利点を競うゲーム。プレイヤーは開拓者となり、カタン島に入植します。サイコロの目に応じて資源カードを集め、道や集落、都市を建設していきます。交易も重要な要素で、他プレイヤーと資源を交換することができます。最初に勝利点10点を獲得したプレイヤーが勝利します。",
    mechanics: ["サイコロ", "資源管理", "交渉", "道の建設"],
    categories: ["戦略", "交渉", "文明"],
    designer: "クラウス・トイバー",
    publisher: "コスモス",
    year_published: 1995,
    complexity: 2.3,
    bgg_rating: 7.1,
  },
  {
    id: 2,
    name: "ドミニオン",
    image_url:
      "https://cf.geekdo-images.com/j6iQpZ4XkemZP07HNCODBA__imagepage/img/_tNxKUkYOIWHGCPJuefIh-B1CSc=/fit-in/900x600/filters:no_upscale():strip_icc()/pic394356.jpg",
    min_players: 2,
    max_players: 4,
    playing_time: 30,
    description:
      "デッキ構築型のカードゲーム。プレイヤーは小さな王国の君主となり、自分の領土を拡大していきます。ゲーム開始時は基本的なカードのみを持っていますが、ゲーム中に様々なカードを購入してデッキを強化していきます。ゲーム終了時に最も多くの勝利点を獲得したプレイヤーが勝利します。",
    mechanics: ["デッキ構築", "ハンド管理", "カード獲得"],
    categories: ["戦略", "カードゲーム"],
    designer: "ドナルド・X・ヴァッカリーノ",
    publisher: "Rio Grande Games",
    year_published: 2008,
    complexity: 2.4,
    bgg_rating: 7.6,
  },
  {
    id: 3,
    name: "パンデミック",
    image_url:
      "https://cf.geekdo-images.com/S3ybV1LAp-8SnHIXLLjVqA__imagepage/img/kIBu36OGgj4YZQBBjQoeWJccfQA=/fit-in/900x600/filters:no_upscale():strip_icc()/pic1534148.jpg",
    min_players: 2,
    max_players: 4,
    playing_time: 45,
    description:
      "協力型のボードゲーム。世界的な感染症の拡大を防ぐために、プレイヤーは様々な役割（科学者、研究者、衛生兵など）を担当し、チームとして協力します。感染を抑えながら、4種類の病気の治療法を発見することが目標です。時間との戦いでもあり、感染カードのデッキがなくなるか、アウトブレイクが多発すると全員の敗北となります。",
    mechanics: [
      "協力プレイ",
      "ハンド管理",
      "ポイント・トゥ・ポイント移動",
      "役割の割り当て",
    ],
    categories: ["医学", "協力", "現代"],
    designer: "マット・リーコック",
    publisher: "Z-Man Games",
    year_published: 2008,
    complexity: 2.4,
    bgg_rating: 7.6,
  },
  {
    id: 4,
    name: "アグリコラ",
    image_url:
      "https://cf.geekdo-images.com/dDDo2Hexl80ucK1IlqTk-g__imagepage/img/5GQyYRNIgGABs0hGgQpNlZkjRRc=/fit-in/900x600/filters:no_upscale():strip_icc()/pic831744.jpg",
    min_players: 1,
    max_players: 5,
    playing_time: 120,
    description:
      "農場を発展させるワーカープレイスメントゲーム。プレイヤーは農民となり、限られた行動回数の中で、農場を効率的に発展させていきます。畑を耕し、家畜を飼育し、家族を増やし、家を拡張するなど、様々な選択肢の中から最適な行動を選ぶ必要があります。ゲーム終了時に最も繁栄した農場を作ったプレイヤーが勝利します。",
    mechanics: ["ワーカープレイスメント", "資源管理", "タイル配置"],
    categories: ["農業", "経済", "中世"],
    designer: "ウヴェ・ローゼンベルク",
    publisher: "Lookout Games",
    year_published: 2007,
    complexity: 3.6,
    bgg_rating: 7.9,
  },
  {
    id: 5,
    name: "テラフォーミングマーズ",
    image_url:
      "https://cf.geekdo-images.com/wg9oOLcsKvDesSUdZQ4rxw__imagepage/img/FS1RE8Ue6nk1pNbPI3l-OSapQGc=/fit-in/900x600/filters:no_upscale():strip_icc()/pic3536616.jpg",
    min_players: 1,
    max_players: 5,
    playing_time: 120,
    description:
      "火星を地球化するエンジンビルディングゲーム。プレイヤーは大企業となり、火星の地球化プロジェクトに参加します。温度を上げ、酸素濃度を高め、海を作るなどの地球化指標を上げながら、自社の利益も追求していきます。カードを使って様々なプロジェクトを実行し、火星に都市や緑地を建設していきます。ゲーム終了時に最も多くの勝利点を獲得したプレイヤーが勝利します。",
    mechanics: [
      "エンジンビルディング",
      "タイル配置",
      "ハンド管理",
      "変数プレイヤーパワー",
    ],
    categories: ["科学", "宇宙探検", "地球化"],
    designer: "ヤコブ・フリクセリウス",
    publisher: "FryxGames",
    year_published: 2016,
    complexity: 3.2,
    bgg_rating: 8.4,
  },
];

// モックレビューデータ
const mockReviews: { [key: number]: Review[] } = {
  1: [
    {
      id: 1,
      user_name: "ボードゲーム愛好家",
      rating: 4.5,
      comment:
        "定番中の定番ゲーム。何度やっても楽しい！初心者にもおすすめです。",
      created_at: "2023-05-15T09:30:00Z",
    },
    {
      id: 2,
      user_name: "ゲーマー太郎",
      rating: 4.0,
      comment:
        "交渉要素が面白い。ただ運の要素も強いので、その点は好みが分かれるかも。",
      created_at: "2023-06-20T14:15:00Z",
    },
  ],
  2: [
    {
      id: 3,
      user_name: "カードゲームマニア",
      rating: 5.0,
      comment: "デッキ構築ゲームの金字塔。拡張も含めると組み合わせは無限大！",
      created_at: "2023-04-10T18:45:00Z",
    },
  ],
  3: [
    {
      id: 4,
      user_name: "協力プレイ好き",
      rating: 4.5,
      comment:
        "協力ゲームとしては最高峰の一つ。難易度調整もできるので長く遊べます。",
      created_at: "2023-07-05T21:20:00Z",
    },
    {
      id: 5,
      user_name: "ボードゲーム初心者",
      rating: 3.5,
      comment:
        "ルールは簡単だけど、勝つのは難しい！でも皆で協力するのが楽しい。",
      created_at: "2023-08-12T11:10:00Z",
    },
  ],
  4: [
    {
      id: 6,
      user_name: "重ゲー派",
      rating: 5.0,
      comment:
        "農業をテーマにした重量級ゲームの傑作。考えることが多くて脳が焼ける。",
      created_at: "2023-03-25T16:30:00Z",
    },
  ],
  5: [
    {
      id: 7,
      user_name: "SF好き",
      rating: 4.8,
      comment:
        "テーマと機構が見事にマッチした傑作。火星を緑化していく過程が楽しい。",
      created_at: "2023-09-02T10:05:00Z",
    },
    {
      id: 8,
      user_name: "エンジンビルダー",
      rating: 4.5,
      comment: "カードの組み合わせを考えるのが面白い。毎回違う戦略で遊べる。",
      created_at: "2023-10-18T19:40:00Z",
    },
  ],
};

export default function GameDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [game, setGame] = useState<Game | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [useLocalData, setUseLocalData] = useState<boolean>(
    process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true"
  );
  const [apiDebugInfo, setApiDebugInfo] = useState<string | null>(null);

  // APIのURLを環境変数から取得
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  
  console.log("API URL:", apiUrl); // APIのURLをログに出力
  console.log("Use Mock Data:", process.env.NEXT_PUBLIC_USE_MOCK_DATA);

  // モックデータからゲームを取得する関数
  const getGameFromMock = (gameId: string) => {
    const numId = parseInt(gameId, 10);
    return mockGames.find((g) => g.id === numId) || null;
  };

  // モックデータからレビューを取得する関数
  const getReviewsFromMock = (gameId: string) => {
    const numId = parseInt(gameId, 10);
    return mockReviews[numId] || [];
  };

  // ゲーム詳細を取得する関数
  const fetchGameDetail = async (gameId: string) => {
    try {
      setLoading(true);
      setError(null);
      setApiDebugInfo(null);

      // 環境変数でモックデータを使うように設定されている場合
      if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true") {
        console.log("環境変数の設定によりモックデータを使用します");
        const mockGame = getGameFromMock(gameId);
        const mockGameReviews = getReviewsFromMock(gameId);

        if (mockGame) {
          setGame(mockGame);
          setReviews(mockGameReviews);
        } else {
          setError("ゲームが見つかりませんでした");
          setGame(null);
        }
        setLoading(false);
        return;
      }

      const requestUrl = `${apiUrl}/games/${gameId}`;
      console.log("リクエストURL:", requestUrl);

      // APIからゲーム詳細を取得
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
      
      if (!data) {
        throw new Error("APIからのデータが空です");
      }
      
      setGame(data);

      // レビューも取得
      try {
        const reviewsRequestUrl = `${apiUrl}/games/${gameId}/reviews`;
        console.log("レビューリクエストURL:", reviewsRequestUrl);
        
        const reviewsResponse = await fetch(reviewsRequestUrl);
        console.log("レビューAPIレスポンスステータス:", reviewsResponse.status);
        
        if (reviewsResponse.ok) {
          const reviewsResponseText = await reviewsResponse.text();
          console.log("レビューAPIレスポンステキスト:", reviewsResponseText);
          
          if (reviewsResponseText) {
            const reviewsData = JSON.parse(reviewsResponseText);
            setReviews(
              Array.isArray(reviewsData) ? reviewsData : reviewsData.reviews || []
            );
          } else {
            console.log("レビューAPIレスポンスが空です");
            setReviews([]);
          }
        } else {
          console.error("レビュー取得エラー:", reviewsResponse.status);
          setReviews([]);
        }
      } catch (reviewError) {
        console.error("レビューの取得に失敗しました:", reviewError);
        // レビュー取得の失敗はエラー表示しない
        setReviews([]);
      }
    } catch (error) {
      console.error("ゲーム詳細の取得に失敗しました:", error);
      setError(
        `APIからのゲーム詳細の取得に失敗しました: ${error instanceof Error ? error.message : String(error)}。モックデータを表示しています。`
      );
      setUseLocalData(true);

      // モックデータを使用
      const mockGame = getGameFromMock(gameId);
      const mockGameReviews = getReviewsFromMock(gameId);

      if (mockGame) {
        setGame(mockGame);
        setReviews(mockGameReviews);
      } else {
        setError("ゲームが見つかりませんでした");
        setGame(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // IDが変更されたときにゲーム詳細を取得
  useEffect(() => {
    if (id) {
      fetchGameDetail(id as string);

      // 環境変数の確認
      console.log("環境変数:", {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NODE_ENV: process.env.NODE_ENV,
      });
    }
  }, [id]);

  // 日付のフォーマット関数
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Layout
      title={game ? game.name : "ゲーム詳細"}
      description={game ? `${game.name}の詳細情報` : "BGr4のゲーム詳細ページ"}
      currentPath={`/games/${id}`}
    >
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
      ) : game ? (
        <>
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
                <Typography sx={{ mt: 1, fontSize: "0.9rem" }}>
                  エラー詳細: {error}
                </Typography>
              )}
              {apiDebugInfo && (
                <Typography
                  sx={{ mt: 1, fontSize: "0.8rem", fontFamily: "monospace" }}
                >
                  API Debug: {apiDebugInfo}
                </Typography>
              )}
            </Paper>
          )}

          <Box sx={{ mb: 3 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              component={Link}
              href="/games"
            >
              ゲーム一覧に戻る
            </Button>
          </Box>

          <Grid container spacing={4}>
            {/* ゲーム情報 */}
            <Grid item xs={12} md={4}>
              <Box sx={{ position: "sticky", top: 20 }}>
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Box
                    component="img"
                    src={
                      game.image_url ||
                      "https://via.placeholder.com/300x300?text=No+Image"
                    }
                    alt={game.name}
                    sx={{
                      width: "100%",
                      height: "auto",
                      maxHeight: 400,
                      objectFit: "contain",
                      mb: 2,
                      bgcolor: "#f0f0f0",
                    }}
                  />

                  {game.bgg_rating !== undefined && (
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <StarIcon sx={{ color: "gold", mr: 1 }} />
                      <Typography variant="h6">
                        {game.bgg_rating.toFixed(1)} / 10
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ display: "flex", alignItems: "center", mb: 1 }}
                    >
                      <PeopleIcon sx={{ mr: 1, fontSize: 20 }} />
                      プレイ人数: {game.min_players || "?"}-
                      {game.max_players || "?"}人
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ display: "flex", alignItems: "center", mb: 1 }}
                    >
                      <AccessTimeIcon sx={{ mr: 1, fontSize: 20 }} />
                      プレイ時間:{" "}
                      {game.playing_time ? `約${game.playing_time}分` : "不明"}
                    </Typography>

                    {game.year_published && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        発売年: {game.year_published}年
                      </Typography>
                    )}

                    {game.designer && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        デザイナー: {game.designer}
                      </Typography>
                    )}

                    {game.publisher && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        パブリッシャー: {game.publisher}
                      </Typography>
                    )}

                    {game.complexity !== undefined && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        複雑さ: {game.complexity.toFixed(1)} / 5
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Box>
            </Grid>

            {/* ゲーム詳細と説明 */}
            <Grid item xs={12} md={8}>
              <Typography variant="h4" component="h1" gutterBottom>
                {game.name}
              </Typography>

              <Divider sx={{ my: 2 }} />

              {/* ゲーム説明 */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  ゲーム説明
                </Typography>

                <Typography variant="body1" paragraph>
                  {game.description || "説明はありません。"}
                </Typography>
              </Paper>

              {/* カテゴリーとメカニクス */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                {/* カテゴリー */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3 }}>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ display: "flex", alignItems: "center" }}
                    >
                      <CategoryIcon sx={{ mr: 1 }} />
                      カテゴリー
                    </Typography>

                    <Box>
                      {game.categories && game.categories.length > 0 ? (
                        game.categories.map((category, index) => (
                          <Chip
                            key={index}
                            label={category}
                            color="primary"
                            variant="outlined"
                          />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          カテゴリー情報はありません
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                </Grid>

                {/* メカニクス */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3 }}>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ display: "flex", alignItems: "center" }}
                    >
                      <SettingsIcon sx={{ mr: 1 }} />
                      メカニクス
                    </Typography>

                    <Box>
                      {game.mechanics && game.mechanics.length > 0 ? (
                        game.mechanics.map((mechanic, index) => (
                          <Chip
                            key={index}
                            label={mechanic}
                            color="secondary"
                            variant="outlined"
                          />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          メカニクス情報はありません
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              </Grid>

              {/* レビュー */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  レビュー
                </Typography>

                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <Card key={review.id} sx={{ mb: 2 }}>
                      <CardHeader
                        avatar={
                          <Avatar sx={{ bgcolor: "primary.main" }}>
                            {review.user_name.charAt(0).toUpperCase()}
                          </Avatar>
                        }
                        title={review.user_name}
                        subheader={formatDate(review.created_at)}
                      />
                      <CardContent>
                        <Box
                          sx={{ display: "flex", alignItems: "center", mb: 1 }}
                        >
                          <Rating
                            value={review.rating}
                            readOnly
                            precision={0.5}
                          />
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            {review.rating.toFixed(1)}
                          </Typography>
                        </Box>
                        <Typography variant="body1">
                          {review.comment}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    まだレビューはありません
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </>
      ) : (
        <Paper elevation={1} sx={{ p: 3, textAlign: "center" }}>
          ゲームが見つかりませんでした
        </Paper>
      )}
    </Layout>
  );
}
