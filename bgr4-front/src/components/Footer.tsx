'use client'

import { Box, Container, Typography, Link as MuiLink } from '@mui/material'

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[200]
            : theme.palette.grey[800],
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="body2" color="text.secondary" align="center">
          {'© '}
          {new Date().getFullYear()}
          {' '}
          <MuiLink
            color="inherit"
            href="https://boardgamegeek.com/"
            target="_blank"
            rel="noopener"
          >
            Powered by BoardGameGeek
          </MuiLink>
        </Typography>
      </Container>
    </Box>
  )
} 