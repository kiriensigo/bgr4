import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const commentUpdateSchema = z.object({
  content: z.string().min(1, 'コメント内容は必須です').max(1000, 'コメントは1000文字以下で入力してください')
})

interface RouteParams {
  params: Promise<{ id: string; commentId: string }>
}

// PUT /api/reviews/[id]/comments/[commentId] - コメント更新
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id, commentId } = await params
    const reviewId = parseInt(id)
    const commentIdNum = parseInt(commentId)
    
    if (isNaN(reviewId) || isNaN(commentIdNum)) {
      return NextResponse.json(
        { success: false, message: 'Invalid ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = commentUpdateSchema.parse(body)

    // コメントの存在確認と権限チェック
    const { data: comment, error: commentError } = await supabase
      .from('review_comments')
      .select('id, user_id, review_id')
      .eq('id', commentIdNum)
      .eq('review_id', reviewId)
      .single()

    if (commentError || !comment) {
      return NextResponse.json(
        { success: false, message: 'Comment not found' },
        { status: 404 }
      )
    }

    if (comment.user_id !== user.id) {
      return NextResponse.json(
        { success: false, message: 'Permission denied' },
        { status: 403 }
      )
    }

    // コメント更新
    const { data: updatedComment, error } = await supabase
      .from('review_comments')
      .update({
        content: validatedData.content,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentIdNum)
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
      console.error('Comment update error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to update comment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedComment,
      message: 'Comment updated successfully'
    })
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

    console.error('Comment update error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/reviews/[id]/comments/[commentId] - コメント削除
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id, commentId } = await params
    const reviewId = parseInt(id)
    const commentIdNum = parseInt(commentId)
    
    if (isNaN(reviewId) || isNaN(commentIdNum)) {
      return NextResponse.json(
        { success: false, message: 'Invalid ID' },
        { status: 400 }
      )
    }

    // コメントの存在確認と権限チェック
    const { data: comment, error: commentError } = await supabase
      .from('review_comments')
      .select('id, user_id, review_id')
      .eq('id', commentIdNum)
      .eq('review_id', reviewId)
      .single()

    if (commentError || !comment) {
      return NextResponse.json(
        { success: false, message: 'Comment not found' },
        { status: 404 }
      )
    }

    // 権限チェック（作者または管理者）
    if (comment.user_id !== user.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (!profile?.is_admin) {
        return NextResponse.json(
          { success: false, message: 'Permission denied' },
          { status: 403 }
        )
      }
    }

    // 子コメントがある場合は論理削除、ない場合は物理削除
    const { data: replies } = await supabase
      .from('review_comments')
      .select('id')
      .eq('parent_id', commentIdNum)

    if (replies && replies.length > 0) {
      // 論理削除（コンテンツを削除済みメッセージに変更）
      const { error } = await supabase
        .from('review_comments')
        .update({
          content: '[削除されたコメント]',
          updated_at: new Date().toISOString()
        })
        .eq('id', commentIdNum)

      if (error) {
        console.error('Comment soft delete error:', error)
        return NextResponse.json(
          { success: false, message: 'Failed to delete comment' },
          { status: 500 }
        )
      }
    } else {
      // 物理削除
      const { error } = await supabase
        .from('review_comments')
        .delete()
        .eq('id', commentIdNum)

      if (error) {
        console.error('Comment delete error:', error)
        return NextResponse.json(
          { success: false, message: 'Failed to delete comment' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully'
    })
  } catch (error) {
    console.error('Comment delete error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}