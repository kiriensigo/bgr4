'use client'

import { useState, useEffect } from 'react'
import Link from "next/link"
import Image from "next/image"
import { getGames, searchGames } from "@/lib/api"
import { Card, CardContent, CardMedia, Typography, Grid, Container, TextField, Button, Box } from "@mui/material"
import GameCard from "@/components/GameCard"

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

export default function GamesPage() {
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        ボードゲーム一覧
      </Typography>

      <Grid container spacing={3}>
        {games.map((game) => (
          <Grid item xs={12} sm={6} md={4} key={game.id}>
            <GameCard 
              game={game} 
              type="game" 
            />
          </Grid>
        ))}
      </Grid>
    </Container>
  )
} 