'use client'

import { useEffect, useState } from 'react'
import { getGame } from '@/lib/api'
import { 
  Container, 
  Typography, 
  Grid, 
  Box, 
  Paper, 
  Button,
  Rating,
  Divider,
  CircularProgress,
} from '@mui/material'
import Image from 'next/image'
import Link from 'next/link'
import GroupIcon from '@mui/icons-material/Group'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import StarIcon from '@mui/icons-material/Star'
import RateReviewIcon from '@mui/icons-material/RateReview'

interface Game {
  id: number;
  name: string;
  description: string;
  image_url: string;
  min_players: number;
  max_players: number;
  play_time: number;
  average_score: number;
  reviews: Review[];
}

interface Review {
  id: number;
  user_id: number;
  game_id: string;
  overall_score: number;
  short_comment: string;
  created_at: string;
}

export default function GameDetail({ params }: { params: { id: string } }) {
  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const gameData = await getGame(params.id)
        setGame(gameData)
        setError(null)
      } catch (err) {
        console.error('Error fetching game:', err)
        setError(err instanceof Error ? err.message : 'ゲーム情報の取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id])

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (error || !game) {
    return (
      <Container maxWidth="lg">
        <Typography variant="h5" align="center" color="error" sx={{ my: 4 }}>
          {error || 'ゲームが見つかりませんでした'}
        </Typography>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 4, my: 4 }}>
        <Grid container spacing={4}>
          {/* 左側: 画像とレビューボタン */}
          <Grid item xs={12} md={4}>
            <Box sx={{ 
              position: 'relative', 
              width: '100%', 
              paddingTop: '100%', 
              mb: 2,
              borderRadius: 2,
              overflow: 'hidden'
            }}>
              <Image
                src={game.image_url || '/images/placeholder-game.jpg'}
                alt={game.name}
                fill
                style={{ objectFit: 'cover' }}
              />
            </Box>
            <Link href={`/games/${game.id}/review`} style={{ textDecoration: 'none' }}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                startIcon={<RateReviewIcon />}
                sx={{ mb: 2 }}
              >
                レビューを書く
              </Button>
            </Link>
          </Grid>

          {/* 右側: ゲーム情報 */}
          <Grid item xs={12} md={8}>
            <Typography variant="h4" component="h1" gutterBottom>
              {game.name}
            </Typography>
            
            {/* スコアと基本情報 */}
            <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GroupIcon color="primary" />
                    <Typography>
                      {game.min_players}～{game.max_players}人
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTimeIcon color="primary" />
                    <Typography>
                      {game.play_time}分
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StarIcon color="primary" />
                    <Box>
                      <Typography>
                        平均スコア: {game.average_score}
                      </Typography>
                      <Rating 
                        value={game.average_score / 2} 
                        precision={0.5} 
                        readOnly 
                        size="small"
                      />
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* ゲーム説明 */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                ゲーム説明
              </Typography>
              <Typography variant="body1" paragraph>
                {game.description}
              </Typography>
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* レビューセクション */}
            <Box>
              <Typography variant="h6" gutterBottom>
                レビュー
              </Typography>
              {game.reviews && game.reviews.length > 0 ? (
                game.reviews.map((review) => (
                  <Paper key={review.id} sx={{ p: 3, mb: 2, bgcolor: 'grey.50' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Rating value={review.overall_score / 2} readOnly size="small" />
                      <Typography variant="body2" sx={{ ml: 2, color: 'text.secondary' }}>
                        {new Date(review.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Typography variant="body1">
                      {review.short_comment}
                    </Typography>
                  </Paper>
                ))
              ) : (
                <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
                  <Typography variant="body1" color="text.secondary">
                    まだレビューがありません。最初のレビューを書いてみませんか？
                  </Typography>
                  <Link href={`/games/${game.id}/review`} style={{ textDecoration: 'none' }}>
                    <Button
                      variant="outlined"
                      startIcon={<RateReviewIcon />}
                      sx={{ mt: 2 }}
                    >
                      レビューを書く
                    </Button>
                  </Link>
                </Paper>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  )
} 