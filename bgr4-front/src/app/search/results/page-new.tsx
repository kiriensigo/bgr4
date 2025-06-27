"use client";

import { useState } from "react";
import {
  Container,
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Tooltip,
  Stack,
  Pagination,
} from "@mui/material";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ShareIcon from "@mui/icons-material/Share";

// 既存のGameGridを使用
import GameGrid from "@/components/GameGrid";
import { useGames } from "@/hooks/useGames";
import { usePagination } from "@/hooks/state/usePagination";

// 設定定数
const PAGE_SIZE_OPTIONS = [12, 24, 36, 48];
const DEFAULT_PAGE_SIZE = 24;

const SORT_OPTIONS = [
  { value: "review_date", label: "レビュー新着順" },
  { value: "reviews_count", label: "レビュー投稿数順" },
  { value: "average_score", label: "総合得点順" },
  { value: "created_at", label: "ゲーム登録順" },
];

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);
  const [sortBy, setSortBy] = useState(SORT_OPTIONS[0].value);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // 統一ページネーション管理
  const {} = usePagination({
    defaultPageSize: DEFAULT_PAGE_SIZE,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    syncWithUrl: true,
  });

  // 検索パラメータの構築
  const searchFilters = (() => {
    const params: Record<string, any> = {};

    searchParams.forEach((value, key) => {
      if (value && value !== "undefined" && value !== "null" && value !== "") {
        params[key] = value;
      }
    });

    params.page = page;
    params.per_page = pageSize;
    params.sort_by = sortBy;

    return params;
  })();

  // 統一ゲームデータフェッチ
  const { data, games, pagination, loading, error } = useGames({
    type: "search",
    filters: searchFilters,
    enabled: true,
  });

  const searchResults = games || data?.games || data || [];

  // ソート変更ハンドラー
  const handleSortChange = (event: SelectChangeEvent) => {
    setSortBy(event.target.value);
    setPage(1);
  };

  // 表示件数変更ハンドラー
  const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
    setPageSize(event.target.value as number);
    setPage(1);
  };

  // URLコピー
  const handleShareClick = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // 検索条件表示
  const getSearchCriteriaText = () => {
    const criteriaTexts = [];
    const keyword = searchParams.get("keyword");
    const totalScoreMin = searchParams.get("total_score_min");

    if (keyword) criteriaTexts.push(`キーワード: ${keyword}`);
    if (totalScoreMin) criteriaTexts.push(`総合評価: ${totalScoreMin}点以上`);

    return criteriaTexts.length > 0
      ? criteriaTexts.join(", ")
      : "すべてのゲーム";
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* ヘッダー */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Link href="/search" style={{ textDecoration: "none" }}>
          <Button variant="outlined" size="small">
            ← 検索条件を変更
          </Button>
        </Link>
        <Tooltip title={copied ? "コピーしました！" : "URLをコピー"}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ShareIcon />}
            onClick={handleShareClick}
          >
            {copied ? "コピーしました" : "共有"}
          </Button>
        </Tooltip>
      </Stack>

      {/* タイトル */}
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ mb: 1, fontWeight: "bold", textAlign: "center" }}
      >
        検索結果
      </Typography>
      <Typography
        variant="subtitle1"
        color="text.secondary"
        sx={{ mb: 3, textAlign: "center" }}
      >
        検索条件: {getSearchCriteriaText()}
      </Typography>

      {/* エラー・結果なし */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          検索に失敗しました: {error.message || error}
        </Alert>
      )}
      {!loading && !error && searchResults.length === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          検索条件に一致するゲームが見つかりませんでした。
        </Alert>
      )}

      {/* 検索結果表示 */}
      {!loading && !error && searchResults.length > 0 && (
        <>
          {/* コントロール */}
          <Box sx={{ mb: 4 }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>並び順</InputLabel>
                <Select
                  value={sortBy}
                  label="並び順"
                  onChange={handleSortChange}
                >
                  {SORT_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>表示件数</InputLabel>
                <Select
                  value={pageSize}
                  label="表示件数"
                  onChange={handlePageSizeChange}
                >
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}件
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {pagination && (
                <Typography variant="body2" color="text.secondary">
                  {pagination.total_count}件中 {(page - 1) * pageSize + 1}-
                  {Math.min(page * pageSize, pagination.total_count)}件を表示
                </Typography>
              )}
            </Stack>
          </Box>

          {/* ゲーム一覧 */}
          <GameGrid title="" games={searchResults} loading={loading} />

          {/* ページネーション */}
          {pagination && pagination.total_pages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <Pagination
                count={pagination.total_pages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}

      {/* ローディング */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 8 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>検索中...</Typography>
        </Box>
      )}
    </Container>
  );
}
