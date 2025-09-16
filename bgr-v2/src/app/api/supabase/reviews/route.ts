import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const gameId = searchParams.get('gameId')
    const userId = searchParams.get('userId')
    const published = searchParams.get('published')

    // バリデーション
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { success: false, message: 'Invalid pagination parameters' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('reviews')
      .select(`
        *,
        user:profiles(id, username, full_name, avatar_url),
        game:games(id, name, japanese_name, image_url, year_published),
        comments(count)
      `)
      .order('created_at', { ascending: false })

    // フィルタリング
    if (gameId) {
      query = query.eq('game_id', parseInt(gameId))
    }

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (published !== null && published !== undefined) {
      const isPublished = published === 'true'
      query = query.eq('is_published', isPublished)
    } else {
      // デフォルトでは公開済みレビューのみ表示
      query = query.eq('is_published', true)
    }

    // ページネーション
    const start = (page - 1) * limit
    query = query.range(start, start + limit - 1)

    const { data: reviews, error, count } = await query

    if (error) {
      console.error('Supabase reviews error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch reviews' },
        { status: 500 }
      )
    }

    // データ変換 (EnhancedReview形式に合わせる)
    const transformedReviews = reviews?.map(review => ({
      ...review,
      _count: {
        comments: review.comments?.length || 0
      }
    })) || []

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: transformedReviews,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })

  } catch (error) {
    console.error('Reviews API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      title, content, overall_score, rating,
      rule_complexity, luck_factor, interaction, downtime,
      recommended_players, mechanics, categories, custom_tags,
      play_time_actual, player_count_played,
      pros, cons, is_published, game_id, user_id 
    } = body

    // バリデーション
    if (!title || !content || !game_id || !user_id) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    const finalOverallScore = overall_score || rating || 7
    if (finalOverallScore < 1 || finalOverallScore > 10) {
      return NextResponse.json(
        { success: false, message: 'Overall score must be between 1 and 10' },
        { status: 400 }
      )
    }

    // 詳細評価のバリデーション
    if (rule_complexity && (rule_complexity < 1 || rule_complexity > 5)) {
      return NextResponse.json(
        { success: false, message: 'Rule complexity must be between 1 and 5' },
        { status: 400 }
      )
    }

    // レビューをSupabaseに挿入
    const { data: review, error } = await supabaseAdmin
      .from('reviews')
      .insert([
        {
          title,
          content,
          rating: finalOverallScore, // レガシー互換性
          overall_score: finalOverallScore,
          rule_complexity: rule_complexity || null,
          luck_factor: luck_factor || null,
          interaction: interaction || null,
          downtime: downtime || null,
          recommended_players: recommended_players || null,
          mechanics: mechanics || null,
          categories: categories || null,
          custom_tags: custom_tags || null,
          play_time_actual: play_time_actual || null,
          player_count_played: player_count_played || null,
          pros: pros || null,
          cons: cons || null,
          is_published: is_published ?? true,
          game_id,
          user_id
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to create review' },
        { status: 500 }
      )
    }

    // ゲーム統計を更新（非同期）
    try {
      await supabaseAdmin.rpc('update_game_statistics', { 
        game_id_param: game_id 
      })
    } catch (statsError) {
      console.warn('Failed to update game statistics:', statsError)
      // 統計更新エラーは無視して処理を続行
    }

    return NextResponse.json({
      success: true,
      data: review,
      message: 'Review created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Create review API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}