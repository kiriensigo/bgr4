'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signup } from '@/lib/api'
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Divider,
} from '@mui/material'
import GoogleIcon from '@mui/icons-material/Google'
import TwitterIcon from '@mui/icons-material/Twitter'

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirmation: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (formData.password !== formData.passwordConfirmation) {
      setError('パスワードが一致しません')
      setLoading(false)
      return
    }

    try {
      await signup(formData)
      router.push('/login?message=登録が完了しました。ログインしてください。')
    } catch (error) {
      setError(error instanceof Error ? error.message : '登録に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLogin = (provider: 'google' | 'twitter') => {
    // APIのベースURLを環境変数から取得
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    // 認証URLにリダイレクト
    window.location.href = `${apiUrl}/auth/${provider}`;
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box sx={{ my: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            新規会員登録
          </Typography>

          {/* ソーシャルログインボタン */}
          <Box sx={{ mb: 3 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<GoogleIcon />}
              onClick={() => handleSocialLogin('google')}
              sx={{
                mb: 2,
                color: '#757575',
                borderColor: '#757575',
                '&:hover': {
                  borderColor: '#757575',
                  backgroundColor: 'rgba(117, 117, 117, 0.04)',
                },
              }}
            >
              Googleで登録
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<TwitterIcon />}
              onClick={() => handleSocialLogin('twitter')}
              sx={{
                color: '#1DA1F2',
                borderColor: '#1DA1F2',
                '&:hover': {
                  borderColor: '#1DA1F2',
                  backgroundColor: 'rgba(29, 161, 242, 0.04)',
                },
              }}
            >
              X（Twitter）で登録
            </Button>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              または
            </Typography>
          </Divider>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="ユーザー名"
              name="name"
              value={formData.name}
              onChange={handleChange}
              margin="normal"
              required
              autoFocus
            />

            <TextField
              fullWidth
              label="メールアドレス"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="パスワード"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required
              helperText="8文字以上で、英大文字・小文字・数字をそれぞれ1文字以上含める必要があります"
            />

            <TextField
              fullWidth
              label="パスワード（確認）"
              type="password"
              name="passwordConfirmation"
              value={formData.passwordConfirmation}
              onChange={handleChange}
              margin="normal"
              required
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3 }}
            >
              {loading ? "登録中..." : "登録する"}
            </Button>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                すでにアカウントをお持ちの方は
              </Typography>
              <Link href="/login" style={{ textDecoration: "none" }}>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{
                    mt: 1,
                    mb: 2,
                    textTransform: "none",
                    fontSize: "1rem",
                  }}
                >
                  ログインはこちら
                </Button>
              </Link>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  )
} 