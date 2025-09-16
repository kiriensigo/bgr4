'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Heart, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

interface WishlistButtonProps {
  gameId: number
  gameName: string
  className?: string
  showText?: boolean
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function WishlistButton({ 
  gameId, 
  gameName, 
  className = '', 
  showText = false,
  variant = 'ghost',
  size = 'icon'
}: WishlistButtonProps) {
  const { user } = useAuth()
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)

  // ウィッシュリスト状態を確認
  useEffect(() => {
    if (user && gameId) {
      checkWishlistStatus()
    } else {
      setCheckingStatus(false)
    }
  }, [user, gameId])

  const checkWishlistStatus = async () => {
    try {
      const response = await fetch(`/api/wishlist/check?gameId=${gameId}`)
      const data = await response.json()
      
      if (data.success) {
        setIsInWishlist(data.inWishlist)
      }
    } catch (error) {
      console.error('Failed to check wishlist status:', error)
    } finally {
      setCheckingStatus(false)
    }
  }

  const handleWishlistToggle = async () => {
    if (!user) {
      toast.error('ログインが必要です')
      return
    }

    setLoading(true)
    
    try {
      if (isInWishlist) {
        // ウィッシュリストから削除
        const response = await fetch('/api/wishlist', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ gameId })
        })
        
        const data = await response.json()
        
        if (data.success) {
          setIsInWishlist(false)
          toast.success(`${gameName}をウィッシュリストから削除しました`)
        } else {
          throw new Error(data.message || 'Failed to remove from wishlist')
        }
      } else {
        // ウィッシュリストに追加
        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ gameId })
        })
        
        const data = await response.json()
        
        if (data.success) {
          setIsInWishlist(true)
          toast.success(`${gameName}をウィッシュリストに追加しました`)
        } else if (response.status === 409) {
          // 既に追加済み
          setIsInWishlist(true)
          toast.info('このゲームは既にウィッシュリストに追加されています')
        } else {
          throw new Error(data.message || 'Failed to add to wishlist')
        }
      }
    } catch (error) {
      console.error('Wishlist toggle error:', error)
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'ウィッシュリストの更新に失敗しました'
      )
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  if (checkingStatus) {
    return (
      <Button 
        variant={variant} 
        size={size} 
        disabled 
        className={className}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        {showText && <span className="ml-2">確認中...</span>}
      </Button>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleWishlistToggle}
      disabled={loading}
      className={`${className} ${
        isInWishlist ? 'text-red-600 hover:text-red-700' : 'text-gray-500 hover:text-red-600'
      }`}
      title={isInWishlist ? 'ウィッシュリストから削除' : 'ウィッシュリストに追加'}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart 
          className={`h-4 w-4 ${isInWishlist ? 'fill-current' : ''}`} 
        />
      )}
      {showText && (
        <span className="ml-2">
          {isInWishlist ? 'お気に入り済み' : 'お気に入りに追加'}
        </span>
      )}
    </Button>
  )
}