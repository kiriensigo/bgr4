"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Chip,
  Tooltip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { searchGames } from "@/lib/api";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import GroupIcon from "@mui/icons-material/Group";
import ShareIcon from "@mui/icons-material/Share";
import SortIcon from "@mui/icons-material/Sort";
import Link from "next/link";
import { containerStyle, cardStyle, LAYOUT_CONFIG } from "@/styles/layout";
import SearchPagination from "@/components/SearchPagination";
import GameCard from "@/components/GameCard";

// 表示件数のオプション
const PAGE_SIZE_OPTIONS = [12, 24, 36, 48, 60, 72];
const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0];

// ソートオプション
export const SORT_OPTIONS = [
  { value: "review_date", label: "レビュー新着順" },
  { value: "reviews_count", label: "レビュー投稿数順" },
  { value: "average_score", label: "総合得点順" },
  { value: "created_at", label: "ゲーム登録順" },
];

// 数値を安全にフォーマットする関数
const formatNumber = (value: any, decimals = 1): string => {
  if (value === null || value === undefined) return "0";
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num) ? "0" : num.toFixed(decimals);
};

// 人数別のおすすめ表示
const renderRecommendedPlayers = (counts: any[]) => {
  if (!counts || !Array.isArray(counts) || counts.length === 0) return null;

  return counts.map((count, index) => {
    // 表示テキストを決定
    let displayText = "";
    let countValue = "";

    // countオブジェクトからcountプロパティを取得
    if (typeof count === "object" && count !== null) {
      countValue = count.count || count.name || "";
    } else {
      countValue = count;
    }

    // 7の場合は「7人以上」と表示
    if (countValue === "7") {
      displayText = "7人以上";
    } else {
      displayText = `${countValue}人`;
    }

    return (
      <Chip
        key={`player-${index}-${countValue}`}
        label={displayText}
        size="small"
        color="primary"
        variant="outlined"
        sx={{ mr: 0.5, mb: 0.5 }}
      />
    );
  });
};

export default function SearchResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchCriteria, setSearchCriteria] = useState<Record<string, string>>(
    {}
  );
  const [copied, setCopied] = useState(false);

  // ページネーション用の状態
  const urlPage = parseInt(searchParams.get("page") || "1", 10);
  const urlPageSize = parseInt(
    searchParams.get("pageSize") || String(DEFAULT_PAGE_SIZE),
    10
  );
  const urlSortBy = searchParams.get("sortBy") || SORT_OPTIONS[0].value;

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

      // 検索モード設定のパラメータを保持
      if (params.has("use_reviews_mechanics")) {
        params.set(
          "use_reviews_mechanics",
          params.get("use_reviews_mechanics") || ""
        );
      }
      if (params.has("use_reviews_categories")) {
        params.set(
          "use_reviews_categories",
          params.get("use_reviews_categories") || ""
        );
      }
      if (params.has("use_reviews_recommended_players")) {
        params.set(
          "use_reviews_recommended_players",
          params.get("use_reviews_recommended_players") || ""
        );
      }

      router.push(`/search/results?${params.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  // URLパラメータから検索条件を取得して検索を実行
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError(null);

      try {
        // URLパラメータを取得
        const params: Record<string, string> = {};
        searchParams.forEach((value, key) => {
          params[key] = value;
        });

        // 検索条件を保存（表示用）
        setSearchCriteria(params);

        // 配列パラメータを処理
        const apiParams: any = { ...params };
        if (params.mechanics) apiParams.mechanics = params.mechanics.split(",");
        if (params.categories)
          apiParams.categories = params.categories.split(",");
        if (params.recommended_players)
          apiParams.recommended_players = params.recommended_players.split(",");

        // AND検索フラグを処理
        if (params.categories_match_all)
          apiParams.categories_match_all = params.categories_match_all;
        if (params.mechanics_match_all)
          apiParams.mechanics_match_all = params.mechanics_match_all;
        if (params.recommended_players_match_all)
          apiParams.recommended_players_match_all =
            params.recommended_players_match_all;

        // 数値パラメータを処理
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
          if (apiParams[key]) apiParams[key] = Number(apiParams[key]);
        });

        // ページネーションとソートのパラメータを設定
        apiParams.page = page;
        apiParams.per_page = pageSize;
        apiParams.sort_by = sortBy;

        console.log("検索パラメータ:", apiParams);
        const response = await searchGames(apiParams);

        // APIレスポンスからデータを設定
        setSearchResults(response.games);
        setTotalItems(response.pagination.total_count);
        setTotalPages(response.pagination.total_pages);

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
            router.push(`/search/results?${params.toString()}`, {
              scroll: false,
            });
          }
        }

        // 現在のページが総ページ数を超えている場合は、最後のページに移動
        if (
          page > response.pagination.total_pages &&
          response.pagination.total_pages > 0
        ) {
          console.log(
            `ページ番号(${page})が総ページ数(${response.pagination.total_pages})を超えています。最後のページに移動します。`
          );
          setPage(response.pagination.total_pages);
          updateUrl(response.pagination.total_pages, pageSize, sortBy);
          return; // 再度useEffectが実行されるので、ここで終了
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "検索結果の取得中にエラーが発生しました"
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

    fetchResults();
  }, [page, pageSize, sortBy, searchParams, updateUrl]);

  // 現在のページの表示範囲を計算
  const currentPageStart =
    searchResults.length > 0 ? (page - 1) * pageSize + 1 : 0;
  const currentPageEnd = Math.min(page * pageSize, totalItems);

  // ページが変わったときにスクロールを上部に戻す
  useEffect(() => {
    if (!loading) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [page, loading]);

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
      setPage(newPage);
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

  // 検索条件の表示用テキストを生成
  const getSearchCriteriaText = () => {
    const criteriaTexts = [];

    if (searchCriteria.keyword) {
      criteriaTexts.push(`キーワード: ${searchCriteria.keyword}`);
    }

    if (searchCriteria.min_players || searchCriteria.max_players) {
      const minPlayers = searchCriteria.min_players || "指定なし";
      const maxPlayers = searchCriteria.max_players || "指定なし";
      criteriaTexts.push(`プレイ人数: ${minPlayers}〜${maxPlayers}人`);
    }

    return criteriaTexts.length > 0
      ? criteriaTexts.join(", ")
      : "すべてのゲーム";
  };

  return (
    <Container maxWidth={false}>
      <Box sx={containerStyle}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
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

        <Typography variant="h4" component="h1" gutterBottom>
          検索結果
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ mb: 3 }}>
          検索条件: {getSearchCriteriaText()}
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : searchResults.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            検索条件に一致するゲームが見つかりませんでした。条件を変更して再度お試しください。
          </Alert>
        ) : (
          <>
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
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageSizeChange={handlePageSizeChange}
              showIfSinglePage={true}
            />

            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={LAYOUT_CONFIG.gridSpacing}>
              {searchResults.map((game) => (
                <Grid item key={game.id} xs={12} sm={6} md={4} lg={3}>
                  <GameCard
                    game={{
                      ...game,
                      id:
                        typeof game.id === "number" ? String(game.id) : game.id,
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

            {totalPages > 1 && (
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
            )}
          </>
        )}
      </Box>
    </Container>
  );
}
