'use client'

import { useState, useEffect, useCallback } from 'react'
// Mock toast implementation for build compatibility
const useToast = () => ({
  toast: (options: { title: string; description?: string; variant?: string }) => {
    console.log('Toast:', options)
  }
})

export interface CommentLikesData {
  comment_id: number
  likes_count: number
  is_liked: boolean
}

interface UseCommentLikesReturn {
  likesCount: number
  isLiked: boolean
  loading: boolean
  error: string | null
  toggleLike: () => Promise<boolean>
  refetch: () => Promise<void>
}

export function useCommentLikes(reviewId: number, commentId: number): UseCommentLikesReturn {
  const [likesCount, setLikesCount] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isToggling, setIsToggling] = useState(false)
  const { toast } = useToast()

  const fetchLikes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/reviews/${reviewId}/comments/${commentId}/likes`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch comment likes')
      }

      if (result.success) {
        setLikesCount(result.data.likes_count)
        setIsLiked(result.data.is_liked)
      } else {
        throw new Error(result.message || 'Failed to fetch comment likes')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch comment likes'
      setError(errorMessage)
      // ログイン状態などの問題でない限りはエラートーストを表示しない
      if (!errorMessage.includes('Authentication') && !errorMessage.includes('not found')) {
        toast({
          title: 'エラー',
          description: 'いいね情報の読み込みに失敗しました',
          variant: 'destructive'
        })
      }
    } finally {
      setLoading(false)
    }
  }, [reviewId, commentId, toast])

  const toggleLike = useCallback(async (): Promise<boolean> => {
    if (isToggling) return false

    try {
      setIsToggling(true)
      setError(null)

      const method = isLiked ? 'DELETE' : 'POST'
      const response = await fetch(`/api/reviews/${reviewId}/comments/${commentId}/likes`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: 'ログインが必要です',
            description: 'いいねをするにはログインしてください',
            variant: 'destructive'
          })
        } else if (response.status === 403) {
          toast({
            title: '操作できません',
            description: result.message || '自分のコメントにはいいねできません',
            variant: 'destructive'
          })
        } else if (response.status === 409) {
          toast({
            title: '既にいいね済みです',
            description: '既にこのコメントにいいねしています',
            variant: 'destructive'
          })
        } else {
          throw new Error(result.message || 'Failed to toggle comment like')
        }
        return false
      }

      if (result.success) {
        setLikesCount(result.data.likes_count)
        setIsLiked(result.data.is_liked)
        
        // 成功時にはトーストを表示しない（UXを考慮）
        return true
      } else {
        throw new Error(result.message || 'Failed to toggle comment like')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle comment like'
      setError(errorMessage)
      toast({
        title: 'エラー',
        description: 'いいねの操作に失敗しました',
        variant: 'destructive'
      })
      return false
    } finally {
      setIsToggling(false)
    }
  }, [reviewId, commentId, isLiked, isToggling, toast])

  const refetch = useCallback(async () => {
    await fetchLikes()
  }, [fetchLikes])

  useEffect(() => {
    fetchLikes()
  }, [fetchLikes])

  return {
    likesCount,
    isLiked,
    loading,
    error,
    toggleLike,
    refetch
  }
}