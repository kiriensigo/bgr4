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
  FormHelperText,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
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

  // 現在の年から過去30年分の選択肢を生成
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 31 }, (_, i) => currentYear - i);

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
    japanese_release_year: "", // 日本語版発売年
    is_unreleased: false, // 未発売フラグ
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

  // セレクト入力の処理
  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setManualForm((prev) => ({ ...prev, [name]: value }));
  };

  // チェックボックスの処理
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setManualForm((prev) => ({ ...prev, [name]: checked }));

    // 未発売がチェックされたら発売年をクリア
    if (name === "is_unreleased" && checked) {
      setManualForm((prev) => ({ ...prev, japanese_release_year: "" }));
    }
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

      // 数値フィールドの変換
      const gameData: any = {
        ...manualForm,
        min_players: parseInt(manualForm.min_players),
        max_players: parseInt(manualForm.max_players),
        play_time: parseInt(manualForm.play_time),
        min_play_time: manualForm.min_play_time
          ? parseInt(manualForm.min_play_time)
          : undefined,
      };

      // 日本語版発売日の処理
      if (manualForm.is_unreleased) {
        // 未発売の場合はnull
        gameData.japanese_release_date = null;
      } else if (manualForm.japanese_release_year) {
        // 年のみの場合は1月1日として設定
        gameData.japanese_release_date = new Date(
          parseInt(manualForm.japanese_release_year),
          0,
          1
        ).toISOString();
      } else {
        // 未設定の場合はnull
        gameData.japanese_release_date = null;
      }

      // 不要なフィールドを削除
      if ("japanese_release_year" in gameData) {
        delete gameData.japanese_release_year;
      }
      if ("is_unreleased" in gameData) {
        delete gameData.is_unreleased;
      }

      // AuthContextのgetAuthHeaders関数を使用
      const headers = user ? getAuthHeaders() : undefined;

      // APIにゲーム情報を送信
      const result = await registerGame(
        gameData,
        headers,
        false,
        true // 手動登録フラグ
      );

      // 登録成功後、ゲーム詳細ページにリダイレクト
      if (result) {
        // 少し待機してからリダイレクト（バックエンドの処理完了を待つ）
        setTimeout(() => {
          router.push(`/games/${result.bgg_id}`);
        }, 1000);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "予期せぬエラーが発生しました"
      );
    } finally {
      setLoading(false);
    }
  };

  // BGGゲーム登録処理
  const handleRegister = async (gameDetails: BGGGameDetails) => {
    try {
      // AuthContextのgetAuthHeaders関数を使用
      const headers = user ? getAuthHeaders() : undefined;

      // APIにゲーム情報を送信
      const result = await registerGame(gameDetails, headers);

      // 登録成功後、ゲーム詳細ページにリダイレクト
      if (result) {
        // 少し待機してからリダイレクト（バックエンドの処理完了を待つ）
        setTimeout(() => {
          router.push(`/games/${result.bgg_id}`);
        }, 1000);
      }
    } catch (err: any) {
      // エラーメッセージに既存のゲームIDが含まれている場合は、そのゲームページにリダイレクト
      if (err.message && err.message.includes("|")) {
        const [errorMsg, existingGameId] = err.message.split("|");
        setError(`${errorMsg} 既存のゲームページに移動します...`);
        setTimeout(() => {
          router.push(`/games/${existingGameId}`);
        }, 2000);
      } else {
        throw err;
      }
    }
  };

  // ログインしていない場合はログインページにリダイレクト
  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>
            ログインが必要です
          </Typography>
          <Typography variant="body1" paragraph>
            ゲームを登録するには、ログインが必要です。
          </Typography>
          <Button
            component={Link}
            href="/login?redirect=/games/register"
            variant="contained"
            color="primary"
          >
            ログインページへ
          </Button>
        </Paper>
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
                    tabValue === 1 && error?.includes("プレイ時間") ? error : ""
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
                <FormControl
                  fullWidth
                  variant="outlined"
                  disabled={manualForm.is_unreleased}
                >
                  <InputLabel id="release-year-label">
                    日本語版発売年
                  </InputLabel>
                  <Select
                    labelId="release-year-label"
                    name="japanese_release_year"
                    value={manualForm.japanese_release_year}
                    onChange={handleSelectChange}
                    label="日本語版発売年"
                  >
                    <MenuItem value="">
                      <em>未選択</em>
                    </MenuItem>
                    {years.map((year) => (
                      <MenuItem key={year} value={year.toString()}>
                        {year}年
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>発売年のみを選択してください</FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={manualForm.is_unreleased}
                      onChange={handleCheckboxChange}
                      name="is_unreleased"
                      color="primary"
                    />
                  }
                  label="未発売"
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
