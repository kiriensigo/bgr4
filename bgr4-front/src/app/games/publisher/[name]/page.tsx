"use client";

import { useState, useEffect } from "react";
import { Container, Typography, Box } from "@mui/material";
import { searchGamesByPublisher } from "@/lib/api";
import GameList from "@/components/GameList";
import { useParams } from "next/navigation";

export default function PublisherPage() {
  const params = useParams();
  const publisherName = decodeURIComponent(params.name as string);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        出版社: {publisherName}
      </Typography>

      <Box sx={{ mt: 4 }}>
        <GameList
          title=""
          fetchGames={async (page, pageSize, sortBy) => {
            const response = await searchGamesByPublisher(
              publisherName,
              page,
              pageSize,
              sortBy
            );
            return {
              games: response.games,
              totalPages: response.pagination.total_pages,
              totalItems: response.pagination.total_count,
            };
          }}
          showTitle={false}
          showSort={true}
          emptyMessage={`出版社 "${publisherName}" のゲームが見つかりませんでした`}
          gridItemProps={{ xs: 12, sm: 6, md: 4, lg: 3 }}
        />
      </Box>
    </Container>
  );
}
