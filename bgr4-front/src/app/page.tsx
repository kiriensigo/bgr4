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
} from "@mui/material";
import Link from "next/link";
import Image from "next/image";
import type { BGGGame } from "@/lib/bggApi";

export default function Home() {
  const [hotGames, setHotGames] = useState<BGGGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const games = await getHotGames();
        setHotGames(games);
      } catch (error) {
        console.error("Error fetching games:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "60vh",
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 6 }}>
        <Typography
          variant="h3"
          component="h1"
          align="center"
          gutterBottom
          sx={{
            fontWeight: "bold",
            color: "primary.main",
          }}
        >
          人気のボードゲーム
        </Typography>
        <Typography
          variant="h6"
          align="center"
          color="text.secondary"
          sx={{ mb: 6 }}
        >
          BoardGameGeekで注目を集めているゲーム
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {hotGames.slice(0, 12).map((game) => (
          <Grid item key={game.id} xs={12} sm={6} md={4} lg={3}>
            <Link href={`/games/${game.id}`} style={{ textDecoration: "none" }}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 6,
                  },
                }}
              >
                <Box sx={{ position: "relative", pt: "100%" }}>
                  <Image
                    src={game.thumbnail || "/images/placeholder.jpg"}
                    alt={game.name}
                    fill
                    style={{
                      objectFit: "contain",
                      padding: "8px",
                    }}
                  />
                </Box>
                <CardContent>
                  <Typography
                    gutterBottom
                    variant="h6"
                    component="h2"
                    noWrap
                    sx={{
                      fontWeight: "bold",
                      mb: 2,
                    }}
                  >
                    {game.name}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      評価: {game.averageRating.toFixed(1)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      #{game.rank}位
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {game.yearPublished}年 • {game.minPlayers}-
                      {game.maxPlayers}人
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      プレイ時間: {game.playingTime}分
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Link>
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
