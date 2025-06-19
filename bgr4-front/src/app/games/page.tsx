"use client";

import { Container } from "@mui/material";
import { getGames } from "@/lib/api";
import GameList from "@/components/GameList";

export default function GamesPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <GameList
        title="ボードゲーム一覧"
        fetchGames={getGames}
        showTitle={true}
        showSort={true}
      />
    </Container>
  );
}
