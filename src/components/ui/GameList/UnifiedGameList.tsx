"use client";

import React from "react";
import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
} from "@mui/material";
import { UnifiedGameCard } from "../GameCard/UnifiedGameCard";
import { useGames } from "@/hooks/api/useGames";
import { designTokens } from "@/theme/tokens";
import type { SearchFilters } from "@/lib/api/types/common";

interface UnifiedGameListProps {
  /** リストのタイトル */
  title?: string;
  /** 初期ページサイズ */
  initialPageSize?: number;
  /** 初期ソート */
  initialSort?: string;
  /** 検索フィルター */
  filters?: SearchFilters;
  /** カードバリアント */
  cardVariant?: "list" | "grid" | "compact" | "featured";
  /** グリッドカラム数 */
  gridColumns?: { xs: number; sm: number; md: number; lg: number };
  /** ページネーション表示 */
  showPagination?: boolean;
  /** ソート選択表示 */
  showSort?: boolean;
  /** ページサイズ選択表示 */
  showPageSize?: boolean;
  /** カスタムスタイル */
  sx?: Record<string, any>;
}

const sortOptions = [
  { value: "name_asc", label: "名前（昇順）" },
  { value: "name_desc", label: "名前（降順）" },
  { value: "rating_desc", label: "評価が高い順" },
  { value: "rating_asc", label: "評価が低い順" },
  { value: "created_desc", label: "新着順" },
  { value: "created_asc", label: "古い順" },
];

const pageSizeOptions = [12, 24, 48, 96];

/**
 * 統一されたゲームリストコンポーネント
 *
 * 機能:
 * - 統一された状態管理
 * - 柔軟なレイアウト
 * - ページネーション
 * - ソート・フィルター
 * - エラーハンドリング
 */
export const UnifiedGameList: React.FC<UnifiedGameListProps> = ({
  title,
  initialPageSize = 24,
  initialSort = "name_asc",
  filters = {},
  cardVariant = "grid",
  gridColumns = { xs: 1, sm: 2, md: 3, lg: 4 },
  showPagination = true,
  showSort = true,
  showPageSize = true,
  sx = {},
}) => {
  // 統一状態管理フック
  const {
    games,
    totalCount,
    isLoading,
    isError,
    error,
    isFetching,
    currentPage,
    pageSize,
    totalPages,
    setPage,
    setPageSize,
    setSort,
    getPageInfo,
  } = useGames({
    initialPageSize,
    initialSort,
    filters,
  });

  // エラー表示
  if (isError) {
    return (
      <Box sx={{ p: 2, ...sx }}>
        {title && (
          <Typography variant="h4" component="h1" gutterBottom>
            {title}
          </Typography>
        )}
        <Alert severity="error" sx={{ mt: 2 }}>
          データの取得に失敗しました: {error?.message}
        </Alert>
      </Box>
    );
  }

  // ローディング表示（初回のみ）
  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
          ...sx,
        }}
      >
        <CircularProgress size={48} />
      </Box>
    );
  }

  // データが空の場合
  if (!games.length) {
    return (
      <Box sx={{ p: 2, textAlign: "center", ...sx }}>
        {title && (
          <Typography variant="h4" component="h1" gutterBottom>
            {title}
          </Typography>
        )}
        <Typography variant="h6" color="text.secondary" sx={{ mt: 4 }}>
          ゲームが見つかりませんでした
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, ...sx }}>
      {/* ヘッダー */}
      {title && (
        <Typography variant="h4" component="h1" gutterBottom>
          {title}
        </Typography>
      )}

      {/* コントロールバー */}
      {(showSort || showPageSize) && (
        <Paper
          sx={{
            p: 2,
            mb: 3,
            display: "flex",
            gap: 2,
            alignItems: "center",
            flexWrap: "wrap",
            position: "relative",
          }}
        >
          {/* フェッチング中のオーバーレイ */}
          {isFetching && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1,
              }}
            >
              <CircularProgress size={24} />
            </Box>
          )}

          {/* ソート選択 */}
          {showSort && (
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>並び順</InputLabel>
              <Select
                value={initialSort}
                label="並び順"
                onChange={(e) => setSort(e.target.value)}
              >
                {sortOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* ページサイズ選択 */}
          {showPageSize && (
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>表示件数</InputLabel>
              <Select
                value={pageSize}
                label="表示件数"
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                {pageSizeOptions.map((size) => (
                  <MenuItem key={size} value={size}>
                    {size}件
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* ページ情報 */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ ml: "auto" }}
          >
            {getPageInfo()}
          </Typography>
        </Paper>
      )}

      {/* ゲームリスト */}
      {cardVariant === "list" ? (
        // リスト表示
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {games.map((game) => (
            <UnifiedGameCard key={game.id} game={game} variant="list" />
          ))}
        </Box>
      ) : (
        // グリッド表示
        <Grid container spacing={2}>
          {games.map((game) => (
            <Grid item key={game.id} {...gridColumns}>
              <UnifiedGameCard game={game} variant={cardVariant} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* ページネーション */}
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
            onChange={(_, page) => setPage(page)}
            size="large"
            showFirstButton
            showLastButton
            sx={{
              "& .MuiPagination-ul": {
                justifyContent: "center",
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
};
