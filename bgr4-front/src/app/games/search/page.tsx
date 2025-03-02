"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Skeleton,
} from "@mui/material";
import GameCard from "@/components/GameCard";
import SearchForm from "@/components/SearchForm";
import {
  searchGames,
  getGames,
  searchGamesByPublisher,
  searchGamesByDesigner,
} from "@/lib/api";
import { Game } from "@/lib/api";
import ErrorDisplay from "@/components/ErrorDisplay";
import NoResults from "@/components/NoResults";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("query") || "";
  const publisher = searchParams.get("publisher") || "";
  const designer = searchParams.get("designer") || "";

  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTitle, setSearchTitle] = useState("ゲームを検索");

  useEffect(() => {
    const fetchGames = async () => {
      setLoading(true);
      setError(null);

      try {
        let results: Game[] = [];

        // 検索条件に応じて適切なAPIを呼び出す
        if (query) {
          results = await searchGames({ keyword: query });
          setSearchTitle(`"${query}" の検索結果`);
        } else if (publisher) {
          results = await searchGamesByPublisher(publisher);
          setSearchTitle(`出版社: "${publisher}" のゲーム`);
        } else if (designer) {
          results = await searchGamesByDesigner(designer);
          setSearchTitle(`デザイナー: "${designer}" のゲーム`);
        } else {
          results = await getGames();
          setSearchTitle("最近登録されたゲーム");
        }

        setGames(results);
      } catch (err) {
        console.error("Error fetching games:", err);
        setError("ゲーム情報の取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [query, publisher, designer]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {searchTitle}
      </Typography>

      <SearchForm initialQuery={query} />

      {error && <ErrorDisplay message={error} />}

      {!loading && games.length === 0 && !error && (
        <NoResults searchTerm={query || publisher || designer} />
      )}

      <Box sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          {loading
            ? Array.from(new Array(8)).map((_, index) => (
                <Grid item key={index} xs={12} sm={6} md={4} lg={3}>
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
              ))
            : games.map((game) => (
                <Grid item key={game.id} xs={12} sm={6} md={4} lg={3}>
                  <GameCard game={game} />
                </Grid>
              ))}
        </Grid>
      </Box>
    </Container>
  );
}
