"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Container, Typography, Box } from "@mui/material";
import SearchForm from "@/components/SearchForm";
import {
  searchGames,
  getGames,
  searchGamesByPublisher,
  searchGamesByDesigner,
  GamesResponse,
} from "@/lib/api";
import ErrorDisplay from "@/components/ErrorDisplay";
import NoResults from "@/components/NoResults";
import UnifiedGameList from "@/components/ui/GameList/UnifiedGameList";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("query") || "";
  const publisher = searchParams.get("publisher") || "";
  const designer = searchParams.get("designer") || "";

  const [searchTitle, setSearchTitle] = useState("ゲームを検索");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 検索条件に応じて適切なAPIを呼び出す関数
  const fetchGames = async (
    page: number,
    pageSize: number,
    sortBy: string
  ): Promise<GamesResponse> => {
    try {
      if (query) {
        // キーワード検索の場合
        setSearchTitle(`"${query}" の検索結果`);
        const results = await searchGames({
          keyword: query,
          page,
          per_page: pageSize,
          sort_by: sortBy,
        });
        return results;
      } else if (publisher) {
        // 出版社検索の場合
        setSearchTitle(`出版社: "${publisher}" のゲーム`);
        return await searchGamesByPublisher(publisher, page, pageSize, sortBy);
      } else if (designer) {
        // デザイナー検索の場合
        setSearchTitle(`デザイナー: "${designer}" のゲーム`);
        return await searchGamesByDesigner(designer, page, pageSize, sortBy);
      } else {
        // 検索条件がない場合は最近登録されたゲームを表示
        setSearchTitle("最近登録されたゲーム");
        return await getGames(page, pageSize, sortBy);
      }
    } catch (err) {
      console.error("Error fetching games:", err);
      throw new Error("ゲーム情報の取得に失敗しました。");
    }
  };

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {searchTitle}
        </Typography>
        <SearchForm initialQuery={query} />
        <ErrorDisplay message={error} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {searchTitle}
      </Typography>

      <SearchForm initialQuery={query} />

      <Box sx={{ mt: 4 }}>
        <UnifiedGameList
          title=""
          fetchGames={fetchGames}
          showTitle={false}
          showSort={true}
          emptyMessage={`"${
            query || publisher || designer
          }" に一致するゲームが見つかりませんでした`}
          gridItemProps={{ xs: 12, sm: 6, md: 4, lg: 3 }}
        />
      </Box>
    </Container>
  );
}
