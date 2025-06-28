"use client";

import { Typography, Container } from "@mui/material";
import GameGrid from "../components/GameGrid";
import { useEffect, useState } from "react";
import { getGames, Game } from "../lib/api";

type GameData = {
  reviewDate: Game[];
  createdAt: Game[];
  reviewsCount: Game[];
  recommended: Game[];
};

export default function Home() {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllGames = async () => {
      try {
        setLoading(true);
        const [reviewDateRes, createdAtRes, reviewsCountRes, recommendedRes] =
          await Promise.all([
            getGames(1, 8, "review_date"),
            getGames(1, 8, "created_at"),
            getGames(1, 8, "reviews_count"),
            getGames(1, 8, "created_at"), // "おすすめ"のソート順は一旦 created_at にしています
          ]);

        setGameData({
          reviewDate: reviewDateRes.games,
          createdAt: createdAtRes.games,
          reviewsCount: reviewsCountRes.games,
          recommended: recommendedRes.games,
        });
      } catch (error) {
        console.error("Error fetching home page games:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllGames();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        ボードゲームレビュー
      </Typography>

      <GameGrid
        title="レビュー新着ゲーム"
        games={gameData?.reviewDate}
        loading={loading}
      />
      <GameGrid
        title="新規登録ゲーム"
        games={gameData?.createdAt}
        loading={loading}
      />
      <GameGrid
        title="人気のゲーム"
        games={gameData?.reviewsCount}
        loading={loading}
      />
      <GameGrid
        title="おすすめ"
        games={gameData?.recommended}
        loading={loading}
      />
    </Container>
  );
}
