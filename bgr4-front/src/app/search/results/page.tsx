"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Tooltip,
} from "@mui/material";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ShareIcon from "@mui/icons-material/Share";
import SortIcon from "@mui/icons-material/Sort";

// 新しい統一システムのインポート
import { useGames } from "@/hooks/api/useGames";
import { usePagination } from "@/hooks/state/usePagination";
import { UnifiedGameList } from "@/components/ui/GameList/UnifiedGameList";
import SearchPagination from "@/components/ui/SearchPagination";
import { LAYOUT_CONFIG } from "@/styles/layout";
import { DESIGN_TOKENS } from "@/theme/tokens";

// 設定定数
const PAGE_SIZE_OPTIONS = [12, 24, 36, 48, 60, 72];
const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0];

const SORT_OPTIONS = [
  { value: "review_date", label: "レビュー新着順" },
  { value: "reviews_count", label: "レビュー投稿数順" },
  { value: "average_score", label: "総合得点順" },
  { value: "created_at", label: "ゲーム登録順" },
];

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);
  const [sortBy, setSortBy] = useState(
    searchParams.get("sortBy") || SORT_OPTIONS[0].value
  );

  // 統一ページネーション管理
  const { page, pageSize, setPage, setPageSize, updateUrl } = usePagination({
    defaultPageSize: DEFAULT_PAGE_SIZE,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    syncWithUrl: true,
  });

  // 検索パラメータの構築
  const searchFilters = (() => {
    const params: Record<string, any> = {};

    // URLパラメータを取得
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    // 配列パラメータの処理
    if (params.mechanics) params.mechanics = params.mechanics.split(",");
    if (params.categories) params.categories = params.categories.split(",");
    if (params.recommended_players)
      params.recommended_players = params.recommended_players.split(",");

    // 数値パラメータの処理
    [
      "min_players",
      "max_players",
      "play_time_min",
      "play_time_max",
      "complexity_min",
      "complexity_max",
      "total_score_min",
      "total_score_max",
      "interaction_min",
      "interaction_max",
      "luck_factor_min",
      "luck_factor_max",
      "downtime_min",
      "downtime_max",
    ].forEach((key) => {
      if (params[key]) params[key] = Number(params[key]);
    });

    // ページネーションとソート
    params.page = page;
    params.per_page = pageSize;
    params.sort_by = sortBy;

    return params;
  })();

  // 統一ゲームデータフェッチ
  const {
    data: searchResults,
    pagination,
    loading,
    error,
  } = useGames({
    type: "search",
    filters: searchFilters,
    enabled: true,
  });

  // ページネーション情報の同期
  useEffect(() => {
    if (pagination) {
      // バックエンドからのページ情報で不整合があった場合の修正
      if (pagination.current_page !== page && pagination.current_page > 0) {
        setPage(pagination.current_page);
      }
    }
  }, [pagination, page, setPage]);

  // ソート変更ハンドラー
  const handleSortChange = (event: SelectChangeEvent) => {
    const newSortBy = event.target.value;
    setSortBy(newSortBy);
    setPage(1); // ソート変更時は1ページ目に戻る

    // URLを更新（ページネーションフックが自動で同期）
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", newSortBy);
    params.set("page", "1");
    updateUrl(params);

    // 画面上部にスクロール
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // URLをクリップボードにコピー
  const handleShareClick = () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error("URLのコピーに失敗しました:", err);
      });
  };

  // 検索条件の表示用テキストを生成
  const getSearchCriteriaText = () => {
    const criteriaTexts = [];
    const keyword = searchParams.get("keyword");
    const minPlayers = searchParams.get("min_players");
    const maxPlayers = searchParams.get("max_players");

    if (keyword) {
      criteriaTexts.push(`キーワード: ${keyword}`);
    }

    if (minPlayers || maxPlayers) {
      const min = minPlayers || "指定なし";
      const max = maxPlayers || "指定なし";
      criteriaTexts.push(`プレイ人数: ${min}〜${max}人`);
    }

    return criteriaTexts.length > 0
      ? criteriaTexts.join(", ")
      : "すべてのゲーム";
  };

  return (
    <Container maxWidth={false}>
      <Box sx={{ py: DESIGN_TOKENS.spacing.lg }}>
        {/* ヘッダーアクション */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: DESIGN_TOKENS.spacing.md,
          }}
        >
          <Link href="/search" style={{ textDecoration: "none" }}>
            <Button variant="outlined">← 検索条件を変更</Button>
          </Link>

          <Tooltip title={copied ? "コピーしました！" : "URLをコピー"}>
            <Button
              variant="outlined"
              startIcon={<ShareIcon />}
              onClick={handleShareClick}
            >
              {copied ? "コピーしました" : "共有"}
            </Button>
          </Tooltip>
        </Box>

        {/* タイトルと検索条件 */}
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: DESIGN_TOKENS.typography.fontWeights.bold,
            color: DESIGN_TOKENS.colors.text.primary,
          }}
        >
          検索結果
        </Typography>

        <Typography
          variant="subtitle1"
          gutterBottom
          sx={{
            mb: DESIGN_TOKENS.spacing.lg,
            color: DESIGN_TOKENS.colors.text.secondary,
          }}
        >
          検索条件: {getSearchCriteriaText()}
        </Typography>

        {/* ローディング状態 */}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* エラー状態 */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* 検索結果なし */}
        {!loading && !error && searchResults && searchResults.length === 0 && (
          <Alert severity="info" sx={{ mb: 3 }}>
            検索条件に一致するゲームが見つかりませんでした。条件を変更して再度お試しください。
          </Alert>
        )}

        {/* 検索結果表示 */}
        {!loading && !error && searchResults && searchResults.length > 0 && (
          <>
            {/* ソート機能 */}
            <Box
              sx={{
                mb: DESIGN_TOKENS.spacing.lg,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <FormControl sx={{ minWidth: 250 }}>
                <InputLabel id="sort-select-label">並び替え</InputLabel>
                <Select
                  labelId="sort-select-label"
                  id="sort-select"
                  value={sortBy}
                  label="並び替え"
                  onChange={handleSortChange}
                  startAdornment={
                    <SortIcon sx={{ mr: 1, color: "action.active" }} />
                  }
                >
                  {SORT_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* ページネーション（上） */}
            {pagination && (
              <SearchPagination
                count={pagination.total_pages}
                page={page}
                onChange={(_, value) => setPage(value)}
                size="medium"
                totalItems={pagination.total_count}
                currentPageStart={(page - 1) * pageSize + 1}
                currentPageEnd={Math.min(
                  page * pageSize,
                  pagination.total_count
                )}
                pageSize={pageSize}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                onPageSizeChange={(_, newSize) =>
                  newSize && setPageSize(newSize)
                }
                showIfSinglePage={true}
              />
            )}

            <Divider sx={{ mb: DESIGN_TOKENS.spacing.lg }} />

            {/* 統一ゲームリストコンポーネント */}
            <UnifiedGameList
              games={searchResults}
              variant="grid"
              cardVariant="compact"
              useOverallScoreDisplay={true}
              overallScoreVariant="compact"
              loading={loading}
              gridSpacing={LAYOUT_CONFIG.gridSpacing}
              enableSharing={true}
            />

            {/* ページネーション（下） */}
            {pagination && pagination.total_pages > 1 && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                <SearchPagination
                  count={pagination.total_pages}
                  page={page}
                  onChange={(_, value) => setPage(value)}
                  size="large"
                  totalItems={pagination.total_count}
                  currentPageStart={(page - 1) * pageSize + 1}
                  currentPageEnd={Math.min(
                    page * pageSize,
                    pagination.total_count
                  )}
                  pageSize={pageSize}
                  onPageSizeChange={(_, newSize) =>
                    newSize && setPageSize(newSize)
                  }
                  showPageSizeSelector={false}
                  showIfSinglePage={true}
                />
              </Box>
            )}
          </>
        )}
      </Box>
    </Container>
  );
}
