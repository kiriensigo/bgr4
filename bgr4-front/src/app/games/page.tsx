"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getGames, searchGames, type Game as APIGame } from "@/lib/api";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid,
  Container,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  Paper,
} from "@mui/material";
import GameCard from "@/components/GameCard";
import SearchPagination from "@/components/SearchPagination";
import { containerStyle, LAYOUT_CONFIG } from "@/styles/layout";
import { useRouter, useSearchParams } from "next/navigation";
import SortIcon from "@mui/icons-material/Sort";

// APIから取得するゲームの型を拡張
// 注意: APIのGame型と同じ名前ですが、ここでは拡張した型を定義しています
interface GameWithExtras extends APIGame {
  created_at?: string;
  updated_at?: string;
  reviews?: Array<{
    created_at: string;
    user?: {
      id?: number;
      name?: string;
      email?: string;
    };
  }>;
}

// 型エイリアスを作成して、コード内ではこの型を使用します
type Game = GameWithExtras;

// 1ページあたりの表示件数
const PAGE_SIZE_OPTIONS = [12, 24, 36, 48, 60, 72];
const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0];

// ソートオプション
type SortOption = {
  value: string;
  label: string;
};

const SORT_OPTIONS: SortOption[] = [
  { value: "review_date", label: "レビュー新着順" },
  { value: "reviews_count", label: "レビュー投稿数順" },
  { value: "average_score", label: "総合得点順" },
  { value: "created_at", label: "ゲーム登録順" },
];

export default function GamesPage() {
  // URLからクエリパラメータを取得
  const searchParams = useSearchParams();
  const router = useRouter();

  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // URLからページネーション情報とソート情報を取得
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const initialPageSize = parseInt(
    searchParams.get("pageSize") || String(DEFAULT_PAGE_SIZE),
    10
  );
  const initialSortBy = searchParams.get("sortBy") || SORT_OPTIONS[0].value;

  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // ゲーム一覧を取得
  useEffect(() => {
    const fetchGames = async () => {
      setLoading(true);
      setError(null);

      try {
        // ページネーションとソートを使用してゲームを取得
        const response = await getGames(page, pageSize, sortBy);
        console.log("Games data:", response);

        // レビュー数のデバッグ
        response.games.forEach((game) => {
          console.log(
            `Game: ${game.name}, Reviews Count: ${game.reviews_count}`
          );
        });

        // バックエンドでソート済みのゲームをそのまま使用
        setGames(response.games);

        // ページネーション情報を設定
        setTotalPages(response.pagination.total_pages);

        // 総アイテム数を保存
        setTotalItems(response.pagination.total_count);
      } catch (err) {
        console.error("ゲーム一覧の取得に失敗しました:", err);
        setError(
          err instanceof Error ? err.message : "ゲーム一覧の取得に失敗しました"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [page, pageSize, sortBy]);

  // ページサイズが変更されたときに総ページ数を再計算
  useEffect(() => {
    // APIから返されたtotal_pagesを使用するため、ここでの再計算は不要
    // 現在のページが新しい総ページ数を超えている場合は、最後のページに設定
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [pageSize, totalPages, page]);

  // URLを更新する関数
  const updateUrl = (
    newPage: number,
    newPageSize: number,
    newSortBy: string
  ) => {
    const params = new URLSearchParams();
    params.set("page", newPage.toString());
    params.set("pageSize", newPageSize.toString());
    params.set("sortBy", newSortBy);
    router.push(`/games?${params.toString()}`, { scroll: false });
  };

  // ページ変更ハンドラー
  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPage(value);
    updateUrl(value, pageSize, sortBy);
    // ページ変更時に画面上部にスクロール
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 表示件数変更ハンドラー
  const handlePageSizeChange = (
    event: React.MouseEvent<HTMLElement>,
    newPageSize: number | null
  ) => {
    if (newPageSize !== null) {
      setPageSize(newPageSize);
      // ページを1に戻す
      setPage(1);
      updateUrl(1, newPageSize, sortBy);
      // 画面上部にスクロール
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // ソート順変更ハンドラー
  const handleSortChange = (event: SelectChangeEvent) => {
    const newSortBy = event.target.value;
    setSortBy(newSortBy);
    // ページを1に戻す
    setPage(1);
    updateUrl(1, pageSize, newSortBy);
    // 画面上部にスクロール
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 現在のページに表示するゲーム
  const paginatedGames = games;

  // 現在のページの表示範囲を計算
  const currentPageStart = games.length > 0 ? (page - 1) * pageSize + 1 : 0;
  const currentPageEnd =
    games.length > 0
      ? Math.min(currentPageStart + games.length - 1, totalItems)
      : 0;

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          ボードゲーム一覧
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          ボードゲーム一覧
        </Typography>
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth={false}>
      <Box sx={containerStyle}>
        <Typography variant="h4" component="h1" gutterBottom>
          ボードゲーム一覧
        </Typography>

        {/* ソート機能 */}
        <Box
          sx={{
            mb: 3,
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

        {/* 表示件数とページネーション */}
        <SearchPagination
          count={totalPages}
          page={page}
          onChange={handlePageChange}
          size="medium"
          totalItems={totalItems}
          currentPageStart={currentPageStart}
          currentPageEnd={currentPageEnd}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          showIfSinglePage={true}
        />

        <Divider sx={{ mb: 3 }} />

        {/* ゲーム一覧 */}
        {paginatedGames.length === 0 ? (
          <Alert severity="info" sx={{ my: 4 }}>
            ゲームが見つかりませんでした
          </Alert>
        ) : (
          <Grid container spacing={LAYOUT_CONFIG.gridSpacing}>
            {paginatedGames.map((game) => (
              <Grid item xs={12} sm={6} md={4} key={game.id}>
                <GameCard
                  game={{
                    ...game,
                    id: typeof game.id === "number" ? String(game.id) : game.id,
                  }}
                  type="game"
                />
              </Grid>
            ))}
          </Grid>
        )}

        {/* ページネーション（下部） */}
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <SearchPagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            size="large"
            showPageSizeSelector={false}
            showIfSinglePage={true}
          />
        </Box>
      </Box>
    </Container>
  );
}
