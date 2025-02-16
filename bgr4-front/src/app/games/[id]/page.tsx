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
  Chip,
} from '@mui/material'
import Image from 'next/image'
import Link from 'next/link'
import GroupIcon from '@mui/icons-material/Group'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import StarIcon from '@mui/icons-material/Star'
import RateReviewIcon from '@mui/icons-material/RateReview'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import GameCard from '@/components/GameCard'

interface Game {
  id: number;
  bgg_id: string;
  name: string;
  image_url: string;
  min_players: number;
  max_players: number;
  play_time: number;
  bgg_average_score: number;
  local_average_score: number | null;
  reviews: Review[];
}

interface Review {
  id: number;
  user_id: number;
  game_id: string;
  overall_score: number;
  play_time: number;
  rule_complexity: number;
  luck_factor: number;
  interaction: number;
  downtime: number;
  recommended_players: string[];
  mechanics: string[];
  tags: string[];
  custom_tags: string[];
  short_comment: string;
  created_at: string;
}

// レビューの平均点を計算する関数
const calculateAverageScores = (reviews: Review[]) => {
  if (!reviews || reviews.length === 0) return null;
  
  return {
    rule_complexity: reviews.reduce((sum, r) => sum + r.rule_complexity, 0) / reviews.length,
    luck_factor: reviews.reduce((sum, r) => sum + r.luck_factor, 0) / reviews.length,
    interaction: reviews.reduce((sum, r) => sum + r.interaction, 0) / reviews.length,
    downtime: reviews.reduce((sum, r) => sum + r.downtime, 0) / reviews.length,
  };
};

// 人気のタグを集計する関数
const getPopularTags = (reviews: Review[]) => {
  if (!reviews || reviews.length === 0) return [];
  
  const tagCount = new Map<string, number>();
  reviews.forEach(review => {
    [...review.tags, ...review.custom_tags].forEach(tag => {
      tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
    });
  });
  
  return Array.from(tagCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);
};

export default function GamePage({ params }: { params: { id: string } }) {
  const [game, setGame] = useState<Game | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGameData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getGame(params.id);
        console.log('Fetched game data:', data);
        console.log('local_average_score type:', typeof data.local_average_score);
        setGame(data);
      } catch (err) {
        console.error('Error fetching game:', err);
        setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [params.id]);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Container>
    )
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'error.light' }}>
          <Typography color="error" variant="h6">
            {error}
          </Typography>
        </Paper>
      </Container>
    )
  }

  if (!game) {
    return (
      <Container sx={{ py: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>
            ゲームが見つかりませんでした
          </Typography>
        </Paper>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Image
              src={game.image_url}
              alt={game.name}
              width={500}
              height={500}
              style={{ width: '100%', height: 'auto' }}
            />
          </Grid>
          <Grid item xs={12} md={8}>
            <Typography variant="h4" component="h1" gutterBottom>
              {game.name}
            </Typography>
            
            {/* BGGリンク */}
            <Button
              variant="outlined"
              color="primary"
              href={`https://boardgamegeek.com/boardgame/${game.bgg_id}`}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<OpenInNewIcon />}
              sx={{ mb: 2 }}
            >
              Board Game Geekで詳細を見る
            </Button>

            {/* 評価スコア */}
            <Box sx={{ display: 'flex', gap: 4, mb: 3 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  BGGでの評価
                </Typography>
                <Typography variant="h6">
                  {game.bgg_average_score.toFixed(1)} / 10
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  当サイトでの評価
                </Typography>
                <Typography variant="h6">
                  {game.local_average_score !== null ? 
                    `${Number(game.local_average_score).toFixed(1)} / 10` : 
                    '未評価'}
                </Typography>
              </Box>
            </Box>

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
                        平均スコア: {game.local_average_score !== null ? 
                          Number(game.local_average_score).toFixed(1) : 
                          '未評価'}
                      </Typography>
                      <Rating 
                        value={game.local_average_score !== null ? 
                          Number(game.local_average_score) / 2 : 
                          0} 
                        precision={0.5} 
                        readOnly 
                        size="small"
                      />
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* 人気のタグを追加 */}
            {game.reviews && game.reviews.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  人気のタグ
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {getPopularTags(game.reviews).map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* レビューの平均点を追加 */}
            {game.reviews && game.reviews.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  レビュー評価の平均
                </Typography>
                <Grid container spacing={2}>
                  {Object.entries(calculateAverageScores(game.reviews) || {}).map(([key, value]) => (
                    <Grid item xs={6} sm={3} key={key}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {key === 'rule_complexity' ? 'ルールの複雑さ' :
                         key === 'luck_factor' ? '運要素' :
                         key === 'interaction' ? '相互作用' :
                         'ダウンタイム'}
                      </Typography>
                      <Typography variant="body1">
                        {value.toFixed(1)}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            <Divider sx={{ my: 4 }} />

            {/* レビューセクション */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  レビュー
                </Typography>
                <Link href={`/games/${game.bgg_id}/review`} style={{ textDecoration: 'none' }}>
                  <Button
                    variant="outlined"
                    startIcon={<RateReviewIcon />}
                    size="small"
                  >
                    レビューを書く
                  </Button>
                </Link>
              </Box>
              
              {game.reviews && game.reviews.length > 0 ? (
                <Grid container spacing={3}>
                  {game.reviews.map((review) => (
                    <Grid item xs={12} sm={6} md={4} key={review.id}>
                      <GameCard 
                        game={game}
                        review={review}
                        type="review"
                      />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
                  <Typography variant="body1" color="text.secondary">
                    まだレビューがありません。最初のレビューを書いてみませんか？
                  </Typography>
                </Paper>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  )
} 