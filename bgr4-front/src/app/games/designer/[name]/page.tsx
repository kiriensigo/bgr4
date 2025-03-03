"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Skeleton,
  Breadcrumbs,
} from "@mui/material";
import Link from "next/link";
import GameCard from "@/components/GameCard";
import { searchGamesByDesigner } from "@/lib/api";
import { Game } from "@/lib/api";
import ErrorDisplay from "@/components/ErrorDisplay";
import NoResults from "@/components/NoResults";
import SearchPagination from "@/components/SearchPagination";

export default function DesignerPage() {
  const params = useParams();
  const designerName = decodeURIComponent(params.name as string);

  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [sortBy, setSortBy] = useState("review_date");
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const fetchGames = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await searchGamesByDesigner(
          designerName,
          page,
          pageSize,
          sortBy
        );
        setGames(response.games);
        setTotalPages(response.pagination.total_pages);
        setTotalItems(response.pagination.total_count);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching games by designer:", error);
        setError(
          error instanceof Error
            ? error.message
            : "デザイナーによるゲームの検索に失敗しました"
        );
        setLoading(false);
      }
    };

    if (designerName) {
      fetchGames();
    }
  }, [designerName, page, pageSize, sortBy]);

  // 現在のページの表示範囲を計算
  const currentPageStart = games.length > 0 ? (page - 1) * pageSize + 1 : 0;
  const currentPageEnd =
    games.length > 0
      ? Math.min(currentPageStart + games.length - 1, totalItems)
      : 0;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
          ホーム
        </Link>
        <Link
          href="/games"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          ゲーム一覧
        </Link>
        <Typography color="text.primary">デザイナー: {designerName}</Typography>
      </Breadcrumbs>

      <Typography variant="h4" component="h1" gutterBottom>
        デザイナー: {designerName} のゲーム
      </Typography>

      {/* ローディング表示 */}
      {loading && (
        <Box sx={{ mt: 4 }}>
          <Grid container spacing={3}>
            {Array.from(new Array(8)).map((_, index) => (
              <Grid item key={index} xs={12} sm={6} md={4}>
                <Paper
                  sx={{
                    p: 2,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Skeleton variant="rectangular" height={200} />
                  <Skeleton height={30} sx={{ mt: 1 }} />
                  <Skeleton height={20} width="60%" />
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* エラー表示 */}
      {error && <ErrorDisplay message={error} />}

      {/* ゲーム一覧 */}
      {!loading && games.length > 0 ? (
        <>
          {/* ページネーション（上部） */}
          <Box sx={{ mb: 3 }}>
            <SearchPagination
              count={totalPages}
              page={page}
              onChange={(e, value) => setPage(value)}
              size="medium"
              totalItems={totalItems}
              currentPageStart={currentPageStart}
              currentPageEnd={currentPageEnd}
              pageSize={pageSize}
              onPageSizeChange={(e, size) => size && setPageSize(size)}
              showIfSinglePage={true}
            />
          </Box>

          <Grid container spacing={3}>
            {games.map((game) => (
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

          {/* ページネーション（下部） */}
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <SearchPagination
              count={totalPages}
              page={page}
              onChange={(e, value) => setPage(value)}
              size="large"
              showPageSizeSelector={false}
              showIfSinglePage={true}
            />
          </Box>
        </>
      ) : (
        <NoResults searchTerm={designerName} />
      )}
    </Container>
  );
}
