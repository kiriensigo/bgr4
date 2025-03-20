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

    // キャッシュをチェック
    if (
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

      // APIから返されたtotalPagesとtotalItemsを使用
      let estimatedTotalPages = data.totalPages;
      let estimatedTotalItems = data.totalItems;

      // 総アイテム数のグローバルキャッシュを更新
      if (estimatedTotalItems > 0) {
        globalTotalGames = estimatedTotalItems;
        globalTotalGamesTimestamp = now;
      } else if (
        globalTotalGames > 0 &&
        now - globalTotalGamesTimestamp < CACHE_EXPIRY
      ) {
        // グローバルキャッシュが利用可能なら使用
        estimatedTotalItems = globalTotalGames;
        console.log(`Using global cached total games: ${estimatedTotalItems}`);
      }

      // 値が0または未定義の場合、現在のページと取得したアイテム数から推測
      if (!estimatedTotalPages || estimatedTotalPages <= 0) {
        // 現在取得したアイテム数がページサイズより少ない場合、これが最後のページと仮定
        if (data.games.length < safePageSize) {
          estimatedTotalItems =
            (safePage - 1) * safePageSize + data.games.length;
        } else {
          // 現在のページが満杯なら、少し余裕を持たせる
          const estimatedPages = Math.min(safePage + 1, MAX_SAFE_PAGES);
          estimatedTotalItems = estimatedPages * safePageSize;
        }

        // 最低でも現在のページ数は確保、最大でもMAX_SAFE_PAGES
        estimatedTotalPages = Math.min(
          Math.max(Math.ceil(estimatedTotalItems / safePageSize), safePage),
          MAX_SAFE_PAGES
        );
      } else {
        // APIから返されるページ数も最大値を超えないように
        estimatedTotalPages = Math.min(estimatedTotalPages, MAX_SAFE_PAGES);
        // 総アイテム数も調整
        estimatedTotalItems = Math.min(
          estimatedTotalItems,
          MAX_PAGE_SIZE * MAX_SAFE_PAGES
        );
      }

      console.log(
        `Setting totalItems: ${estimatedTotalItems}, totalPages: ${estimatedTotalPages}`
      );
      setTotalPages(estimatedTotalPages);
      setTotalItems(estimatedTotalItems);

      // キャッシュにデータを保存
      gamesCache[cacheKey] = {
        data: data.games,
        totalPages: estimatedTotalPages,
        totalItems: estimatedTotalItems,
        timestamp: now,
      };

      // 現在のページが総ページ数を超えている場合は、最後のページに移動
      if (currentPage > estimatedTotalPages && estimatedTotalPages > 0) {
        setCurrentPage(estimatedTotalPages);
        updateUrl(estimatedTotalPages, safePageSize, currentSort);
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
  ]);

  // 総レコード数を別途取得する関数
  const fetchTotalCount = useCallback(async () => {
    // グローバルキャッシュをチェック
    const now = Date.now();
    if (
      globalTotalGames > 0 &&
      now - globalTotalGamesTimestamp < CACHE_EXPIRY
    ) {
      console.log(`Using global cached total games count: ${globalTotalGames}`);
      setTotalItems(globalTotalGames);
      setTotalPages(
        Math.min(Math.ceil(globalTotalGames / currentPageSize), MAX_SAFE_PAGES)
      );
      return;
    }

    try {
      // 最も効率的なアプローチとして、最大ページサイズで1回だけ試行
      const size = PAGE_SIZE_OPTIONS[PAGE_SIZE_OPTIONS.length - 1];

      console.log(`Estimating total count with page size ${size}`);
      const data = await fetchGames(1, size, currentSort);

      // ページネーション情報が正しく返されている場合はそれを使用
      if (data.totalItems && data.totalItems > 0) {
        console.log(`Got valid totalItems: ${data.totalItems} from API`);
        // 最大値で制限
        const safeCount = Math.min(
          data.totalItems,
          MAX_PAGE_SIZE * MAX_SAFE_PAGES
        );

        // グローバルキャッシュを更新
        globalTotalGames = safeCount;
        globalTotalGamesTimestamp = now;

        setTotalItems(safeCount);
        setTotalPages(
          Math.min(Math.ceil(safeCount / currentPageSize), MAX_SAFE_PAGES)
        );
        return;
      }

      // アイテム数が最大ページサイズに達していない場合、それが全ての結果であると仮定
      if (data.games.length < size) {
        console.log(
          `Got partial page (${data.games.length} of ${size}), assuming that's the total count`
        );
        const estimatedCount = data.games.length;

        // グローバルキャッシュを更新
        globalTotalGames = estimatedCount;
        globalTotalGamesTimestamp = now;

        setTotalItems(estimatedCount);
        setTotalPages(
          Math.min(Math.ceil(estimatedCount / currentPageSize), MAX_SAFE_PAGES)
        );
        return;
      }

      // それ以外の場合は、3ページ分くらいはあると推測（控えめに）
      console.log(
        `Got full page (${data.games.length} of ${size}), estimating total as 3x page size`
      );
      const estimatedCount = Math.min(size * 3, MAX_PAGE_SIZE * MAX_SAFE_PAGES);

      // グローバルキャッシュを更新
      globalTotalGames = estimatedCount;
      globalTotalGamesTimestamp = now;

      setTotalItems(estimatedCount);
      setTotalPages(
        Math.min(Math.ceil(estimatedCount / currentPageSize), MAX_SAFE_PAGES)
      );
    } catch (error) {
      console.error("Error fetching total count:", error);
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

  // ページサイズが変更されたときの処理
  const handlePageSizeChange = (
    event: React.MouseEvent<HTMLElement>,
    newPageSize: number | null
  ) => {
    if (newPageSize === null) return;
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

  // コンポーネントマウント時に総レコード数を取得
  useEffect(() => {
    // 初回ロードが完了し、総レコード数が少ない場合や推測が必要な場合に実行
    // すでにデータがある場合は再取得不要
    if (
      initialLoadDone &&
      (totalItems <= 0 || totalPages <= 1) &&
      !loading &&
      games.length === 0
    ) {
      fetchTotalCount();
    }
  }, [
    initialLoadDone,
    totalItems,
    totalPages,
    loading,
    fetchTotalCount,
    games.length,
  ]);

  // 現在表示しているアイテムの範囲を計算
  const startItem =
    totalItems > 0 ? (currentPage - 1) * currentPageSize + 1 : 0;
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
