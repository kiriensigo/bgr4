'use client'

import { Box, Typography } from '@mui/material'

export default function PlaceholderImage() {
  return (
    <Box
      sx={{
        width: '100%',
        height: '200px',
        backgroundColor: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 1,
      }}
    >
      <Typography variant="body1" color="text.secondary">
        No Image
      </Typography>
    </Box>
  )
} 