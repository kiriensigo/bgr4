"use client";

import { useSearchParams } from "next/navigation";
import { Container, Typography, Box } from "@mui/material";

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: "center" }}>
        <Typography variant="h4" component="h1" gutterBottom>
          検索結果
        </Typography>
        {query && (
          <Typography variant="h6" color="text.secondary" gutterBottom>
            検索キーワード: &quot;{query}&quot;
          </Typography>
        )}
        <Typography variant="body1" sx={{ mt: 4 }}>
          検索結果機能は開発中です。
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          メインの検索機能は /search ページをご利用ください。
        </Typography>
      </Box>
    </Container>
  );
}
