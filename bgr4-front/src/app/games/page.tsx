"use client";

import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Stack,
  SelectChangeEvent,
} from "@mui/material";
import GameGrid from "../../components/GameGrid";
import { getGames, GamesResponse } from "../../lib/api";

const SORT_OPTIONS = [
  { value: "created_at", label: "新規登録順" },
  { value: "review_date", label: "レビュー投稿順" },
  { value: "reviews_count", label: "人気順" },
  { value: "average_score", label: "評価順" },
  { value: "name_asc", label: "名前順（昇順）" },
  { value: "name_desc", label: "名前順（降順）" },
  { value: "release_date_desc", label: "リリース日順（新しい順）" },
  { value: "release_date_asc", label: "リリース日順（古い順）" },
];

const PER_PAGE_OPTIONS = [12, 24, 48, 96];

export default function GamesPage() {
  const [gamesData, setGamesData] = useState<GamesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(24);
  const [sortBy, setSortBy] = useState("created_at");

  const fetchGames = async (
    page: number,
    perPageCount: number,
    sort: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      console.log(
        `Fetching games: page=${page}, per_page=${perPageCount}, sort=${sort}`
      );

      const response = await getGames(page, perPageCount, sort, {
        cache: "no-cache",
        revalidate: 0,
      });

      console.log("Games fetched successfully:", response);
      setGamesData(response);
    } catch (err) {
      console.error("Error fetching games:", err);
      setError(
        err instanceof Error ? err.message : "ゲームの取得に失敗しました"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames(currentPage, perPage, sortBy);
  }, [currentPage, perPage, sortBy]);

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    page: number
  ) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePerPageChange = (event: SelectChangeEvent<number>) => {
    const newPerPage = event.target.value as number;
    setPerPage(newPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleSortChange = (event: SelectChangeEvent<string>) => {
    setSortBy(event.target.value);
    setCurrentPage(1); // Reset to first page when changing sort
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* ページタイトル */}
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{
          mb: 4,
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        ボードゲーム一覧
      </Typography>

      {/* コントロールパネル */}
      <Box sx={{ mb: 4 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          {/* ソート選択 */}
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>並び順</InputLabel>
            <Select value={sortBy} label="並び順" onChange={handleSortChange}>
              {SORT_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* 表示件数選択 */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>表示件数</InputLabel>
            <Select
              value={perPage}
              label="表示件数"
              onChange={handlePerPageChange}
            >
              {PER_PAGE_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}件
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* 件数表示 */}
          {gamesData && (
            <Typography variant="body2" color="text.secondary">
              {gamesData.totalItems}件中 {(currentPage - 1) * perPage + 1}-
              {Math.min(currentPage * perPage, gamesData.totalItems)}件を表示
            </Typography>
          )}
        </Stack>
      </Box>

      {/* エラー表示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* ローディング状態またはゲーム一覧 */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 8 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>ゲームを読み込み中...</Typography>
        </Box>
      ) : gamesData ? (
        <>
          {/* ゲーム一覧表示 */}
          <GameGrid title="" games={gamesData.games} loading={false} />

          {/* ページネーション */}
          {gamesData.totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <Pagination
                count={gamesData.totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      ) : (
        <Typography variant="body1" align="center" sx={{ my: 8 }}>
          ゲームが見つかりませんでした
        </Typography>
      )}
    </Container>
  );
}
