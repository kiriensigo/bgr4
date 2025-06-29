"use client";

import React from "react";
import { Container, Typography, Box } from "@mui/material";
<<<<<<< HEAD
import { searchGamesByDesigner } from "../../../../lib/api";
=======
>>>>>>> 391c7a7cccd3f676731b6712fbf739c4deb914d7
import UnifiedGameList from "../../../../components/ui/GameList/UnifiedGameList";
import { useParams } from "next/navigation";

export default function DesignerPage() {
  const params = useParams();
  const designerName = decodeURIComponent(params.name as string);

  // TODO: searchGamesByDesigner関数の実装待ち
  const searchGamesByDesigner = async (
    designer: string,
    page: number,
    pageSize: number,
    sortBy: string
  ) => {
    // 仮実装 - 空の結果を返す
    return {
      games: [],
      pagination: {
        current_page: 1,
        total_pages: 1,
        total_count: 0,
        per_page: pageSize,
      },
      totalItems: 0,
      totalPages: 1,
    };
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        デザイナー: {designerName}
      </Typography>

      <Box sx={{ mt: 4 }}>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          デザイナー検索機能は開発中です。
        </Typography>
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
