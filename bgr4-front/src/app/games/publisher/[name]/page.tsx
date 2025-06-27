"use client";

import React from "react";
import { Container, Typography, Box } from "@mui/material";
import { searchGamesByPublisher } from "@/lib/api";
import UnifiedGameList from "@/components/ui/GameList/UnifiedGameList";
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
        <UnifiedGameList
          title=""
          fetchGames={(page, pageSize, sortBy) =>
            searchGamesByPublisher(publisherName, page, pageSize, sortBy)
          }
          showTitle={false}
          showSort={true}
          emptyMessage={`出版社 "${publisherName}" のゲームが見つかりませんでした`}
          gridItemProps={{ xs: 12, sm: 6, md: 4 }}
        />
      </Box>
    </Container>
  );
}
