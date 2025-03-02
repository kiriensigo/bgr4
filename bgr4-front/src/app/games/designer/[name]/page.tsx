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

export default function DesignerPage() {
  const params = useParams();
  const designerName = decodeURIComponent(params.name as string);

  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGames = async () => {
      setLoading(true);
      setError(null);

      try {
        const results = await searchGamesByDesigner(designerName);
        setGames(results);
      } catch (err) {
        console.error("Error fetching games:", err);
        setError("デザイナーのゲーム情報の取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };

    if (designerName) {
      fetchGames();
    }
  }, [designerName]);

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

      {error && <ErrorDisplay message={error} />}

      {!loading && games.length === 0 && !error && (
        <NoResults searchTerm={designerName} />
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
                  <GameCard game={game} type="game" />
                </Grid>
              ))}
        </Grid>
      </Box>
    </Container>
  );
}
