'use client'

import { useState } from 'react'
import { Heart, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useReviewLikes } from '@/hooks/useReviewLikes'

interface ReviewLikeButtonProps {
  reviewId: number
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  showCount?: boolean
  className?: string
}

export function ReviewLikeButton({ 
  reviewId, 
  variant = 'ghost',
  size = 'default',
  showCount = true,
  className 
}: ReviewLikeButtonProps) {
  const { likesCount, isLiked, loading, toggleLike } = useReviewLikes(reviewId)
  const [isToggling, setIsToggling] = useState(false)

  const handleToggleLike = async () => {
    if (isToggling || loading) return
    
    setIsToggling(true)
    await toggleLike()
    setIsToggling(false)
  }

  if (loading) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        className={cn('gap-2', className)}
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        {showCount && <span>-</span>}
      </Button>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggleLike}
      disabled={isToggling}
      className={cn(
        'gap-2 transition-colors',
        isLiked && 'text-red-500 hover:text-red-600',
        className
      )}
    >
      {isToggling ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Heart 
          className={cn(
            'w-4 h-4 transition-all',
            isLiked && 'fill-current text-red-500'
          )} 
        />
      )}
      {showCount && (
        <span className={cn(
          'transition-colors',
          isLiked && 'text-red-500'
        )}>
          {likesCount}
        </span>
      )}
    </Button>
  )
}

interface ReviewLikeButtonSimpleProps {
  reviewId: number
  className?: string
}

export function ReviewLikeButtonSimple({ reviewId, className }: ReviewLikeButtonSimpleProps) {
  const { likesCount, isLiked, loading, toggleLike } = useReviewLikes(reviewId)
  const [isToggling, setIsToggling] = useState(false)

  const handleToggleLike = async () => {
    if (isToggling || loading) return
    
    setIsToggling(true)
    await toggleLike()
    setIsToggling(false)
  }

  if (loading) {
    return (
      <button 
        disabled
        className={cn(
          'inline-flex items-center gap-1 text-sm text-muted-foreground cursor-not-allowed',
          className
        )}
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>-</span>
      </button>
    )
  }

  return (
    <button
      onClick={handleToggleLike}
      disabled={isToggling}
      className={cn(
        'inline-flex items-center gap-1 text-sm transition-colors hover:text-red-500',
        isLiked ? 'text-red-500' : 'text-muted-foreground',
        isToggling && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      {isToggling ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Heart 
          className={cn(
            'w-4 h-4 transition-all',
            isLiked && 'fill-current'
          )} 
        />
      )}
      <span>{likesCount}</span>
    </button>
  )
}