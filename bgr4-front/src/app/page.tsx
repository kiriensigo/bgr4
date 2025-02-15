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
            <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box>
                <Link href={`/games/${game.id}`}>
                  <Box 
                    sx={{ 
                      position: 'relative',
                      width: '100%',
                      paddingTop: '100%',
                      mb: 2,
                      overflow: 'hidden',
                      borderRadius: 1
                    }}
                  >
                    {game.thumbnail && (
                      <Image
                        src={game.thumbnail}
                        alt={game.name}
                        fill
                        style={{ 
                          objectFit: 'cover',
                          objectPosition: 'center'
                        }}
                      />
                    )}
                  </Box>
                </Link>
                <Box sx={{ flexGrow: 1 }}>
                  <Link href={`/games/${game.id}`}>
                    <Typography variant="h6" component="h2" gutterBottom noWrap>
                      {game.name}
                    </Typography>
                  </Link>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Rating 
                      value={game.averageRating ? game.averageRating / 2 : 0} 
                      precision={0.5} 
                      readOnly 
                      size="small" 
                    />
                    {game.averageRating && (
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {game.averageRating.toFixed(1)}
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    プレイ人数: {game.minPlayers}-{game.maxPlayers}人
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    プレイ時間: {game.playingTime}分
                  </Typography>
                </Box>
              </Box>
            </Paper>
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
