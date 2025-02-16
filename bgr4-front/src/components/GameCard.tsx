'use client'

import { Box, Paper, Typography, Rating } from '@mui/material'
import Image from 'next/image'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface Game {
  id?: string;
  bgg_id?: string;
  name: string;
  image_url?: string;
  thumbnail?: string;
  averageRating?: number;
  average_score?: number;
  minPlayers?: number;
  maxPlayers?: number;
  min_players?: number;
  max_players?: number;
  playingTime?: number;
  play_time?: number;
}

interface Review {
  user?: {
    name: string;
  };
  overall_score?: number;
  short_comment?: string;
  created_at?: string;
}

interface GameCardProps {
  game: Game;
  review?: Review;
  type: 'game' | 'review';
}

export default function GameCard({ game, review, type }: GameCardProps) {
  const imageUrl = game.image_url || game.thumbnail || '/images/no-image.png'
  const rating = type === 'review' ? review?.overall_score : (game.averageRating || game.average_score)
  const players = `${game.minPlayers || game.min_players || '?'}〜${game.maxPlayers || game.max_players || '?'}人`
  const playTime = `${game.playingTime || game.play_time || '?'}分`
  const linkHref = `/games/${game.bgg_id || game.id}`

  return (
    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box>
        <Link href={linkHref}>
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
            {imageUrl && (
              <Image
                src={imageUrl}
                alt={game.name}
                fill
                sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
                priority={type === 'game'}
                style={{ 
                  objectFit: 'cover',
                  objectPosition: 'center'
                }}
              />
            )}
          </Box>
        </Link>
        <Box sx={{ flexGrow: 1 }}>
          <Link href={linkHref}>
            <Typography variant="h6" component="h2" gutterBottom noWrap>
              {game.name}
            </Typography>
          </Link>

          {type === 'review' && review && (
            <>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                レビュアー: {review.user?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                投稿日: {review.created_at && formatDate(review.created_at)}
              </Typography>
            </>
          )}

          {typeof rating === 'number' && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Rating 
                value={rating / 2} 
                precision={0.5} 
                readOnly 
                size="small" 
              />
              <Typography variant="body2" sx={{ ml: 1 }}>
                {rating.toFixed(1)}
              </Typography>
            </Box>
          )}

          {type === 'game' && (
            <>
              <Typography variant="body2" color="text.secondary">
                プレイ人数: {players}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                プレイ時間: {playTime}
              </Typography>
            </>
          )}

          {type === 'review' && review?.short_comment && (
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
          )}
        </Box>
      </Box>
    </Paper>
  )
} 