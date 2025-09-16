import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string; commentId: string }>
}

// GET /api/reviews/[id]/comments/[commentId]/likes - コメントのいいね数と自分のいいね状態取得
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id, commentId } = await params
    const reviewId = parseInt(id)
    const commentIdNum = parseInt(commentId)
    
    if (isNaN(reviewId) || isNaN(commentIdNum)) {
      return NextResponse.json(
        { success: false, message: 'Invalid ID' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // コメントが存在するか確認
    const { data: comment, error: commentError } = await supabase
      .from('review_comments')
      .select('id, review_id')
      .eq('id', commentIdNum)
      .eq('review_id', reviewId)
      .single()

    if (commentError || !comment) {
      return NextResponse.json(
        { success: false, message: 'Comment not found' },
        { status: 404 }
      )
    }

    // いいね数を取得
    const { data: likesData, error: likesError } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentIdNum)

    if (likesError) {
      console.error('Comment likes count error:', likesError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch likes' },
        { status: 500 }
      )
    }

    const likesCount = likesData?.length || 0

    // ユーザーがログインしている場合、自分のいいね状態も確認
    let isLiked = false
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: userLike } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentIdNum)
        .eq('user_id', user.id)
        .single()

      isLiked = !!userLike
    }

    return NextResponse.json({
      success: true,
      data: {
        comment_id: commentIdNum,
        likes_count: likesCount,
        is_liked: isLiked
      }
    })
  } catch (error) {
    console.error('Comment likes API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/reviews/[id]/comments/[commentId]/likes - コメントにいいねを追加
export async function POST(_request: NextRequest, { params }: RouteParams) {
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

    // コメントが存在するか確認
    const { data: comment, error: commentError } = await supabase
      .from('review_comments')
      .select('id, review_id, user_id')
      .eq('id', commentIdNum)
      .eq('review_id', reviewId)
      .single()

    if (commentError || !comment) {
      return NextResponse.json(
        { success: false, message: 'Comment not found' },
        { status: 404 }
      )
    }

    // 自分のコメントにはいいね不可
    if (comment.user_id === user.id) {
      return NextResponse.json(
        { success: false, message: 'Cannot like your own comment' },
        { status: 403 }
      )
    }

    // 既にいいねしているかチェック
    const { data: existingLike } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentIdNum)
      .eq('user_id', user.id)
      .single()

    if (existingLike) {
      return NextResponse.json(
        { success: false, message: 'Already liked' },
        { status: 409 }
      )
    }

    // いいね追加
    const { data: newLike, error } = await supabase
      .from('comment_likes')
      .insert({
        comment_id: commentIdNum,
        user_id: user.id
      })
      .select('id, created_at')
      .single()

    if (error) {
      console.error('Comment like creation error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to add like' },
        { status: 500 }
      )
    }

    // 新しいいいね数を取得
    const { data: likesData } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentIdNum)

    const likesCount = likesData?.length || 0

    return NextResponse.json({
      success: true,
      data: {
        comment_id: commentIdNum,
        likes_count: likesCount,
        is_liked: true,
        like_id: newLike.id
      },
      message: 'Like added successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Comment like creation error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/reviews/[id]/comments/[commentId]/likes - コメントのいいねを削除
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

    // いいねが存在するかチェック
    const { data: existingLike, error: likeError } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentIdNum)
      .eq('user_id', user.id)
      .single()

    if (likeError || !existingLike) {
      return NextResponse.json(
        { success: false, message: 'Like not found' },
        { status: 404 }
      )
    }

    // いいね削除
    const { error } = await supabase
      .from('comment_likes')
      .delete()
      .eq('id', existingLike.id)

    if (error) {
      console.error('Comment like deletion error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to remove like' },
        { status: 500 }
      )
    }

    // 新しいいいね数を取得
    const { data: likesData } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentIdNum)

    const likesCount = likesData?.length || 0

    return NextResponse.json({
      success: true,
      data: {
        comment_id: commentIdNum,
        likes_count: likesCount,
        is_liked: false
      },
      message: 'Like removed successfully'
    })
  } catch (error) {
    console.error('Comment like deletion error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}