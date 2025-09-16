'use client'

import { useState, useEffect, useCallback } from 'react'
// Mock toast implementation for build compatibility
const useToast = () => ({
  toast: (options: { title: string; description?: string; variant?: string }) => {
    console.log('Toast:', options)
  }
})

export interface ReviewComment {
  id: number
  content: string
  parent_id: number | null
  created_at: string
  updated_at: string
  profiles: {
    id: string
    username: string | null
    full_name: string | null
    avatar_url: string | null
  }
  replies?: ReviewComment[]
}

export interface CommentsResponse {
  review_id: number
  comments: ReviewComment[]
  total_count: number
}

export interface CommentCreateData {
  content: string
  parent_id?: number
}

export interface CommentUpdateData {
  content: string
}

interface UseReviewCommentsReturn {
  comments: ReviewComment[]
  loading: boolean
  error: string | null
  totalCount: number
  createComment: (data: CommentCreateData) => Promise<ReviewComment | null>
  updateComment: (commentId: number, data: CommentUpdateData) => Promise<ReviewComment | null>
  deleteComment: (commentId: number) => Promise<boolean>
  refetch: () => Promise<void>
}

export function useReviewComments(reviewId: number): UseReviewCommentsReturn {
  const [comments, setComments] = useState<ReviewComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const { toast } = useToast()

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/reviews/${reviewId}/comments`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch comments')
      }

      if (result.success) {
        setComments(result.data.comments)
        setTotalCount(result.data.total_count)
      } else {
        throw new Error(result.message || 'Failed to fetch comments')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch comments'
      setError(errorMessage)
      toast({
        title: 'エラー',
        description: 'コメントの読み込みに失敗しました',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [reviewId, toast])

  const createComment = useCallback(async (data: CommentCreateData): Promise<ReviewComment | null> => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create comment')
      }

      if (result.success) {
        const newComment = result.data
        
        // 階層構造を保持してコメントを追加
        if (data.parent_id) {
          // 返信コメントの場合、親コメントを見つけて replies 配列に追加
          setComments(prevComments => {
            const updateCommentsRecursively = (comments: ReviewComment[]): ReviewComment[] => {
              return comments.map(comment => {
                if (comment.id === data.parent_id) {
                  return {
                    ...comment,
                    replies: [...(comment.replies || []), newComment]
                  }
                }
                if (comment.replies) {
                  return {
                    ...comment,
                    replies: updateCommentsRecursively(comment.replies)
                  }
                }
                return comment
              })
            }
            return updateCommentsRecursively(prevComments)
          })
        } else {
          // トップレベルコメントの場合
          setComments(prevComments => [...prevComments, { ...newComment, replies: [] }])
        }
        
        setTotalCount(prev => prev + 1)
        
        toast({
          title: '成功',
          description: 'コメントを投稿しました',
        })
        
        return newComment
      } else {
        throw new Error(result.message || 'Failed to create comment')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create comment'
      toast({
        title: 'エラー',
        description: errorMessage,
        variant: 'destructive'
      })
      return null
    }
  }, [reviewId, toast])

  const updateComment = useCallback(async (commentId: number, data: CommentUpdateData): Promise<ReviewComment | null> => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update comment')
      }

      if (result.success) {
        const updatedComment = result.data
        
        // コメント一覧を更新
        setComments(prevComments => {
          const updateCommentsRecursively = (comments: ReviewComment[]): ReviewComment[] => {
            return comments.map(comment => {
              if (comment.id === commentId) {
                return { ...comment, ...updatedComment }
              }
              if (comment.replies) {
                return {
                  ...comment,
                  replies: updateCommentsRecursively(comment.replies)
                }
              }
              return comment
            })
          }
          return updateCommentsRecursively(prevComments)
        })
        
        toast({
          title: '成功',
          description: 'コメントを更新しました',
        })
        
        return updatedComment
      } else {
        throw new Error(result.message || 'Failed to update comment')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update comment'
      toast({
        title: 'エラー',
        description: errorMessage,
        variant: 'destructive'
      })
      return null
    }
  }, [reviewId, toast])

  const deleteComment = useCallback(async (commentId: number): Promise<boolean> => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/comments/${commentId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete comment')
      }

      if (result.success) {
        // コメント一覧から削除または論理削除に更新
        setComments(prevComments => {
          const removeOrUpdateCommentsRecursively = (comments: ReviewComment[]): ReviewComment[] => {
            return comments.map(comment => {
              if (comment.id === commentId) {
                // 返信がある場合は論理削除（コンテンツを変更）、ない場合は物理削除
                if (comment.replies && comment.replies.length > 0) {
                  return { ...comment, content: '[削除されたコメント]' }
                } else {
                  // 物理削除の場合は null を返して後でフィルタする
                  return null as any
                }
              }
              if (comment.replies) {
                return {
                  ...comment,
                  replies: removeOrUpdateCommentsRecursively(comment.replies).filter(Boolean)
                }
              }
              return comment
            }).filter(Boolean)
          }
          return removeOrUpdateCommentsRecursively(prevComments)
        })
        
        setTotalCount(prev => prev - 1)
        
        toast({
          title: '成功',
          description: 'コメントを削除しました',
        })
        
        return true
      } else {
        throw new Error(result.message || 'Failed to delete comment')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete comment'
      toast({
        title: 'エラー',
        description: errorMessage,
        variant: 'destructive'
      })
      return false
    }
  }, [reviewId, toast])

  const refetch = useCallback(async () => {
    await fetchComments()
  }, [fetchComments])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  return {
    comments,
    loading,
    error,
    totalCount,
    createComment,
    updateComment,
    deleteComment,
    refetch
  }
}