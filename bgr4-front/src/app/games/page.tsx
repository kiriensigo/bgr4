"use client";

import { Container } from "@mui/material";
import { getGames } from "@/lib/api";
import GameList from "@/components/GameList";
import { containerStyle } from "@/styles/layout";

export default function GamesPage() {
  return (
    <Container maxWidth={false}>
      <div style={containerStyle}>
        <GameList
          title="ボードゲーム一覧"
          fetchGames={getGames}
          showTitle={true}
          showSort={true}
        />
      </div>
    </Container>
  );
}
