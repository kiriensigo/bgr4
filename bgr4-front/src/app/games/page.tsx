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
} from "@mui/material";
import GameCard from "@/components/GameCard";
import SearchPagination from "@/components/SearchPagination";
import { containerStyle, LAYOUT_CONFIG } from "@/styles/layout";
import { useRouter, useSearchParams } from "next/navigation";

// APIから取得するゲームの型を拡張
interface Game extends APIGame {
  created_at?: string;
  updated_at?: string;
}

// 1ページあたりの表示件数
const PAGE_SIZE_OPTIONS = [12, 24, 36];
const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0];

export default function GamesPage() {
  // URLからクエリパラメータを取得
  const searchParams = useSearchParams();
  const router = useRouter();

  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // URLからページネーション情報を取得
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const initialPageSize = parseInt(
    searchParams.get("pageSize") || String(DEFAULT_PAGE_SIZE),
    10
  );

  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalPages, setTotalPages] = useState(1);

  // ゲーム一覧を取得
  useEffect(() => {
    const fetchGames = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getGames();
        console.log("Games data:", data);

        // APIからの順序をそのまま使用（すでにcreated_at DESCでソートされている）
        setGames(data);
        setTotalPages(Math.ceil(data.length / pageSize));
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
  }, []);

  // ページサイズが変更されたときに総ページ数を再計算
  useEffect(() => {
    setTotalPages(Math.ceil(games.length / pageSize));
    // 現在のページが新しい総ページ数を超えている場合は、最後のページに設定
    if (page > Math.ceil(games.length / pageSize)) {
      setPage(Math.ceil(games.length / pageSize) || 1);
    }
  }, [pageSize, games.length, page]);

  // URLを更新する関数
  const updateUrl = (newPage: number, newPageSize: number) => {
    const params = new URLSearchParams();
    params.set("page", newPage.toString());
    params.set("pageSize", newPageSize.toString());
    router.push(`/games?${params.toString()}`, { scroll: false });
  };

  // ページ変更ハンドラー
  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPage(value);
    updateUrl(value, pageSize);
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
      updateUrl(1, newPageSize);
      // 画面上部にスクロール
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // 現在のページに表示するゲーム
  const paginatedGames = games.slice((page - 1) * pageSize, page * pageSize);

  // 現在のページの表示範囲を計算
  const currentPageStart = games.length > 0 ? (page - 1) * pageSize + 1 : 0;
  const currentPageEnd = Math.min(page * pageSize, games.length);

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

        {/* 表示件数とページネーション */}
        <SearchPagination
          count={totalPages}
          page={page}
          onChange={handlePageChange}
          size="medium"
          totalItems={games.length}
          currentPageStart={currentPageStart}
          currentPageEnd={currentPageEnd}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          onPageSizeChange={handlePageSizeChange}
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
                <GameCard game={game} type="game" />
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
          />
        </Box>
      </Box>
    </Container>
  );
}
