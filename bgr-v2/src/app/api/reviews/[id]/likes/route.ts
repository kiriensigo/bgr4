import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/reviews/[id]/likes - レビューのいいね数と自分のいいね状態取得
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

    // いいね数を取得
    const { data: likesData, error: likesError } = await supabase
      .from('review_likes')
      .select('id')
      .eq('review_id', reviewId)

    if (likesError) {
      console.error('Likes count error:', likesError)
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
        .from('review_likes')
        .select('id')
        .eq('review_id', reviewId)
        .eq('user_id', user.id)
        .single()

      isLiked = !!userLike
    }

    return NextResponse.json({
      success: true,
      data: {
        review_id: reviewId,
        likes_count: likesCount,
        is_liked: isLiked
      }
    })
  } catch (error) {
    console.error('Likes API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/reviews/[id]/likes - レビューにいいねを追加
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

    const { id } = await params
    const reviewId = parseInt(id)
    
    if (isNaN(reviewId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid review ID' },
        { status: 400 }
      )
    }

    // レビューが存在するか確認
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('id, is_published, user_id')
      .eq('id', reviewId)
      .single()

    if (reviewError || !review) {
      return NextResponse.json(
        { success: false, message: 'Review not found' },
        { status: 404 }
      )
    }

    // 非公開レビューにはいいね不可
    if (!review.is_published) {
      return NextResponse.json(
        { success: false, message: 'Cannot like unpublished review' },
        { status: 403 }
      )
    }

    // 自分のレビューにはいいね不可
    if (review.user_id === user.id) {
      return NextResponse.json(
        { success: false, message: 'Cannot like your own review' },
        { status: 403 }
      )
    }

    // 既にいいねしているかチェック
    const { data: existingLike } = await supabase
      .from('review_likes')
      .select('id')
      .eq('review_id', reviewId)
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
      .from('review_likes')
      .insert({
        review_id: reviewId,
        user_id: user.id
      })
      .select('id, created_at')
      .single()

    if (error) {
      console.error('Like creation error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to add like' },
        { status: 500 }
      )
    }

    // 新しいいいね数を取得
    const { data: likesData } = await supabase
      .from('review_likes')
      .select('id')
      .eq('review_id', reviewId)

    const likesCount = likesData?.length || 0

    return NextResponse.json({
      success: true,
      data: {
        review_id: reviewId,
        likes_count: likesCount,
        is_liked: true,
        like_id: newLike.id
      },
      message: 'Like added successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Like creation error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/reviews/[id]/likes - レビューのいいねを削除
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

    const { id } = await params
    const reviewId = parseInt(id)
    
    if (isNaN(reviewId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid review ID' },
        { status: 400 }
      )
    }

    // いいねが存在するかチェック
    const { data: existingLike, error: likeError } = await supabase
      .from('review_likes')
      .select('id')
      .eq('review_id', reviewId)
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
      .from('review_likes')
      .delete()
      .eq('id', existingLike.id)

    if (error) {
      console.error('Like deletion error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to remove like' },
        { status: 500 }
      )
    }

    // 新しいいいね数を取得
    const { data: likesData } = await supabase
      .from('review_likes')
      .select('id')
      .eq('review_id', reviewId)

    const likesCount = likesData?.length || 0

    return NextResponse.json({
      success: true,
      data: {
        review_id: reviewId,
        likes_count: likesCount,
        is_liked: false
      },
      message: 'Like removed successfully'
    })
  } catch (error) {
    console.error('Like deletion error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}