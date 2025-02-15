'use client'

import { useState, useEffect } from 'react'
import Link from "next/link"
import Image from "next/image"
import { getGames, searchGames } from "@/lib/api"
import { Card, CardContent, CardMedia, Typography, Grid, Container, TextField, Button, Box } from "@mui/material"

interface Game {
  id: number;
  bgg_id: string;
  name: string;
  image_url: string;
  min_players: number;
  max_players: number;
  play_time: number;
  average_score: number;
}

export default function GameList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      const results = await searchGames(searchQuery)
      setGames(results)
    } catch (error) {
      console.error('検索エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchInitialGames = async () => {
      setLoading(true);
      try {
        const data = await getGames();
        console.log('取得したゲームデータ:', data);
        setGames(data);
      } catch (error) {
        console.error('初期データ取得エラー:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialGames();
  }, []);

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          ボードゲーム検索
        </Typography>
        
        <form onSubmit={handleSearch}>
          <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
            <TextField
              fullWidth
              label="ゲーム名で検索"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading}
            >
              検索
            </Button>
          </Box>
        </form>

        <Grid container spacing={4}>
          {games.map((game: any) => (
            <Grid item key={game.id} xs={12} sm={6} md={4}>
              <Link href={`/games/${game.bgg_id}`} style={{ textDecoration: 'none' }}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={game.image_url || "/images/placeholder.jpg"}
                    alt={game.name}
                  />
                  <CardContent>
                    <Typography gutterBottom variant="h5" component="h2">
                      {game.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      プレイ人数: {game.min_players}-{game.max_players}人
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      プレイ時間: {game.play_time}分
                    </Typography>
                  </CardContent>
                </Card>
              </Link>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  )
} 