"use client";

import { useState, useEffect } from "react";
import { Container, Typography, Box } from "@mui/material";
import { searchGamesByDesigner } from "../../../../lib/api";
import UnifiedGameList from "../../../../components/ui/GameList/UnifiedGameList";
import { useParams } from "next/navigation";

export default function DesignerPage() {
  const params = useParams();
  const designerName = decodeURIComponent(params.name as string);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        デザイナー: {designerName}
      </Typography>

      <Box sx={{ mt: 4 }}>
        <UnifiedGameList
          title=""
          fetchGames={(page, pageSize, sortBy) =>
            searchGamesByDesigner(designerName, page, pageSize, sortBy)
          }
          showTitle={false}
          showSort={true}
          emptyMessage={`デザイナー "${designerName}" のゲームが見つかりませんでした`}
          gridItemProps={{ xs: 12, sm: 6, md: 4 }}
        />
      </Box>
    </Container>
  );
}
