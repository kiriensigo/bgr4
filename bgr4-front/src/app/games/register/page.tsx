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
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getBGGGameDetails, type BGGGameDetails } from "@/lib/bggApi";
import { getGame, registerGame } from "@/lib/api";
import Link from "next/link";

export default function RegisterGamePage() {
  const [bggUrl, setBggUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user, getAuthHeaders } = useAuth();

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

  const handleSubmit = async (e: React.FormEvent) => {
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

      router.push(`/games/${gameDetails.id}`);
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
        <Typography variant="body1" paragraph>
          BoardGameGeekに登録されているボードゲームを当サイトに登録できます。
          基本ゲームだけでなく、拡張ゲームも登録可能です。
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 3 }}>
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
            {loading ? <CircularProgress size={24} /> : "登録する"}
          </Button>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      </Paper>
    </Container>
  );
}
