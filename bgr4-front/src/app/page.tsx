"use client";

import { useEffect, useState } from "react";
import { getHotGames } from "@/lib/bggApi";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid,
  Container,
  Box,
  CircularProgress,
  Paper,
  Rating,
} from "@mui/material";
import Link from "next/link";
import Image from "next/image";
import type { BGGGame } from "@/lib/bggApi";
import GameCard from "@/components/GameCard";

export default function Home() {
  const [hotGames, setHotGames] = useState<BGGGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const games = await getHotGames();
        setHotGames(games);
      } catch (err) {
        setError('ゲームの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography color="error" align="center" sx={{ py: 8 }}>
          {error}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        人気のボードゲーム
      </Typography>

      <Grid container spacing={3}>
        {hotGames.map((game) => (
          <Grid item xs={12} sm={6} md={4} key={game.id}>
            <GameCard 
              game={{
                id: game.id,
                bgg_id: game.id,
                name: game.name,
                image_url: game.image,
                average_score: game.averageRating,
                min_players: game.minPlayers,
                max_players: game.maxPlayers,
                play_time: game.playingTime
              }} 
              type="game" 
            />
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 6, textAlign: "center" }}>
        <Link href="/games" style={{ textDecoration: "none" }}>
          <Typography
            variant="h6"
            color="primary"
            sx={{
              cursor: "pointer",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            すべてのゲームを見る →
          </Typography>
        </Link>
      </Box>
    </Container>
  );
}
