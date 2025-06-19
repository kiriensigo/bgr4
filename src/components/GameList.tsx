"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
} from "@mui/material";
import GameCard from "./GameCard";
import type { Game, PaginatedResponse } from "@/types/api";

type SortKey = "created_at_desc" | "average_rating_desc" | "name_asc";

interface GameListProps {
  title: string;
  fetchGames: (
    page: number,
    sort: SortKey,
    query?: string
  ) => Promise<PaginatedResponse<Game>>;
  showTitle?: boolean;
  showSort?: boolean;
  searchQuery?: string;
}

const GameList = ({
  title,
  fetchGames,
  showTitle = true,
  showSort = false,
  searchQuery = "",
}: GameListProps) => {
  const [games, setGames] = useState<Game[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [sort, setSort] = useState<SortKey>("created_at_desc");

  const loadGames = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchGames(page, sort, searchQuery);
      setGames((prev) => (page === 1 ? data.items : [...prev, ...data.items]));
      setHasMore(data.current_page < data.total_pages);
    } catch (error) {
      console.error("Failed to fetch games:", error);
      // エラーハンドリング
    } finally {
      setLoading(false);
    }
  }, [page, sort, fetchGames, searchQuery]);

  useEffect(() => {
    setGames([]);
    setPage(1);
    setHasMore(true);
    loadGames();
  }, [sort, searchQuery]);

  useEffect(() => {
    if (page > 1) {
      loadGames();
    }
  }, [page]);

  const handleSortChange = (event: any) => {
    setSort(event.target.value as SortKey);
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        {showTitle && (
          <Typography variant="h5" component="h2">
            {title}
          </Typography>
        )}
        {showSort && (
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>並び順</InputLabel>
            <Select value={sort} label="並び順" onChange={handleSortChange}>
              <MenuItem value="created_at_desc">新着順</MenuItem>
              <MenuItem value="average_rating_desc">評価が高い順</MenuItem>
              <MenuItem value="name_asc">名前順</MenuItem>
            </Select>
          </FormControl>
        )}
      </Box>

      <Grid container spacing={2}>
        {games.map((game) => (
          <Grid item key={game.id} xs={6} sm={4} md={3} lg={2.4}>
            <GameCard game={game} variant="grid" />
          </Grid>
        ))}
      </Grid>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && hasMore && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <Button variant="contained" onClick={() => setPage((p) => p + 1)}>
            もっと見る
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default GameList;
