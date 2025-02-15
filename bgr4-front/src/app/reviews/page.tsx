'use client'

import { useEffect, useState } from 'react'
import { Container, Typography, Box, Paper, Grid, CircularProgress, Rating } from '@mui/material'
import { getAllReviews } from '@/lib/api'
import Link from 'next/link'
import Image from 'next/image'
import { formatDate } from '@/lib/utils'

interface Game {
  id: string;
  bgg_id: string;
  name: string;
  image_url: string;
}

interface Review {
  id: number;
  user: {
    name: string;
  };
  game: Game;
  overall_score: number;
  short_comment: string;
  created_at: string;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await getAllReviews()
        console.log('Fetched reviews:', data)  // デバッグ用
        
        if (!Array.isArray(data)) {
          console.error('Received data is not an array:', data)
          setError('データの形式が正しくありません')
          return
        }

        const validReviews = data.filter(review => {
          const isValid = review && review.game && review.game.bgg_id
          if (!isValid) {
            console.log('Invalid review:', review)
          }
          return isValid
        })

        console.log('Valid reviews:', validReviews)
        setReviews(validReviews)
      } catch (err) {
        console.error('Error fetching reviews:', err)
        setError('レビューの取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [])

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (error) {
    return (
      <Container>
        <Typography color="error" align="center" sx={{ py: 8 }}>
          {error}
        </Typography>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        最新のレビュー
      </Typography>

      <Grid container spacing={3}>
        {reviews.map((review) => (
          <Grid item xs={12} sm={6} md={4} key={review.id}>
            <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
              {review.game && (
                <Box>
                  <Link href={`/games/${review.game.bgg_id}`}>
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
                      {review.game.image_url && (
                        <Image
                          src={review.game.image_url}
                          alt={review.game.name}
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
                    <Link href={`/games/${review.game.bgg_id}`}>
                      <Typography variant="h6" component="h2" gutterBottom noWrap>
                        {review.game.name}
                      </Typography>
                    </Link>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      レビュアー: {review.user.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      投稿日: {formatDate(review.created_at)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Rating value={review.overall_score / 2} precision={0.5} readOnly size="small" />
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {review.overall_score}
                      </Typography>
                    </Box>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {review.short_comment}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  )
} 