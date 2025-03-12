"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Grid,
  Typography,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import GameCard from "./GameCard";
import { Game } from "@/lib/api";

// ソートオプションの型定義
export type SortOption = {
  value: string;
  label: string;
};

// GameListコンポーネントのプロパティ
export interface GameListProps {
  title?: string;
  fetchGames: (
    page: number,
    pageSize: number,
    sort?: string
  ) => Promise<{
    games: Game[];
    totalPages: number;
    totalItems: number;
  }>;
  initialPage?: number;
  initialPageSize?: number;
  initialSort?: string;
  showSort?: boolean;
  sortOptions?: SortOption[];
  showPagination?: boolean;
}

// デフォルトのソートオプション
const DEFAULT_SORT_OPTIONS: SortOption[] = [
  { value: "name_asc", label: "名前（昇順）" },
  { value: "name_desc", label: "名前（降順）" },
  { value: "average_score_desc", label: "評価（高い順）" },
  { value: "average_score_asc", label: "評価（低い順）" },
  { value: "created_at_desc", label: "登録日（新しい順）" },
  { value: "created_at_asc", label: "登録日（古い順）" },
];

// デフォルトのページサイズオプション
const PAGE_SIZE_OPTIONS = [12, 24, 48, 96];

export default function GameList({
  title,
  fetchGames,
  initialPage = 1,
  initialPageSize = 24,
  initialSort = "name_asc",
  showSort = true,
  sortOptions = DEFAULT_SORT_OPTIONS,
  showPagination = true,
}: GameListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // URLからパラメータを取得
  const page = parseInt(searchParams.get("page") || initialPage.toString());
  const pageSize = parseInt(
    searchParams.get("pageSize") || initialPageSize.toString()
  );
  const sort = searchParams.get("sort") || initialSort;

  // ステート
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(page);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  const [currentSort, setCurrentSort] = useState(sort);

  // URLを更新する関数
  const updateUrl = useCallback(
    (newPage: number, newPageSize: number, newSort: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", newPage.toString());
      params.set("pageSize", newPageSize.toString());
      params.set("sort", newSort);
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  // ゲームデータを取得する関数
  const loadGames = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGames(currentPage, currentPageSize, currentSort);
      setGames(data.games);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);

      // 現在のページが総ページ数を超えている場合は、最後のページに移動
      if (currentPage > data.totalPages && data.totalPages > 0) {
        setCurrentPage(data.totalPages);
        updateUrl(data.totalPages, currentPageSize, currentSort);
      }
    } catch (err) {
      console.error("Failed to fetch games:", err);
      setError("ゲームの取得中にエラーが発生しました。");
      setCurrentPage(1);
      updateUrl(1, currentPageSize, currentSort);
    } finally {
      setLoading(false);
    }
  }, [currentPage, currentPageSize, currentSort, fetchGames, updateUrl]);

  // ページが変更されたときの処理
  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setCurrentPage(value);
    updateUrl(value, currentPageSize, currentSort);
    // ページトップにスクロール
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ページサイズが変更されたときの処理
  const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
    const newPageSize = Number(event.target.value);
    setCurrentPageSize(newPageSize);
    // ページサイズが変更されたら1ページ目に戻る
    setCurrentPage(1);
    updateUrl(1, newPageSize, currentSort);
  };

  // ソートが変更されたときの処理
  const handleSortChange = (event: SelectChangeEvent<string>) => {
    const newSort = event.target.value;
    setCurrentSort(newSort);
    // ソートが変更されたら1ページ目に戻る
    setCurrentPage(1);
    updateUrl(1, currentPageSize, newSort);
  };

  // URLパラメータが変更されたときにステートを更新
  useEffect(() => {
    const urlPage = parseInt(
      searchParams.get("page") || initialPage.toString()
    );
    const urlPageSize = parseInt(
      searchParams.get("pageSize") || initialPageSize.toString()
    );
    const urlSort = searchParams.get("sort") || initialSort;

    if (
      urlPage !== currentPage ||
      urlPageSize !== currentPageSize ||
      urlSort !== currentSort
    ) {
      setCurrentPage(urlPage);
      setCurrentPageSize(urlPageSize);
      setCurrentSort(urlSort);
    }
  }, [
    searchParams,
    initialPage,
    initialPageSize,
    initialSort,
    currentPage,
    currentPageSize,
    currentSort,
  ]);

  // データ取得
  useEffect(() => {
    loadGames();
  }, [loadGames]);

  // 現在表示しているアイテムの範囲を計算
  const startItem = (currentPage - 1) * currentPageSize + 1;
  const endItem = Math.min(currentPage * currentPageSize, totalItems);

  return (
    <Box sx={{ width: "100%" }}>
      {title && (
        <Typography variant="h5" component="h2" gutterBottom>
          {title}
        </Typography>
      )}

      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "200px",
          }}
        >
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : games.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          表示するゲームがありません
        </Alert>
      ) : (
        <>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              mb: 2,
              gap: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {totalItems > 0
                ? `${totalItems}件中 ${startItem}～${endItem}件を表示`
                : "0件"}
            </Typography>

            <Box
              sx={{
                display: "flex",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              {showSort && (
                <FormControl
                  size="small"
                  sx={{ minWidth: isMobile ? "100%" : 200 }}
                >
                  <InputLabel id="sort-select-label">並び替え</InputLabel>
                  <Select
                    labelId="sort-select-label"
                    value={currentSort}
                    label="並び替え"
                    onChange={handleSortChange}
                  >
                    {sortOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <FormControl
                size="small"
                sx={{ minWidth: isMobile ? "100%" : 120 }}
              >
                <InputLabel id="page-size-select-label">表示件数</InputLabel>
                <Select
                  labelId="page-size-select-label"
                  value={currentPageSize}
                  label="表示件数"
                  onChange={handlePageSizeChange}
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <MenuItem key={size} value={size}>
                      {size}件
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          <Grid container spacing={2}>
            {games.map((game) => (
              <Grid item key={game.id} xs={12} sm={6} md={4} lg={3}>
                <GameCard
                  game={{
                    ...game,
                    id: typeof game.id === "number" ? String(game.id) : game.id,
                  }}
                  type="game"
                  useOverallScoreDisplay={true}
                  overallScoreVariant="compact"
                  showOverallScoreOverlay={false}
                  variant="carousel"
                />
              </Grid>
            ))}
          </Grid>

          {showPagination && totalPages > 1 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mt: 4,
                mb: 2,
              }}
            >
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size={isMobile ? "small" : "medium"}
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
