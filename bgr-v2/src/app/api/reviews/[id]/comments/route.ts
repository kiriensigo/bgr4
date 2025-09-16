import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const commentCreateSchema = z.object({
  content: z.string().min(1, 'コメント内容は必須です').max(1000, 'コメントは1000文字以下で入力してください'),
  parent_id: z.number().optional() // 返信コメント用
})

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/reviews/[id]/comments - レビューのコメント一覧取得
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const reviewId = parseInt(id)
    
    if (isNaN(reviewId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid review ID' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // まずレビューが存在するか確認
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('id, is_published')
      .eq('id', reviewId)
      .single()

    if (reviewError || !review) {
      return NextResponse.json(
        { success: false, message: 'Review not found' },
        { status: 404 }
      )
    }

    // 非公開レビューの場合は認証チェック
    if (!review.is_published) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json(
          { success: false, message: 'Review not found' },
          { status: 404 }
        )
      }

      const { data: reviewOwner } = await supabase
        .from('reviews')
        .select('user_id')
        .eq('id', reviewId)
        .single()

      if (reviewOwner?.user_id !== user.id) {
        return NextResponse.json(
          { success: false, message: 'Review not found' },
          { status: 404 }
        )
      }
    }

    // コメント取得（階層構造）
    const { data: comments, error } = await supabase
      .from('review_comments')
      .select(`
        id,
        content,
        parent_id,
        created_at,
        updated_at,
        profiles!review_comments_user_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('review_id', reviewId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Comments fetch error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch comments' },
        { status: 500 }
      )
    }

    // コメントを階層構造に変換
    const commentsMap = new Map()
    const rootComments: any[] = []

    // 全コメントをマップに追加
    comments.forEach(comment => {
      commentsMap.set(comment.id, { ...comment, replies: [] })
    })

    // 階層構造を構築
    comments.forEach(comment => {
      const commentWithReplies = commentsMap.get(comment.id)
      if (comment.parent_id) {
        const parent = commentsMap.get(comment.parent_id)
        if (parent) {
          parent.replies.push(commentWithReplies)
        }
      } else {
        rootComments.push(commentWithReplies)
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        review_id: reviewId,
        comments: rootComments,
        total_count: comments.length
      }
    })
  } catch (error) {
    console.error('Comments API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/reviews/[id]/comments - レビューにコメント追加
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = await params
    const reviewId = parseInt(id)
    
    if (isNaN(reviewId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid review ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = commentCreateSchema.parse(body)

    // レビューが存在するか確認
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('id, is_published')
      .eq('id', reviewId)
      .single()

    if (reviewError || !review) {
      return NextResponse.json(
        { success: false, message: 'Review not found' },
        { status: 404 }
      )
    }

    // 非公開レビューにはコメント不可
    if (!review.is_published) {
      return NextResponse.json(
        { success: false, message: 'Cannot comment on unpublished review' },
        { status: 403 }
      )
    }

    // 親コメントが指定されている場合の確認
    if (validatedData.parent_id) {
      const { data: parentComment, error: parentError } = await supabase
        .from('review_comments')
        .select('id, review_id')
        .eq('id', validatedData.parent_id)
        .eq('review_id', reviewId)
        .single()

      if (parentError || !parentComment) {
        return NextResponse.json(
          { success: false, message: 'Parent comment not found' },
          { status: 400 }
        )
      }
    }

    // コメント作成
    const { data: newComment, error } = await supabase
      .from('review_comments')
      .insert({
        review_id: reviewId,
        user_id: user.id,
        content: validatedData.content,
        parent_id: validatedData.parent_id || null
      })
      .select(`
        id,
        content,
        parent_id,
        created_at,
        updated_at,
        profiles!review_comments_user_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('Comment creation error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to create comment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: newComment,
      message: 'Comment created successfully'
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation error',
          errors: error.issues.map(issue => issue.message)
        },
        { status: 400 }
      )
    }

    console.error('Comment creation error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}