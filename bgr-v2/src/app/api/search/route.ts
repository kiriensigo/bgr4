import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SearchFilters, SearchResult, SearchFacets } from '@/types/search'
import { EnhancedReview } from '@/types/enhanced-review'

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // パラメータの取得とパース
    const searchQuery = searchParams.get('query')
    const minRatingParam = searchParams.get('minRating')
    const maxRatingParam = searchParams.get('maxRating')
    const minOverallScore = searchParams.get('minOverallScore')
    const maxOverallScore = searchParams.get('maxOverallScore')
    const minPlayers = searchParams.get('minPlayers')
    const maxPlayers = searchParams.get('maxPlayers')
    const yearFrom = searchParams.get('yearFrom')
    const yearTo = searchParams.get('yearTo')
    
    const filters: SearchFilters = {
      ...(searchQuery && { query: searchQuery }),
      mechanics: searchParams.getAll('mechanics').filter(Boolean),
      categories: searchParams.getAll('categories').filter(Boolean),
      publishers: searchParams.getAll('publishers').filter(Boolean),
      designers: searchParams.getAll('designers').filter(Boolean),
      ...(minRatingParam && { minRating: parseFloat(minRatingParam) }),
      ...(maxRatingParam && { maxRating: parseFloat(maxRatingParam) }),
      ...(minOverallScore && { minOverallScore: parseFloat(minOverallScore) }),
      ...(maxOverallScore && { maxOverallScore: parseFloat(maxOverallScore) }),
      ruleComplexity: searchParams.getAll('ruleComplexity').map(Number).filter(Boolean),
      luckFactor: searchParams.getAll('luckFactor').map(Number).filter(Boolean),
      interaction: searchParams.getAll('interaction').map(Number).filter(Boolean),
      downtime: searchParams.getAll('downtime').map(Number).filter(Boolean),
      ...(minPlayers && { minPlayers: parseInt(minPlayers) }),
      ...(maxPlayers && { maxPlayers: parseInt(maxPlayers) }),
      playingTime: searchParams.getAll('playingTime').map(Number).filter(Boolean),
      ...(yearFrom && { yearFrom: parseInt(yearFrom) }),
      ...(yearTo && { yearTo: parseInt(yearTo) }),
      sortBy: searchParams.get('sortBy') as any || 'rating',
      sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '20'), 100), // 最大100件
    }

    // バリデーション
    if (!filters.page || filters.page < 1 || !filters.limit || filters.limit < 1) {
      return NextResponse.json(
        { success: false, message: 'Invalid pagination parameters' },
        { status: 400 }
      )
    }

    // Supabaseクエリの構築
    let query = supabase
      .from('reviews')
      .select(`
        *,
        user:profiles(id, username, full_name, avatar_url),
        game:games(
          id, name, image_url, thumbnail_url,
          year_published, min_players, max_players, playing_time,
          mechanics, categories, publishers, designers
        )
      `)
      .eq('is_published', true)

    // テキスト検索
    if (filters.query) {
      const searchTerm = `%${filters.query}%`
      query = query.or(`title.ilike."${searchTerm}",content.ilike."${searchTerm}"`)
    }

    // 評価範囲
    const minRating = filters.minOverallScore || filters.minRating
    const maxRating = filters.maxOverallScore || filters.maxRating
    
    if (minRating) {
      query = query.gte('rating', minRating)
    }
    
    if (maxRating) {
      query = query.lte('rating', maxRating)
    }

    // 詳細評価 (現在のスキーマでは未実装のため一時的にコメントアウト)
    // if (filters.ruleComplexity && filters.ruleComplexity.length > 0) {
    //   query = query.in('rule_complexity', filters.ruleComplexity)
    // }

    // if (filters.luckFactor && filters.luckFactor.length > 0) {
    //   query = query.in('luck_factor', filters.luckFactor)
    // }

    // if (filters.interaction && filters.interaction.length > 0) {
    //   query = query.in('interaction', filters.interaction)
    // }

    // if (filters.downtime && filters.downtime.length > 0) {
    //   query = query.in('downtime', filters.downtime)
    // }

    // ソート
    switch (filters.sortBy) {
      case 'rating':
        query = query.order('rating', { ascending: filters.sortOrder === 'asc' })
        break
      case 'date':
        query = query.order('created_at', { ascending: filters.sortOrder === 'asc' })
        break
      case 'name':
        query = query.order('game.name', { ascending: filters.sortOrder === 'asc' })
        break
      case 'year':
        query = query.order('game.year_published', { ascending: filters.sortOrder === 'asc' })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    // ページネーション
    const offset = (filters.page - 1) * filters.limit
    query = query.range(offset, offset + filters.limit - 1)

    // クエリ実行
    const { data: reviews, error, count } = await query

    if (error) {
      console.error('Supabase search error:', error)
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      )
    }

    // データ整形
    const enhancedReviews: EnhancedReview[] = (reviews || []).map((review: any) => ({
      id: review.id,
      title: review.title,
      content: review.content,
      rating: review.rating,
      overall_score: review.rating || 0, // 基本的なratingを使用
      
      // Detailed ratings (未実装のため初期値)
      rule_complexity: review.rule_complexity || 1,
      luck_factor: review.luck_factor || 1,
      interaction: review.interaction || 1,
      downtime: review.downtime || 1,
      
      // Gameplay details (未実装のため初期値)
      recommended_players: review.recommended_players || [],
      mechanics: review.mechanics || [],
      categories: review.categories || [],
      custom_tags: review.custom_tags || [],
      play_time_actual: review.play_time_actual || null,
      player_count_played: review.player_count_played || null,
      
      // Legacy fields
      pros: review.pros || [],
      cons: review.cons || [],
      
      // Meta information
      is_published: review.is_published,
      created_at: review.created_at,
      updated_at: review.updated_at,
      user_id: review.user_id,
      game_id: review.game_id,
      
      // Relations
      user: review.user,
      game: review.game,
      _count: {
        comments: 0 // TODO: コメント数の実装
      }
    }))

    const total = count || 0
    const totalPages = Math.ceil(total / filters.limit)

    // 基本的なファセット情報（簡素版）
    const facets: SearchFacets = {
      mechanics: [],
      categories: [],
      publishers: [],
      designers: [],
      yearRange: { min: 1900, max: new Date().getFullYear() },
      playerCountRange: { min: 1, max: 8 },
      playingTimeRange: { min: 30, max: 180 },
      ratingRange: { min: 1, max: 10 }
    }

    const searchResult: SearchResult<EnhancedReview> = {
      data: enhancedReviews,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages,
        hasNext: filters.page < totalPages,
        hasPrev: filters.page > 1,
      },
      filters,
      facets,
    }

    return NextResponse.json({
      success: true,
      ...searchResult
    })

  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}