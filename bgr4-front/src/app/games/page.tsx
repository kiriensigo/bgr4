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
          fetchGames={async (page, pageSize, sortBy) => {
            const response = await getGames(page, pageSize, sortBy);
            return {
              games: response.games,
              totalPages: response.pagination.total_pages,
              totalItems: response.pagination.total_count,
            };
          }}
          showTitle={true}
          showSort={true}
        />
      </div>
    </Container>
  );
}
