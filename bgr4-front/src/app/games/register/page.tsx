"use client";

import { useState } from "react";
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ja } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getBGGGameDetails, type BGGGameDetails } from "@/lib/bggApi";
import { getGame, registerGame } from "@/lib/api";
import Link from "next/link";

// タブのインターフェース
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// タブパネルコンポーネント
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`register-tabpanel-${index}`}
      aria-labelledby={`register-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function RegisterGamePage() {
  const [tabValue, setTabValue] = useState(0);
  const [bggUrl, setBggUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user, getAuthHeaders } = useAuth();

  // 手動登録用のフォーム状態
  const [manualForm, setManualForm] = useState({
    name: "", // 英語名（任意）
    japanese_name: "", // 日本語名（必須）
    japanese_description: "", // 日本語説明
    japanese_image_url: "", // 日本語版画像URL（必須）
    min_players: "", // 最小プレイ人数（必須）
    max_players: "", // 最大プレイ人数（必須）
    play_time: "", // プレイ時間（必須）
    min_play_time: "", // 最小プレイ時間
    japanese_publisher: "", // 日本語版出版社
    designer: "", // デザイナー（任意）
    japanese_release_date: null as Date | null, // 日本語版発売日
  });

  // タブ切り替え処理
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError(null);
  };

  // 手動フォーム入力処理
  const handleManualFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setManualForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 数値フィールド用の入力処理
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // 数値のみ許可
    if (value === "" || /^\d+$/.test(value)) {
      setManualForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // 難易度選択処理
  const handleWeightChange = (e: any) => {
    setManualForm((prev) => ({
      ...prev,
      weight: e.target.value,
    }));
  };

  // 日付選択処理
  const handleDateChange = (date: Date | null) => {
    setManualForm((prev) => ({
      ...prev,
      japanese_release_date: date,
    }));
  };

  // BGGのURLからIDを抽出する関数
  const extractBggId = (url: string): string | null => {
    // URLからBGG IDを抽出するための正規表現
    const patterns = [
      /boardgamegeek\.com\/boardgame\/(\d+)/,
      /boardgamegeek\.com\/boardgameexpansion\/(\d+)/,
      /^(\d+)$/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  };

  // BGG登録フォーム送信処理
  const handleBggSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // BGG IDを抽出
      const bggId = extractBggId(bggUrl);
      if (!bggId) {
        throw new Error("有効なBoardGameGeekのURLまたはIDを入力してください");
      }

      // まず既存のゲームをチェック
      try {
        const existingGame = await getGame(bggId);
        if (existingGame) {
          router.push(`/games/${bggId}`);
          return;
        }
      } catch (error) {
        // ゲームが見つからない場合は続行（新規登録へ）
      }

      // BGGから詳細情報を取得
      const gameDetails = await getBGGGameDetails(bggId);
      if (!gameDetails) {
        throw new Error("ゲーム情報の取得に失敗しました");
      }

      // APIにゲーム情報を送信
      await handleRegister(gameDetails);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "予期せぬエラーが発生しました"
      );
    } finally {
      setLoading(false);
    }
  };

  // 手動登録フォーム送信処理
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 必須項目のチェック
      if (!manualForm.japanese_name) {
        throw new Error("日本語名は必須です");
      }

      if (!manualForm.japanese_image_url) {
        throw new Error("日本語版画像URLは必須です");
      }

      if (!manualForm.min_players) {
        throw new Error("最少プレイ人数は必須です");
      }

      if (!manualForm.max_players) {
        throw new Error("最大プレイ人数は必須です");
      }

      if (!manualForm.play_time) {
        throw new Error("プレイ時間は必須です");
      }

      // 数値フィールドを数値型に変換
      const gameData = {
        ...manualForm,
        // 英語名が空の場合は日本語名を使用
        name: manualForm.name || manualForm.japanese_name,
        min_players: manualForm.min_players
          ? parseInt(manualForm.min_players)
          : undefined,
        max_players: manualForm.max_players
          ? parseInt(manualForm.max_players)
          : undefined,
        play_time: manualForm.play_time
          ? parseInt(manualForm.play_time)
          : undefined,
        min_play_time: manualForm.min_play_time
          ? parseInt(manualForm.min_play_time)
          : undefined,
        japanese_release_date: manualForm.japanese_release_date
          ? manualForm.japanese_release_date.toISOString().split("T")[0]
          : undefined,
      };

      // AuthContextのgetAuthHeaders関数を使用
      const authHeaders = user ? getAuthHeaders() : {};

      try {
        // 手動登録フラグを追加
        const response = await registerGame(gameData, authHeaders, false, true);

        // レスポンスの詳細をログに出力
        console.log("Registration response:", response);
        console.log("Response type:", typeof response);
        console.log("Response keys:", Object.keys(response));
        console.log("Response JSON:", JSON.stringify(response, null, 2));

        // レスポンス内のゲームオブジェクトを確認
        if (response.game) {
          console.log("Game object in response:", response.game);
          console.log("Game ID in game object:", response.game.id);
          console.log("BGG ID in game object:", response.game.bgg_id);
        }

        // レスポンスからゲームIDを取得（bgg_id、id、または他のプロパティ）
        let gameId =
          response?.bgg_id ||
          response?.id ||
          response?.game?.id ||
          response?.game?.bgg_id;

        console.log("Extracted game ID:", gameId);

        if (!gameId) {
          console.error("Invalid response or missing game ID:", response);
          setError(
            "ゲームの登録に成功しましたが、IDの取得に失敗しました。ホームページにリダイレクトします。"
          );

          // 3秒後にホームページにリダイレクト
          setTimeout(() => {
            router.push("/");
          }, 3000);

          return;
        }

        // 登録成功後、ゲーム詳細ページに遷移
        console.log("Redirecting to game page with ID:", gameId);

        // IDが既にjp-で始まる場合はエンコード済みなのでそのまま使用
        const encodedGameId = gameId;

        // リダイレクト前に少し待機して、バックエンドの処理が完了するのを待つ
        setTimeout(() => {
          console.log(
            "Now redirecting to:",
            `/games/${encodedGameId}?refresh=true`
          );
          router.push(`/games/${encodedGameId}?refresh=true`);
        }, 1000);
      } catch (err) {
        // エラーメッセージを解析して、重複エラーの場合は既存のゲームページにリダイレクト
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error("Registration error:", errorMessage);

        // 重複エラーの場合（エラーメッセージに | が含まれている）
        if (errorMessage.includes("|")) {
          const [message, existingGameId] = errorMessage.split("|");
          setError(`${message} 既存のゲームページにリダイレクトします。`);

          // 3秒後に既存のゲームページにリダイレクト
          setTimeout(() => {
            const encodedGameId = existingGameId.match(/[^\x00-\x7F]/)
              ? encodeURIComponent(existingGameId)
              : existingGameId;
            router.push(`/games/${encodedGameId}?refresh=true`);
          }, 3000);
        } else {
          // 通常のエラー
          setError(errorMessage);
        }
      }
    } catch (err) {
      console.error("Manual registration error:", err);
      setError(
        err instanceof Error ? err.message : "予期せぬエラーが発生しました"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (gameDetails: BGGGameDetails) => {
    try {
      setLoading(true);
      setError(null);

      console.log("Registering game with details:", gameDetails);
      console.log("Weight from BGG:", gameDetails.weight);
      console.log("Best players from BGG:", gameDetails.bestPlayers);
      console.log(
        "Recommended players from BGG:",
        gameDetails.recommendedPlayers
      );
      console.log("Japanese name from BGG:", gameDetails.japaneseName);
      console.log(
        "Japanese publisher from BGG:",
        gameDetails.japanesePublisher
      );
      console.log(
        "Japanese release date from BGG:",
        gameDetails.japaneseReleaseDate
      );

      // AuthContextのgetAuthHeaders関数を使用
      const authHeaders = user ? getAuthHeaders() : {};
      console.log("Auth headers:", authHeaders);

      // ゲーム登録前にデータを整形
      const gameData = {
        ...gameDetails,
        id: gameDetails.id.toString(), // 文字列に変換
        // 日本語名が存在する場合は明示的に設定
        japaneseName: gameDetails.japaneseName || null,
        japanesePublisher: gameDetails.japanesePublisher || null,
        japaneseReleaseDate: gameDetails.japaneseReleaseDate || null,
      };
      console.log("Formatted game data:", gameData);

      const data = await registerGame(gameData, authHeaders);
      console.log("Registered game data:", data);

      // キャッシュをクリアするためにクエリパラメータを追加
      router.push(`/games/${gameDetails.id}?refresh=true`);
    } catch (error) {
      console.error("Error registering game:", error);
      setError(
        error instanceof Error ? error.message : "ゲームの登録に失敗しました"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 4 }}>
          <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h5" color="error" gutterBottom>
              ゲームを登録するにはログインが必要です
            </Typography>
            <Typography variant="body1" paragraph>
              ゲームの登録は、ログインしたユーザーのみが行えます。
              まだアカウントをお持ちでない場合は、新規登録してください。
            </Typography>
            <Box
              sx={{ mt: 3, display: "flex", justifyContent: "center", gap: 2 }}
            >
              <Button
                variant="contained"
                color="primary"
                component={Link}
                href="/login?redirect=/games/register"
              >
                ログイン
              </Button>
              <Button variant="outlined" onClick={() => router.back()}>
                戻る
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          ゲームを登録する
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="game registration tabs"
          >
            <Tab label="BGGから登録" id="register-tab-0" />
            <Tab label="手動登録" id="register-tab-1" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="body1" paragraph>
            BoardGameGeekに登録されているボードゲームを当サイトに登録できます。
            基本ゲームだけでなく、拡張ゲームも登録可能です。
          </Typography>
          <Box
            component="form"
            onSubmit={handleBggSubmit}
            noValidate
            sx={{ mt: 3 }}
          >
            <TextField
              fullWidth
              label="BoardGameGeekのURL または ゲームID"
              variant="outlined"
              value={bggUrl}
              onChange={(e) => setBggUrl(e.target.value)}
              helperText="例: https://boardgamegeek.com/boardgame/266192/wingspan または https://boardgamegeek.com/boardgameexpansion/363077/furnace-interbellum"
              required
              sx={{ mb: 2 }}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : "BGGから登録する"}
            </Button>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="body1" paragraph>
            BoardGameGeekに登録されていないゲームや、日本語情報のみで登録したい場合はこちらから登録できます。
            日本語名は必須項目です。
          </Typography>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
            <Box
              component="form"
              onSubmit={handleManualSubmit}
              noValidate
              sx={{ mt: 3 }}
            >
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="日本語名（必須）"
                    name="japanese_name"
                    variant="outlined"
                    value={manualForm.japanese_name}
                    onChange={handleManualFormChange}
                    required
                    error={tabValue === 1 && error?.includes("日本語名")}
                    helperText={
                      tabValue === 1 && error?.includes("日本語名") ? error : ""
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="英語名（任意）"
                    name="name"
                    variant="outlined"
                    value={manualForm.name}
                    onChange={handleManualFormChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="日本語説明"
                    name="japanese_description"
                    variant="outlined"
                    value={manualForm.japanese_description}
                    onChange={handleManualFormChange}
                    multiline
                    rows={4}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="日本語版画像URL（必須）"
                    name="japanese_image_url"
                    variant="outlined"
                    value={manualForm.japanese_image_url}
                    onChange={handleManualFormChange}
                    required
                    error={tabValue === 1 && error?.includes("日本語版画像URL")}
                    helperText={
                      tabValue === 1 && error?.includes("日本語版画像URL")
                        ? error
                        : "画像のURLを入力してください"
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="最小プレイ人数（必須）"
                    name="min_players"
                    variant="outlined"
                    value={manualForm.min_players}
                    onChange={handleNumberChange}
                    type="text"
                    required
                    error={tabValue === 1 && error?.includes("最少プレイ人数")}
                    helperText={
                      tabValue === 1 && error?.includes("最少プレイ人数")
                        ? error
                        : ""
                    }
                    inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="最大プレイ人数（必須）"
                    name="max_players"
                    variant="outlined"
                    value={manualForm.max_players}
                    onChange={handleNumberChange}
                    type="text"
                    required
                    error={tabValue === 1 && error?.includes("最大プレイ人数")}
                    helperText={
                      tabValue === 1 && error?.includes("最大プレイ人数")
                        ? error
                        : ""
                    }
                    inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="最小プレイ時間（分）"
                    name="min_play_time"
                    variant="outlined"
                    value={manualForm.min_play_time}
                    onChange={handleNumberChange}
                    type="text"
                    inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="プレイ時間（分）（必須）"
                    name="play_time"
                    variant="outlined"
                    value={manualForm.play_time}
                    onChange={handleNumberChange}
                    type="text"
                    required
                    error={tabValue === 1 && error?.includes("プレイ時間")}
                    helperText={
                      tabValue === 1 && error?.includes("プレイ時間")
                        ? error
                        : ""
                    }
                    inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="日本語版出版社"
                    name="japanese_publisher"
                    variant="outlined"
                    value={manualForm.japanese_publisher}
                    onChange={handleManualFormChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="デザイナー（任意）"
                    name="designer"
                    variant="outlined"
                    value={manualForm.designer}
                    onChange={handleManualFormChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="日本語版発売日"
                    value={manualForm.japanese_release_date}
                    onChange={handleDateChange}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        variant: "outlined",
                      },
                    }}
                  />
                </Grid>
              </Grid>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                sx={{ mt: 3 }}
              >
                {loading ? <CircularProgress size={24} /> : "手動で登録する"}
              </Button>
            </Box>
          </LocalizationProvider>
        </TabPanel>

        {error && tabValue === 0 && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>
    </Container>
  );
}
