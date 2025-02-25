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
import { getBGGGameDetails } from "@/lib/bggApi";
import { getGame } from "@/lib/api";
import { getAuthHeaders } from "@/lib/auth";

export default function RegisterGamePage() {
  const [bggUrl, setBggUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuth();

  // BGGのURLからIDを抽出する関数
  const extractBggId = (url: string): string | null => {
    // URLからBGG IDを抽出するための正規表現
    const patterns = [/boardgamegeek\.com\/boardgame\/(\d+)/, /^(\d+)$/];

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

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/games`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(user ? await getAuthHeaders() : {}),
          },
          credentials: "include",
          body: JSON.stringify({
            game: {
              bgg_id: gameDetails.id,
              name: gameDetails.name,
              description: gameDetails.description,
              image_url: gameDetails.image,
              min_players: gameDetails.minPlayers,
              max_players: gameDetails.maxPlayers,
              play_time: gameDetails.playTime,
              average_score: gameDetails.averageRating,
              weight: gameDetails.weight,
              best_num_players: gameDetails.bestPlayers,
              recommended_num_players: gameDetails.recommendedPlayers,
            },
          }),
        }
      );

      console.log("API Response:", response);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "ゲームの登録に失敗しました");
      }

      const data = await response.json();
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
          <Alert severity="warning">
            ゲームを登録するにはログインが必要です
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            ボードゲームを登録
          </Typography>

          <Typography variant="body1" sx={{ mb: 3 }}>
            BoardGameGeekのゲームページのURLまたはゲームIDを入力してください。
          </Typography>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="BoardGameGeekのURL または ゲームID"
              value={bggUrl}
              onChange={(e) => setBggUrl(e.target.value)}
              placeholder="例: https://boardgamegeek.com/boardgame/12345 または 12345"
              sx={{ mb: 3 }}
              required
              error={!!error}
              helperText={error}
              disabled={loading}
            />

            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={loading || !bggUrl.trim()}
                sx={{ minWidth: 120 }}
              >
                {loading ? <CircularProgress size={24} /> : "登録"}
              </Button>
              <Button
                variant="outlined"
                onClick={() => router.back()}
                disabled={loading}
              >
                戻る
              </Button>
            </Box>
          </form>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              使い方
            </Typography>
            <Typography variant="body2" component="div">
              <ol>
                <li>BoardGameGeekで登録したいゲームのページを開きます</li>
                <li>URLをコピーするか、ゲームIDをコピーします</li>
                <li>上のフォームに貼り付けて「登録」をクリックします</li>
              </ol>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
