"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Grid,
  Typography,
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
import SearchPagination from "./SearchPagination";

// ソートオプションの型定義
export type SortOption = {
  value: string;
  label: string;
};

// GameListコンポーネントのプロパティ
export interface GameListProps {
  title?: string;
  showTitle?: boolean;
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
const PAGE_SIZE_OPTIONS = [12, 24, 36, 48, 72];
// 最大取得数
const MAX_PAGE_SIZE = 72;
// 最大ページ数（エラーを防ぐために設定）
const MAX_SAFE_PAGES = 5;
// キャッシュの有効期限（15分）
const CACHE_EXPIRY = 15 * 60 * 1000;

// アプリケーション全体でのゲームデータキャッシュ
interface GamesCacheItem {
  data: Game[];
  totalPages: number;
  totalItems: number;
  timestamp: number;
}

// ゲームキャッシュオブジェクト: キーは "page-pageSize-sort" 形式
const gamesCache: Record<string, GamesCacheItem> = {};

// 総アイテム数のグローバルキャッシュ
let globalTotalGames = 0;
let globalTotalGamesTimestamp = 0;

export default function GameList({
  title,
  showTitle = true,
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
  const [initialLoadDone, setInitialLoadDone] = useState(false);

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
    // ページサイズと現在のページを制限して安全に
    const safePageSize = Math.min(currentPageSize, MAX_PAGE_SIZE);
    const safePage = Math.min(currentPage, MAX_SAFE_PAGES);

    // キャッシュキーを作成
    const cacheKey = `${safePage}-${safePageSize}-${currentSort}`;
    const now = Date.now();
    let useCache = false;

    // キャッシュをチェック（totalItemsが0の場合はキャッシュを使わない）
    if (
      totalItems > 0 &&
      gamesCache[cacheKey] &&
      now - gamesCache[cacheKey].timestamp < CACHE_EXPIRY
    ) {
      console.log(`Using cached games data for ${cacheKey}`);
      const cachedData = gamesCache[cacheKey];

      setGames(cachedData.data);
      setTotalPages(cachedData.totalPages);
      setTotalItems(cachedData.totalItems);
      useCache = true;

      // キャッシュ使用時は即座にロード状態を解除
      if (loading) {
        setLoading(false);
      }

      setInitialLoadDone(true);
      return;
    }

    // キャッシュが使用できない場合のみロード状態に設定
    if (!useCache) {
      setLoading(true);
      setError(null);
    }

    try {
      console.log(
        `Fetching games for page ${safePage}, pageSize ${safePageSize}, sort ${currentSort}`
      );

      // APIリクエストにキャッシュを活用
      const data = await fetchGames(safePage, safePageSize, currentSort);

      console.log("Games data from API:", data);
      console.log(
        `Received ${data.games.length} games, totalPages: ${data.totalPages}, totalItems: ${data.totalItems}`
      );

      setGames(data.games);

      // APIから返された正確な総数を常に優先して使用
      let actualTotalItems = data.totalItems;
      let actualTotalPages = data.totalPages;

      // APIから値が取得できなかった場合のみ、代替値を計算
      if (!actualTotalItems || actualTotalItems <= 0) {
        console.log(
          "API did not return valid totalItems, calculating alternative..."
        );
        // APIから総数が返されない場合は推測
        if (data.games.length < safePageSize) {
          // 最後のページと思われる場合
          actualTotalItems = (safePage - 1) * safePageSize + data.games.length;
          actualTotalPages = safePage;
          console.log(
            `Estimated total from partial page: ${actualTotalItems} items`
          );
        } else if (totalItems > 0) {
          // 既存の値を使用
          actualTotalItems = totalItems;
          actualTotalPages = Math.min(
            Math.ceil(actualTotalItems / safePageSize),
            MAX_SAFE_PAGES
          );
          console.log(`Using existing value: ${actualTotalItems} items`);
        } else {
          // 最低でも現在のページ×ページサイズの3倍と見積もる
          actualTotalItems = Math.min(safePageSize * MAX_SAFE_PAGES, 200);
          actualTotalPages = Math.min(
            Math.ceil(actualTotalItems / safePageSize),
            MAX_SAFE_PAGES
          );
          console.log(`Using safe default estimate: ${actualTotalItems} items`);
        }
      } else {
        console.log(
          `Using API reported value: ${actualTotalItems} total items`
        );
        // グローバルキャッシュを更新
        globalTotalGames = actualTotalItems;
        globalTotalGamesTimestamp = now;
      }

      console.log(
        `Setting totalItems: ${actualTotalItems}, totalPages: ${actualTotalPages}`
      );
      setTotalPages(actualTotalPages);
      setTotalItems(actualTotalItems);

      // キャッシュにデータを保存
      gamesCache[cacheKey] = {
        data: data.games,
        totalPages: actualTotalPages,
        totalItems: actualTotalItems,
        timestamp: now,
      };

      // 現在のページが総ページ数を超えている場合は、最後のページに移動
      if (currentPage > actualTotalPages && actualTotalPages > 0) {
        setCurrentPage(actualTotalPages);
        updateUrl(actualTotalPages, safePageSize, currentSort);
      }

      setInitialLoadDone(true);
    } catch (err) {
      console.error("Failed to fetch games:", err);
      // APIエラーの詳細を確認
      if (err instanceof Error) {
        // エラーメッセージを設定
        setError(err.message || "ゲームの取得中にエラーが発生しました。");

        // 500エラーなどで問題が発生した可能性がある場合は1ページ目に戻る
        if (currentPage > 1) {
          console.log("Navigating back to page 1 due to error");
          setCurrentPage(1);
          updateUrl(1, currentPageSize, currentSort);
        }
      } else {
        setError("ゲームの取得中にエラーが発生しました。");
      }
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    currentPageSize,
    currentSort,
    fetchGames,
    updateUrl,
    loading,
    totalItems,
  ]);

  // 総レコード数を別途取得する関数 - APIから直接正確な総数を取得
  const fetchTotalCount = useCallback(async () => {
    try {
      // APIから総数を取得（最大サイズのページで効率的に）
      const size = PAGE_SIZE_OPTIONS[PAGE_SIZE_OPTIONS.length - 1];
      console.log(`Fetching total count with page size ${size}`);

      const data = await fetchGames(1, size, currentSort);

      // APIから返された総数を使用
      if (data.totalItems && data.totalItems > 0) {
        console.log(`API reported ${data.totalItems} total items`);

        // グローバルキャッシュを更新
        globalTotalGames = data.totalItems;
        globalTotalGamesTimestamp = Date.now();

        // 現在のページサイズに基づいてページ数を計算
        const calculatedPages = Math.min(
          Math.ceil(data.totalItems / currentPageSize),
          MAX_SAFE_PAGES
        );

        console.log(
          `Setting totalItems: ${data.totalItems}, totalPages: ${calculatedPages}`
        );
        setTotalItems(data.totalItems);
        setTotalPages(calculatedPages);
        return data.totalItems;
      }

      console.log("API did not return a valid total count");
      return 0;
    } catch (error) {
      console.error("Error fetching total count:", error);
      return 0;
    }
  }, [fetchGames, currentPageSize, currentSort]);

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

  // ページサイズ変更時のハンドラ
  const handlePageSizeChange = useCallback(
    (event: React.MouseEvent<HTMLElement>, newPageSize: number | null) => {
      if (newPageSize === null) return;

      console.log(`Page size changed to ${newPageSize}`);

      // ページサイズ変更時に総アイテム数とページ数の計算をリセットする
      setTotalItems(0);
      setTotalPages(0);

      // キャッシュをすべてクリア
      Object.keys(gamesCache).forEach((key) => {
        delete gamesCache[key];
      });

      // グローバルキャッシュもリセット
      globalTotalGames = 0;
      globalTotalGamesTimestamp = 0;

      // ページサイズ変更時は常に1ページ目に戻す
      setCurrentPage(1);
      setCurrentPageSize(newPageSize);
      updateUrl(1, newPageSize, currentSort);

      // ページサイズ変更時に少し遅延して総件数を再取得
      setTimeout(() => {
        fetchTotalCount();
      }, 100);
    },
    [updateUrl, currentSort, fetchTotalCount]
  );

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

  // コンポーネントのマウント時、URLパラメータの変更時、または依存関係の変更時にデータを再ロードする
  useEffect(() => {
    loadGames();
  }, [loadGames]);

  // 初回マウント時に総レコード数を取得する
  useEffect(() => {
    // タイムスタンプベースのキャッシュチェック（10分間有効）
    const now = Date.now();
    const cacheExpired = now - globalTotalGamesTimestamp > 10 * 60 * 1000;

    // グローバルキャッシュがない、または期限切れの場合のみ総数を取得
    if (globalTotalGames <= 0 || cacheExpired) {
      console.log("Fetching total count on mount...");
      fetchTotalCount();
    } else {
      console.log(`Using cached global total games: ${globalTotalGames}`);
      // キャッシュされた総数を使用してページ数を計算
      const calculatedPages = Math.min(
        Math.ceil(globalTotalGames / currentPageSize),
        MAX_SAFE_PAGES
      );
      setTotalItems(globalTotalGames);
      setTotalPages(calculatedPages);
    }
  }, [fetchTotalCount, currentPageSize]);

  // 現在表示しているアイテムの範囲を計算（最小値が1になるように調整）
  const startItem =
    totalItems > 0 ? Math.max((currentPage - 1) * currentPageSize + 1, 1) : 0;
  const endItem =
    totalItems > 0 ? Math.min(currentPage * currentPageSize, totalItems) : 0;

  return (
    <Box sx={{ width: "100%" }}>
      {showTitle && title && (
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
          <SearchPagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            size="medium"
            totalItems={totalItems}
            currentPageStart={startItem}
            currentPageEnd={endItem}
            pageSize={currentPageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageSizeChange={handlePageSizeChange}
            showPageSizeSelector={true}
            showIfSinglePage={true}
            showFirstButton
            showLastButton
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
          </SearchPagination>

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

          {showPagination && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mt: 4,
                mb: 2,
              }}
            >
              <SearchPagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                size={isMobile ? "small" : "medium"}
                totalItems={totalItems}
                currentPageStart={startItem}
                currentPageEnd={endItem}
                pageSize={currentPageSize}
                onPageSizeChange={handlePageSizeChange}
                showPageSizeSelector={false}
                showIfSinglePage={true}
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
