'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { fetchBGGData, parseXMLResponse } from '@/lib/bggApi'
import { postReview } from '@/lib/api'
import { FlashMessage } from '@/components/FlashMessage'
import {
  Container,
  Typography,
  Box,
  Paper,
  Slider,
  Checkbox,
  FormControlLabel,
  TextField,
  Button,
  Grid,
  FormGroup,
  Divider,
  CircularProgress,
  Chip,
} from '@mui/material'

interface GameDetails {
  id: string
  name: string
  image: string
  bggLink: string
  amazonLink: string
  rakutenLink: string
}

const MECHANICS = [
  "オークション", "ダイスロール", "タイル/カード配置", "ブラフ",
  "エリアマジョリティ", "ワーカープレイスメント", "正体隠匿系",
  "モジュラーボード", "チキンレース", "ドラフト",
  "デッキ/バッグビルディング", "トリックテイキング", "拡大再生産"
]

const TAGS = [
  "子どもと大人が遊べる", "子どもにおすすめ", "大人におすすめ",
  "二人におすすめ", "ソロにおすすめ", "デザイン性が高い",
  "リプレイ性が高い", "パーティ向き", "謎解き", "チーム戦",
  "協力", "パズル", "レガシー（ストーリー）", "動物"
]

export default function ReviewPage({ params }: { params: { id: string } }) {
  const [game, setGame] = useState<GameDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [flashMessage, setFlashMessage] = useState<string | null>(null)
  const router = useRouter()

  const [review, setReview] = useState({
    overallScore: 5,
    playTime: 3,
    ruleComplexity: 3,
    luckFactor: 3,
    interaction: 3,
    downtime: 3,
    recommendedPlayers: [] as string[],
    mechanics: [] as string[],
    tags: [] as string[],
    customTags: '',
    shortComment: '',
  })

  const playTimeMarks = [
    { value: 1, label: '30分以内' },
    { value: 2, label: '60分' },
    { value: 3, label: '90分' },
    { value: 4, label: '120分' },
    { value: 5, label: '120分以上' }
  ]

  useEffect(() => {
    async function fetchGameDetails() {
      try {
        const data = await fetchBGGData(`thing?id=${params.id}&stats=1`)
        const doc = parseXMLResponse(data)
        const item = doc.getElementsByTagName('item')[0]

        if (!item) {
          throw new Error('ゲームが見つかりませんでした')
        }

        const name = item.querySelector('name[type="primary"]')?.getAttribute('value') || ''
        
        setGame({
          id: params.id,
          name: name,
          image: item.querySelector('image')?.textContent || '/placeholder.svg',
          bggLink: `https://boardgamegeek.com/boardgame/${params.id}`,
          amazonLink: `https://www.amazon.co.jp/s?k=${encodeURIComponent(name)}+ボードゲーム`,
          rakutenLink: `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(name)}+ボードゲーム/`,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました')
      } finally {
        setLoading(false)
      }
    }

    fetchGameDetails()
  }, [params.id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement> | any) => {
    const { name, value, type, checked } = e.target

    if (name === 'customTags') {
      const normalizedValue = value.replace(/　/g, ' ').replace(/\s+/g, ' ')
      setReview(prev => ({
        ...prev,
        [name]: normalizedValue
      }))
    } else if (type === 'checkbox') {
      setReview(prev => ({
        ...prev,
        [name]: checked
          ? [...prev[name], value]
          : prev[name].filter((item: string) => item !== value)
      }))
    } else {
      setReview(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!review.shortComment.trim()) {
      setFlashMessage('一言コメントは必須です')
      return
    }

    try {
      await postReview(params.id, review)
      setFlashMessage('レビューを投稿しました')
      
      setTimeout(() => {
        router.push(`/games/${params.id}`)
      }, 2000)
    } catch (error) {
      if (error instanceof Error) {
        setFlashMessage(error.message)
      } else {
        setFlashMessage('レビューの投稿に失敗しました')
      }
    }
  }

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (error || !game) {
    return (
      <Container>
        <Typography color="error" align="center" sx={{ py: 8 }}>
          {error || 'ゲームが見つかりませんでした'}
        </Typography>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Link href={`/games/${params.id}`} style={{ textDecoration: 'none' }}>
          <Button variant="outlined" sx={{ mb: 2 }}>
            ← 戻る
          </Button>
        </Link>
        
        <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ position: 'relative', pt: '100%' }}>
                <Image
                  src={game.image}
                  alt={game.name}
                  fill
                  style={{ objectFit: 'contain' }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <Typography variant="h4" component="h1" gutterBottom>
                {game.name}のレビュー
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Link href={game.bggLink} target="_blank">
                  <Typography color="primary">BoardGameGeekで見る</Typography>
                </Link>
                <Link href={game.amazonLink} target="_blank">
                  <Typography color="primary">Amazonで見る</Typography>
                </Link>
                <Link href={game.rakutenLink} target="_blank">
                  <Typography color="primary">楽天で見る</Typography>
                </Link>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        <Paper elevation={3} sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                総合評価: {review.overallScore}
              </Typography>
              <Slider
                name="overallScore"
                value={review.overallScore}
                onChange={handleChange}
                min={0}
                max={10}
                step={0.5}
                marks={[
                  { value: 0, label: '0' },
                  { value: 5, label: '5' },
                  { value: 10, label: '10' }
                ]}
                valueLabelDisplay="auto"
              />
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                プレイ時間: {playTimeMarks.find(mark => mark.value === review.playTime)?.label}
              </Typography>
              <Slider
                name="playTime"
                value={review.playTime}
                onChange={handleChange}
                min={1}
                max={5}
                step={1}
                marks={playTimeMarks}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => playTimeMarks.find(mark => mark.value === value)?.label || ''}
              />
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                ルールの複雑さ: {review.ruleComplexity}
              </Typography>
              <Slider
                name="ruleComplexity"
                value={review.ruleComplexity}
                onChange={handleChange}
                min={1}
                max={5}
                step={0.5}
                marks={[
                  { value: 1, label: '簡単' },
                  { value: 3, label: '普通' },
                  { value: 5, label: '複雑' }
                ]}
                valueLabelDisplay="auto"
              />
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                運要素: {review.luckFactor}
              </Typography>
              <Slider
                name="luckFactor"
                value={review.luckFactor}
                onChange={handleChange}
                min={1}
                max={5}
                step={0.5}
                marks={[
                  { value: 1, label: '低い' },
                  { value: 3, label: '普通' },
                  { value: 5, label: '高い' }
                ]}
                valueLabelDisplay="auto"
              />
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                インタラクション: {review.interaction}
              </Typography>
              <Slider
                name="interaction"
                value={review.interaction}
                onChange={handleChange}
                min={1}
                max={5}
                step={0.5}
                marks={[
                  { value: 1, label: '少ない' },
                  { value: 3, label: '普通' },
                  { value: 5, label: '多い' }
                ]}
                valueLabelDisplay="auto"
              />
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                ダウンタイム: {review.downtime}
              </Typography>
              <Slider
                name="downtime"
                value={review.downtime}
                onChange={handleChange}
                min={1}
                max={5}
                step={0.5}
                marks={[
                  { value: 1, label: '短い' },
                  { value: 3, label: '普通' },
                  { value: 5, label: '長い' }
                ]}
                valueLabelDisplay="auto"
              />
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>おすすめプレイ人数</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {[1, 2, 3, 4, 5, "6人以上"].map((num) => (
                  <Chip
                    key={num}
                    label={`${num}人`}
                    onClick={() => {
                      setReview(prev => ({
                        ...prev,
                        recommendedPlayers: prev.recommendedPlayers.includes(String(num))
                          ? prev.recommendedPlayers.filter(p => p !== String(num))
                          : [...prev.recommendedPlayers, String(num)]
                      }))
                    }}
                    color={review.recommendedPlayers.includes(String(num)) ? "primary" : "default"}
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>
            </Box>

            <Divider sx={{ my: 4 }} />

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>メカニクス</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {MECHANICS.map((mechanic) => (
                  <Chip
                    key={mechanic}
                    label={mechanic}
                    onClick={() => {
                      setReview(prev => ({
                        ...prev,
                        mechanics: prev.mechanics.includes(mechanic)
                          ? prev.mechanics.filter(m => m !== mechanic)
                          : [...prev.mechanics, mechanic]
                      }))
                    }}
                    color={review.mechanics.includes(mechanic) ? "primary" : "default"}
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>タグ</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {TAGS.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onClick={() => {
                      setReview(prev => ({
                        ...prev,
                        tags: prev.tags.includes(tag)
                          ? prev.tags.filter(t => t !== tag)
                          : [...prev.tags, tag]
                      }))
                    }}
                    color={review.tags.includes(tag) ? "primary" : "default"}
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>カスタムタグ</Typography>
              <TextField
                fullWidth
                name="customTags"
                value={review.customTags}
                onChange={handleChange}
                placeholder="スペース区切りでタグを入力（全角スペースも可）"
                helperText="例: 初心者向け 戦略的 テーブルトーク"
              />
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom required>
                一言コメント
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                name="shortComment"
                value={review.shortComment}
                onChange={handleChange}
                placeholder="このゲームの魅力を一言で表現してください（必須）"
                required
              />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                sx={{ minWidth: 200 }}
              >
                レビューを投稿
              </Button>
            </Box>
          </form>
        </Paper>
      </Box>
      
      {flashMessage && (
        <FlashMessage
          message={flashMessage}
          onClose={() => setFlashMessage(null)}
        />
      )}
    </Container>
  )
} 