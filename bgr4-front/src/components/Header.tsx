'use client'

import { AppBar, Toolbar, Typography, Button, Container } from '@mui/material'
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
              <Link href="/login" style={{ textDecoration: 'none' }}>
                <Button sx={{ mx: 1 }}>ログイン</Button>
              </Link>
            )}
          </nav>
        </Toolbar>
      </Container>
    </AppBar>
  )
} 