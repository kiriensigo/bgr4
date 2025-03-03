"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Divider,
  Paper,
  Skeleton,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Game, GamesResponse } from "@/lib/api";
import GameCard from "@/components/GameCard";
import SearchPagination from "@/components/SearchPagination";
import SortIcon from "@mui/icons-material/Sort";
import ErrorDisplay from "@/components/ErrorDisplay";
import NoResults from "@/components/NoResults";
import { useRouter, useSearchParams } from "next/navigation";

// ソートオプション
export type SortOption = {
  value: string;
  label: string;
};

export const SORT_OPTIONS: SortOption[] = [
  { value: "review_date", label: "レビュー新着順" },
  { value: "reviews_count", label: "レビュー投稿数順" },
  { value: "average_score", label: "総合得点順" },
  { value: "created_at", label: "ゲーム登録順" },
];

// 1ページあたりの表示件数
export const PAGE_SIZE_OPTIONS = [12, 24, 36, 48, 60, 72];
export const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0];

export interface GameListProps {
  title?: string;
  fetchGames: (
    page: number,
    pageSize: number,
    sortBy: string
  ) => Promise<GamesResponse>;
  initialPage?: number;
  initialPageSize?: number;
  initialSortBy?: string;
  showTitle?: boolean;
  showSort?: boolean;
  emptyMessage?: string;
  gridSpacing?: number;
  gridItemProps?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
}

export default function GameList({
  title = "ゲーム一覧",
  fetchGames,
  initialPage = 1,
  initialPageSize = DEFAULT_PAGE_SIZE,
  initialSortBy = SORT_OPTIONS[0].value,
  showTitle = true,
  showSort = true,
  emptyMessage = "ゲームが見つかりませんでした",
  gridSpacing = 3,
  gridItemProps = { xs: 12, sm: 6, md: 4, lg: 3 },
}: GameListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URLからページネーション情報とソート情報を取得
  const urlPage = parseInt(searchParams.get("page") || String(initialPage), 10);
  const urlPageSize = parseInt(
    searchParams.get("pageSize") || String(initialPageSize),
    10
  );
  const urlSortBy = searchParams.get("sortBy") || initialSortBy;

  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(urlPage);
  const [pageSize, setPageSize] = useState(urlPageSize);
  const [sortBy, setSortBy] = useState(urlSortBy);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // URLを更新する関数をメモ化
  const updateUrl = useCallback(
    (newPage: number, newPageSize: number, newSortBy: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", newPage.toString());
      params.set("pageSize", newPageSize.toString());
      params.set("sortBy", newSortBy);
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  // ゲーム一覧を取得
  useEffect(() => {
    const loadGames = async () => {
      setLoading(true);
      setError(null);

      try {
        // APIリクエストのパラメータをログに出力
        console.log(
          `APIリクエスト: page=${page}, pageSize=${pageSize}, sortBy=${sortBy}`
        );

        // ページネーションとソートを使用してゲームを取得
        const response = await fetchGames(page, pageSize, sortBy);

        // 詳細なデバッグ情報
        console.log("=== ゲーム一覧取得結果 ===");
        console.log(
          `リクエスト: page=${page}, pageSize=${pageSize}, sortBy=${sortBy}`
        );
        console.log(
          `レスポンス: current_page=${response.pagination.current_page}, total_pages=${response.pagination.total_pages}, total_count=${response.pagination.total_count}, per_page=${response.pagination.per_page}`
        );
        console.log(`取得したゲーム数: ${response.games.length}`);
        console.log("========================");

        // バックエンドから返されたcurrent_pageと実際のページ番号が異なる場合の処理
        if (response.pagination.current_page !== page) {
          console.warn(
            `警告: バックエンドから返されたページ番号(${response.pagination.current_page})と要求したページ番号(${page})が一致しません。`
          );
          // バックエンドから返されたページ番号を信頼する
          if (response.pagination.current_page !== 0) {
            console.log(
              `ページ番号を修正: ${page} -> ${response.pagination.current_page}`
            );
            setPage(response.pagination.current_page);
            // URLも更新するが、無限ループを防ぐためにuseEffectは再実行しない
            const params = new URLSearchParams(searchParams.toString());
            params.set("page", response.pagination.current_page.toString());
            params.set("pageSize", pageSize.toString());
            params.set("sortBy", sortBy);
            router.push(`?${params.toString()}`, { scroll: false });
          }
        }

        // 総ページ数を設定
        const newTotalPages = response.pagination.total_pages;
        setTotalPages(newTotalPages);

        // 総アイテム数を保存
        setTotalItems(response.pagination.total_count);

        // 現在のページが総ページ数を超えている場合は、最後のページに移動
        if (page > newTotalPages && newTotalPages > 0) {
          console.log(
            `ページ番号(${page})が総ページ数(${newTotalPages})を超えています。最後のページに移動します。`
          );
          setPage(newTotalPages);
          updateUrl(newTotalPages, pageSize, sortBy);
          return; // 再度useEffectが実行されるので、ここで終了
        }

        // レビュー数のデバッグ
        if (response.games.length > 0) {
          response.games.forEach((game) => {
            console.log(
              `Game: ${game.name}, Reviews Count: ${game.reviews_count}`
            );
          });
        } else {
          console.log("ゲームデータが空です");
          // 空の結果でも、バックエンドのページネーション情報を信頼する
          console.log(
            `バックエンドから空の結果が返されましたが、ページネーション情報を確認します。`
          );
          console.log(
            `総ページ数: ${newTotalPages}, 総アイテム数: ${response.pagination.total_count}, 現在ページ: ${response.pagination.current_page}`
          );

          // バックエンドが返した現在のページが1で、要求したページが1より大きい場合
          // これは通常、バックエンドが自動的に1ページ目に戻した場合に発生する
          if (response.pagination.current_page === 1 && page > 1) {
            console.log(
              `バックエンドが自動的に1ページ目に戻したようです。UIも1ページ目に更新します。`
            );
            setPage(1);
            updateUrl(1, pageSize, sortBy);
            return;
          }

          // ただし、現在のページが総ページ数を超えている場合は調整する
          if (page > newTotalPages && newTotalPages > 0) {
            console.log(
              `ページ番号(${page})が総ページ数(${newTotalPages})を超えています。最後のページに移動します。`
            );
            setPage(newTotalPages);
            updateUrl(newTotalPages, pageSize, sortBy);
            return;
          }
        }

        // バックエンドでソート済みのゲームをそのまま使用
        setGames(response.games);
      } catch (err) {
        console.error("ゲーム一覧の取得に失敗しました:", err);
        setError(
          err instanceof Error ? err.message : "ゲーム一覧の取得に失敗しました"
        );
        // エラーが発生した場合は1ページ目に戻る
        if (page > 1) {
          console.log("エラーが発生したため1ページ目に戻ります");
          setPage(1);
          updateUrl(1, pageSize, sortBy);
        }
      } finally {
        setLoading(false);
      }
    };

    loadGames();
  }, [page, pageSize, sortBy, fetchGames, updateUrl]);

  // 現在のページの表示範囲を計算
  const currentPageStart = games.length > 0 ? (page - 1) * pageSize + 1 : 0;
  const currentPageEnd =
    games.length > 0 ? Math.min(page * pageSize, totalItems) : 0;

  // ページが変わったときにスクロールを上部に戻す
  useEffect(() => {
    if (!loading) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [page, loading]);

  // ページサイズが変更されたときに総ページ数を再計算
  useEffect(() => {
    // 現在のページが新しい総ページ数を超えている場合は、最後のページに設定
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
      updateUrl(totalPages, pageSize, sortBy);
    }
  }, [pageSize, totalPages, page, updateUrl, sortBy]);

  // ページ変更ハンドラー
  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    // 無効なページ番号の場合は処理しない
    if (value < 1 || (totalPages > 0 && value > totalPages)) {
      console.warn(`無効なページ番号: ${value}、処理をスキップします`);
      return;
    }

    console.log(`ページを変更: ${page} -> ${value}`);
    setPage(value);
    updateUrl(value, pageSize, sortBy);
  };

  // 表示件数変更ハンドラー
  const handlePageSizeChange = (
    event: React.MouseEvent<HTMLElement>,
    newPageSize: number | null
  ) => {
    if (newPageSize !== null) {
      console.log(`表示件数を変更: ${pageSize} -> ${newPageSize}`);

      // 新しい表示件数に基づいて総ページ数を計算
      const newTotalPages = Math.ceil(totalItems / newPageSize);
      console.log(
        `新しい総ページ数の計算: ${totalItems} / ${newPageSize} = ${newTotalPages}`
      );

      // 現在のページが新しい総ページ数を超える場合は調整する
      let newPage = page;
      if (page > newTotalPages && newTotalPages > 0) {
        console.log(
          `現在のページ(${page})が新しい総ページ数(${newTotalPages})を超えています。最後のページに調整します。`
        );
        newPage = newTotalPages;
      }

      setPageSize(newPageSize);
      if (newPage !== page) {
        setPage(newPage);
      }

      // URLを更新
      console.log(
        `URLを更新: page=${newPage}, pageSize=${newPageSize}, sortBy=${sortBy}`
      );
      updateUrl(newPage, newPageSize, sortBy);
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

  if (loading) {
    return (
      <Box>
        {showTitle && (
          <Typography variant="h4" component="h1" gutterBottom>
            {title}
          </Typography>
        )}
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        {showTitle && (
          <Typography variant="h4" component="h1" gutterBottom>
            {title}
          </Typography>
        )}
        <ErrorDisplay message={error} />
      </Box>
    );
  }

  return (
    <Box>
      {showTitle && (
        <Typography variant="h4" component="h1" gutterBottom>
          {title}
        </Typography>
      )}

      {/* ソート機能 */}
      {showSort && (
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
      )}

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
      {games.length === 0 ? (
        <Alert severity="info" sx={{ my: 4 }}>
          {emptyMessage}
        </Alert>
      ) : (
        <Grid container spacing={gridSpacing}>
          {games.map((game) => (
            <Grid
              item
              key={game.id}
              xs={gridItemProps.xs}
              sm={gridItemProps.sm}
              md={gridItemProps.md}
              lg={gridItemProps.lg}
            >
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
          totalItems={totalItems}
          currentPageStart={currentPageStart}
          currentPageEnd={currentPageEnd}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          showPageSizeSelector={false}
          showIfSinglePage={true}
        />
      </Box>
    </Box>
  );
}
