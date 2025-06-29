"use client";

import React from "react";
import { Container, Typography, Box } from "@mui/material";
// import { searchGamesByPublisher } from "@/lib/api"; // 未実装
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
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          出版社検索機能は開発中です。
        </Typography>
        <Typography variant="body2" color="text.secondary">
          メインの検索機能は /search ページをご利用ください。
        </Typography>
      </Box>
    </Container>
  );
}
