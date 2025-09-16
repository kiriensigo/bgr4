import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// 重み付きスコア計算の設定
const SCORE_WEIGHTS = {
  // レビュー数による信頼度（最小レビュー数の基準）
  MIN_REVIEWS_FOR_CONFIDENCE: 3,
  MAX_REVIEWS_FOR_FULL_WEIGHT: 20,
  
  // ユーザー信頼度による重み
  USER_TRUST_WEIGHTS: {
    NEW_USER: 0.5,        // 新規ユーザー（レビュー数1-2件）
    REGULAR_USER: 1.0,    // 通常ユーザー（レビュー数3-9件）
    TRUSTED_USER: 1.2,    // 信頼ユーザー（レビュー数10件以上）
    ADMIN_USER: 1.5       // 管理者
  },
  
  // レビューの質による重み
  QUALITY_WEIGHTS: {
    SHORT_REVIEW: 0.8,    // 短いレビュー（100文字未満）
    NORMAL_REVIEW: 1.0,   // 通常レビュー（100-500文字）
    DETAILED_REVIEW: 1.1, // 詳細レビュー（500文字以上）
    COMPREHENSIVE_REVIEW: 1.2 // 包括的レビュー（1000文字以上 + pros/cons）
  },
  
  // いいね数による重み
  LIKES_WEIGHT_MULTIPLIER: 0.05, // いいね1つにつき5%の重み増加（最大20%）
  MAX_LIKES_WEIGHT: 1.2
}



// GET /api/games/[id]/weighted-score - ゲームの重み付きスコア計算
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const gameId = parseInt(id)
    
    if (isNaN(gameId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid game ID' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // ゲームが存在するか確認
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id, name, rating_average, rating_count')
      .eq('id', gameId)
      .single()

    if (gameError || !game) {
      return NextResponse.json(
        { success: false, message: 'Game not found' },
        { status: 404 }
      )
    }

    // レビューデータを取得
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        content,
        pros,
        cons,
        created_at,
        user_id,
        profiles!reviews_user_id_fkey (
          is_admin
        )
      `)
      .eq('game_id', gameId)
      .eq('is_published', true)

    if (reviewsError) {
      console.error('Reviews fetch error:', reviewsError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch reviews' },
        { status: 500 }
      )
    }

    if (!reviews || reviews.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          game_id: gameId,
          simple_average: game.rating_average || 0,
          weighted_score: game.rating_average || 0,
          confidence_level: 0,
          total_reviews: 0,
          weighted_reviews: 0,
          methodology: 'insufficient_data'
        }
      })
    }

    // 各レビューのいいね数を取得
    const reviewIds = reviews.map(r => r.id)
    const { data: likesData } = await supabase
      .from('review_likes')
      .select('review_id')
      .in('review_id', reviewIds)

    const likesCountByReview = likesData?.reduce((acc, like) => {
      acc[like.review_id] = (acc[like.review_id] || 0) + 1
      return acc
    }, {} as Record<number, number>) || {}

    // ユーザーごとのレビュー数を取得
    const userIds = [...new Set(reviews.map(r => r.user_id))]
    const { data: userReviewCounts } = await supabase
      .from('reviews')
      .select('user_id')
      .in('user_id', userIds)
      .eq('is_published', true)

    const reviewCountByUser = userReviewCounts?.reduce((acc, review) => {
      acc[review.user_id] = (acc[review.user_id] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // 重み付きスコアを計算
    const weightedReviews = reviews.map(review => {
      const userReviewCount = reviewCountByUser[review.user_id] || 0
      const likesCount = likesCountByReview[review.id] || 0
      const isAdmin = Array.isArray(review.profiles) ? (review.profiles[0] as any)?.is_admin : (review.profiles as any)?.is_admin || false

      // ユーザー信頼度による重み
      let userWeight = SCORE_WEIGHTS.USER_TRUST_WEIGHTS.NEW_USER
      if (isAdmin) {
        userWeight = SCORE_WEIGHTS.USER_TRUST_WEIGHTS.ADMIN_USER
      } else if (userReviewCount >= 10) {
        userWeight = SCORE_WEIGHTS.USER_TRUST_WEIGHTS.TRUSTED_USER
      } else if (userReviewCount >= 3) {
        userWeight = SCORE_WEIGHTS.USER_TRUST_WEIGHTS.REGULAR_USER
      }

      // レビューの質による重み
      const contentLength = review.content?.length || 0
      const hasProsOrCons = (review.pros && review.pros.length > 0) || (review.cons && review.cons.length > 0)
      
      let qualityWeight = SCORE_WEIGHTS.QUALITY_WEIGHTS.NORMAL_REVIEW
      if (contentLength >= 1000 && hasProsOrCons) {
        qualityWeight = SCORE_WEIGHTS.QUALITY_WEIGHTS.COMPREHENSIVE_REVIEW
      } else if (contentLength >= 500) {
        qualityWeight = SCORE_WEIGHTS.QUALITY_WEIGHTS.DETAILED_REVIEW
      } else if (contentLength < 100) {
        qualityWeight = SCORE_WEIGHTS.QUALITY_WEIGHTS.SHORT_REVIEW
      }

      // いいね数による重み
      const likesWeight = Math.min(
        1 + (likesCount * SCORE_WEIGHTS.LIKES_WEIGHT_MULTIPLIER),
        SCORE_WEIGHTS.MAX_LIKES_WEIGHT
      )

      // 総重み計算
      const totalWeight = userWeight * qualityWeight * likesWeight

      return {
        review_id: review.id,
        rating: review.rating,
        weight: totalWeight,
        weighted_rating: review.rating * totalWeight,
        factors: {
          user_weight: userWeight,
          quality_weight: qualityWeight,
          likes_weight: likesWeight,
          user_review_count: userReviewCount,
          content_length: contentLength,
          likes_count: likesCount,
          is_admin: isAdmin
        }
      }
    })

    // 重み付き平均を計算
    const totalWeightedRating = weightedReviews.reduce((sum, r) => sum + r.weighted_rating, 0)
    const totalWeight = weightedReviews.reduce((sum, r) => sum + r.weight, 0)
    const weightedScore = totalWeight > 0 ? totalWeightedRating / totalWeight : 0

    // 信頼度レベルを計算（レビュー数に基づく）
    const confidenceLevel = Math.min(
      reviews.length / SCORE_WEIGHTS.MAX_REVIEWS_FOR_FULL_WEIGHT,
      1.0
    )

    // 簡単な平均
    const simpleAverage = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length

    return NextResponse.json({
      success: true,
      data: {
        game_id: gameId,
        simple_average: parseFloat(simpleAverage.toFixed(2)),
        weighted_score: parseFloat(weightedScore.toFixed(2)),
        confidence_level: parseFloat(confidenceLevel.toFixed(2)),
        total_reviews: reviews.length,
        weighted_reviews: weightedReviews.length,
        methodology: 'weighted_algorithm',
        score_breakdown: {
          weights_used: SCORE_WEIGHTS,
          review_weights: weightedReviews.map(r => ({
            review_id: r.review_id,
            rating: r.rating,
            weight: parseFloat(r.weight.toFixed(3)),
            factors: r.factors
          }))
        }
      }
    })
  } catch (error) {
    console.error('Weighted score calculation error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/games/[id]/weighted-score/update - ゲームの重み付きスコアを更新してDBに保存
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const gameId = parseInt(id)
    
    if (isNaN(gameId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid game ID' },
        { status: 400 }
      )
    }

    // 重み付きスコアを計算（GETエンドポイントの機能を再利用）
    const scoreResponse = await GET(_request, { params })
    const scoreData = await scoreResponse.json()

    if (!scoreData.success) {
      return scoreData
    }

    const supabase = await createServerSupabaseClient()

    // ゲームテーブルに重み付きスコアを保存
    const { error: updateError } = await supabase
      .from('games')
      .update({
        rating_average: scoreData.data.weighted_score,
        rating_count: scoreData.data.total_reviews,
        updated_at: new Date().toISOString()
      })
      .eq('id', gameId)

    if (updateError) {
      console.error('Game score update error:', updateError)
      return NextResponse.json(
        { success: false, message: 'Failed to update game score' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...scoreData.data,
        updated: true
      },
      message: 'Weighted score updated successfully'
    })
  } catch (error) {
    console.error('Score update error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}