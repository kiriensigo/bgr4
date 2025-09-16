import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { reviewUpdateSchema } from '@/lib/validations'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const reviewId = parseInt(id)

    if (isNaN(reviewId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid review ID' },
        { status: 400 }
      )
    }

    const { data: review, error } = await supabase
      .from('reviews')
      .select(`
        id,
        title,
        content,
        rating,
        overall_score,
        complexity_score,
        luck_score,
        interaction_score,
        downtime_score,
        pros,
        cons,
        categories,
        mechanics,
        recommended_player_counts,
        is_published,
        created_at,
        updated_at,
        profiles!reviews_user_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        ),
        games!reviews_game_id_fkey (
          id,
          name,
          name_jp,
          description,
          year_published,
          min_players,
          max_players,
          playing_time,
          image_url,
          thumbnail_url,
          rating_average,
          rating_count,
          bgg_id
        )
      `)
      .eq('id', reviewId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, message: 'Review not found' },
          { status: 404 }
        )
      }

      console.error('Review fetch error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch review' },
        { status: 500 }
      )
    }

    // 非公開レビューは作者のみ閲覧可能（一時的にコメントアウト）
    // if (!review.is_published) {
    //   try {
    //     const user = await requireAuth()
    //     if (user.id !== review.profiles?.id) {
    //       return NextResponse.json(
    //         { success: false, message: 'Review not found' },
    //         { status: 404 }
    //       )
    //     }
    //   } catch {
    //     return NextResponse.json(
    //       { success: false, message: 'Review not found' },
    //       { status: 404 }
    //       )
    //   }
    // }

    return NextResponse.json({
      success: true,
      data: review,
    })

  } catch (error) {
    console.error('Review API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const reviewId = parseInt(id)
    const body = await request.json()

    if (isNaN(reviewId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid review ID' },
        { status: 400 }
      )
    }

    // バリデーション
    const validationResult = reviewUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: validationResult.error.format(),
        },
        { status: 400 }
      )
    }

    // レビューの存在確認と権限チェック
    const { data: existingReview, error: fetchError } = await supabase
      .from('reviews')
      .select('user_id')
      .eq('id', reviewId)
      .single()

    if (fetchError || !existingReview) {
      return NextResponse.json(
        { success: false, message: 'Review not found' },
        { status: 404 }
      )
    }

    if (existingReview.user_id !== user.id) {
      return NextResponse.json(
        { success: false, message: 'Permission denied' },
        { status: 403 }
      )
    }

    // レビュー更新
    const { data, error } = await supabase
      .from('reviews')
      .update({
        ...validationResult.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId)
      .select(`
        id,
        title,
        content,
        rating,
        overall_score,
        complexity_score,
        luck_score,
        interaction_score,
        downtime_score,
        pros,
        cons,
        categories,
        mechanics,
        recommended_player_counts,
        is_published,
        created_at,
        updated_at,
        profiles!reviews_user_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        ),
        games!reviews_game_id_fkey (
          id,
          name,
          name_jp,
          image_url,
          thumbnail_url,
          bgg_id
        )
      `)
      .single()

    if (error) {
      console.error('Update review error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to update review' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Review updated successfully',
    })

  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    console.error('Update review error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const reviewId = parseInt(id)

    if (isNaN(reviewId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid review ID' },
        { status: 400 }
      )
    }

    // レビューの存在確認と権限チェック
    const { data: existingReview, error: fetchError } = await supabase
      .from('reviews')
      .select('user_id')
      .eq('id', reviewId)
      .single()

    if (fetchError || !existingReview) {
      return NextResponse.json(
        { success: false, message: 'Review not found' },
        { status: 404 }
      )
    }

    if (existingReview.user_id !== user.id) {
      return NextResponse.json(
        { success: false, message: 'Permission denied' },
        { status: 403 }
      )
    }

    // レビュー削除（カスケード削除でコメントも削除される）
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)

    if (error) {
      console.error('Delete review error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to delete review' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully',
    })

  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    console.error('Delete review error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}