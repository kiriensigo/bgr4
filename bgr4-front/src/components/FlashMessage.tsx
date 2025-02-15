'use client'

import { useEffect } from 'react'
import { Alert, Snackbar } from '@mui/material'

type FlashMessageProps = {
  message: string
  onClose: () => void
}

export function FlashMessage({ message, onClose }: FlashMessageProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 6000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <Snackbar
      open={!!message}
      autoHideDuration={6000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert onClose={onClose} severity="info" sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  )
} 