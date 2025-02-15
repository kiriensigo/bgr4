'use client'

import { AppBar, Toolbar, Typography, Button, Container, Box } from '@mui/material'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function Header() {
  const { user, signOut } = useAuth()

  return (
    <AppBar position="static" color="default" elevation={0}>
      <Container maxWidth="lg">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Typography variant="h6" color="inherit" noWrap>
              BGReviews
            </Typography>
          </Link>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Link href="/" passHref>
              <Button color="inherit">ホーム</Button>
            </Link>
            <Link href="/reviews" passHref>
              <Button color="inherit">最新レビュー</Button>
            </Link>
            <nav>
              <Link href="/games" style={{ textDecoration: 'none' }}>
                <Button sx={{ mx: 1 }}>ゲーム一覧</Button>
              </Link>
              {user ? (
                <>
                  <Link href="/profile" style={{ textDecoration: 'none' }}>
                    <Button sx={{ mx: 1 }}>プロフィール</Button>
                  </Link>
                  <Button onClick={signOut} sx={{ mx: 1 }}>
                    ログアウト
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login" style={{ textDecoration: 'none' }}>
                    <Button sx={{ mx: 1 }}>ログイン</Button>
                  </Link>
                  <Link href="/signup" style={{ textDecoration: 'none' }}>
                    <Button sx={{ mx: 1 }}>新規登録</Button>
                  </Link>
                </>
              )}
            </nav>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  )
} 