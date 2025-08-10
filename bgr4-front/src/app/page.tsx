"use client";

import { Typography, Container, Box, CircularProgress } from "@mui/material";
import LazyGameGrid from "@/components/LazyGameGrid";
import GameGrid from "@/components/GameGrid";
import { useEffect, useState } from "react";
import { getGames, Game } from "@/lib/api";

export default function Home() {
  const [firstSectionGames, setFirstSectionGames] = useState<Game[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 最初のセクションだけ即座に読み込み
    const fetchFirstSection = async () => {
      try {
        setLoading(true);
        console.log("Loading first section...");
        const response = await getGames(1, 8, "review_date", { cache: "no-cache" });
        setFirstSectionGames(response.games);
        console.log("First section loaded with", response.games.length, "games");
      } catch (error) {
        console.error("Error fetching first section:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFirstSection();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        ボードゲームレビュー
      </Typography>

      {loading ? (
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            minHeight: '60vh'
          }}
        >
          <CircularProgress size={60} />
        </Box>
      ) : (
        <>
          {/* 最初のセクション - 即座に表示 */}
          <GameGrid
            title="レビュー新着ゲーム"
            games={firstSectionGames}
            loading={false}
          />
          
          {/* 以下は遅延読み込み */}
          <LazyGameGrid
            title="新規登録ゲーム"
            sortBy="created_at"
          />
          <LazyGameGrid
            title="人気のゲーム"
            sortBy="reviews_count"
          />
          <LazyGameGrid
            title="おすすめ"
            sortBy="created_at"
          />
        </>
      )}
    </Container>
  );
}
