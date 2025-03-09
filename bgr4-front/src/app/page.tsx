"use client";

import { useEffect, useState } from "react";
import { getHotGames } from "@/lib/bggApi";
import { Typography, Container, Box, CircularProgress } from "@mui/material";
import { getGames } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import GameCarousel from "@/components/GameCarousel";
import type { Game } from "@/lib/api";
import { shuffleArray } from "@/lib/utils";

export default function Home() {
  const [recentReviewGames, setRecentReviewGames] = useState<Game[]>([]);
  const [newlyRegisteredGames, setNewlyRegisteredGames] = useState<Game[]>([]);
  const [mostReviewedGames, setMostReviewedGames] = useState<Game[]>([]);
  const [randomGames, setRandomGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getAuthHeaders } = useAuth();

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);

        // レビュー新着ゲームを取得（review_dateでソート）
        const recentReviewsResponse = await getGames(1, 8, "review_date");
        setRecentReviewGames(recentReviewsResponse.games);

        // 新規登録ゲームを取得（created_atでソート）
        const newlyRegisteredResponse = await getGames(1, 8, "created_at");
        setNewlyRegisteredGames(newlyRegisteredResponse.games);

        // レビュー投稿数の多いゲームを取得（reviews_countでソート）
        const mostReviewedResponse = await getGames(1, 8, "reviews_count");
        setMostReviewedGames(mostReviewedResponse.games);

        // ランダムゲームを取得（より多くのゲームを取得してシャッフル）
        const randomResponse = await getGames(1, 24, "created_at");
        // 取得したゲームリストをシャッフルして最初の8件を使用
        const shuffledGames = shuffleArray(randomResponse.games).slice(0, 8);
        setRandomGames(shuffledGames);

        setLoading(false);
      } catch (err) {
        console.error("ゲームの取得に失敗しました:", err);
        setError("ゲームの取得に失敗しました");
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography color="error" align="center" sx={{ py: 8 }}>
          {error}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        ボードゲームレビュー
      </Typography>

      {/* レビュー新着ゲーム */}
      <GameCarousel
        title="レビュー新着ゲーム"
        games={recentReviewGames}
        loading={loading}
      />

      {/* 新規登録ゲーム */}
      <GameCarousel
        title="新規登録ゲーム"
        games={newlyRegisteredGames}
        loading={loading}
      />

      {/* レビュー投稿数 */}
      <GameCarousel
        title="レビュー投稿数の多いゲーム"
        games={mostReviewedGames}
        loading={loading}
      />

      {/* ランダムゲーム */}
      <GameCarousel
        title="おすすめランダムゲーム"
        games={randomGames}
        loading={loading}
      />
    </Container>
  );
}
