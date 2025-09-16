'use client'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { Chrome, Twitter, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface AuthButtonProps {
  provider: 'google' | 'twitter'
  className?: string
}

export function AuthButton({ provider, className }: AuthButtonProps) {
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const providerConfig = {
    google: {
      icon: Chrome,
      label: 'Googleでログイン',
      action: login.google,
      colors: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600',
    },
    twitter: {
      icon: Twitter,
      label: '𝕏 (Twitter) でログイン',
      action: login.twitter,
      colors: 'bg-black hover:bg-gray-800 text-white border-black',
    },
  }

  const config = providerConfig[provider]
  const Icon = config.icon

  const handleClick = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    try {
      await config.action()
    } catch (error) {
      console.error(`${provider} login error:`, error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      className={`${config.colors} ${className}`}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Icon className="mr-2 h-4 w-4" />
      )}
      {isLoading ? '認証中...' : config.label}
    </Button>
  )
}