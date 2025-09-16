import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface SearchFilters {
  query?: string
  categories?: string[]
  mechanics?: string[]
  designers?: string[]
  publishers?: string[]
  playerCount?: {
    min?: number
    max?: number
    exact?: number
  }
  playingTime?: {
    min?: number
    max?: number
  }
  yearPublished?: {
    min?: number
    max?: number
  }
  rating?: {
    min?: number
    max?: number
  }
  sortBy?: 'name' | 'year_published' | 'rating_average' | 'created_at' | 'popularity'
  sortOrder?: 'asc' | 'desc'
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()
    
    const {
      query,
      categories = [],
      mechanics = [],
      designers = [],
      publishers = [],
      playerCount,
      playingTime,
      yearPublished,
      rating,
      sortBy = 'name',
      sortOrder = 'asc',
      page = 1,
      limit = 20
    } = body as SearchFilters & { page?: number; limit?: number }
    
    const offset = (page - 1) * limit
    
    // クエリビルダーの開始
    let queryBuilder = supabase
      .from('games')
      .select(`
        id,
        name,
        japanese_name,
        description,
        year_published,
        min_players,
        max_players,
        playing_time,
        min_age,
        image_url,
        thumbnail_url,
        site_categories,
        site_mechanics,
        designers,
        site_publishers,
        rating_average,
        rating_count,
        created_at
      `, { count: 'exact' })
    
    // テキスト検索
    if (query?.trim()) {
      queryBuilder = queryBuilder.or(
        `name.ilike.%${query}%,japanese_name.ilike.%${query}%,description.ilike.%${query}%`
      )
    }
    
    // カテゴリーフィルター
    if (categories.length > 0) {
      queryBuilder = queryBuilder.overlaps('site_categories', categories)
    }
    
    // メカニクスフィルター
    if (mechanics.length > 0) {
      queryBuilder = queryBuilder.overlaps('site_mechanics', mechanics)
    }
    
    // デザイナーフィルター
    if (designers.length > 0) {
      queryBuilder = queryBuilder.overlaps('designers', designers)
    }
    
    // パブリッシャーフィルター
    if (publishers.length > 0) {
      queryBuilder = queryBuilder.overlaps('site_publishers', publishers)
    }
    
    // プレイヤー数フィルター
    if (playerCount) {
      if (playerCount.exact) {
        queryBuilder = queryBuilder
          .lte('min_players', playerCount.exact)
          .gte('max_players', playerCount.exact)
      } else {
        if (playerCount.min) {
          queryBuilder = queryBuilder.gte('max_players', playerCount.min)
        }
        if (playerCount.max) {
          queryBuilder = queryBuilder.lte('min_players', playerCount.max)
        }
      }
    }
    
    // プレイ時間フィルター
    if (playingTime) {
      if (playingTime.min) {
        queryBuilder = queryBuilder.gte('playing_time', playingTime.min)
      }
      if (playingTime.max) {
        queryBuilder = queryBuilder.lte('playing_time', playingTime.max)
      }
    }
    
    // 発売年フィルター
    if (yearPublished) {
      if (yearPublished.min) {
        queryBuilder = queryBuilder.gte('year_published', yearPublished.min)
      }
      if (yearPublished.max) {
        queryBuilder = queryBuilder.lte('year_published', yearPublished.max)
      }
    }
    
    // 評価フィルター
    if (rating) {
      if (rating.min !== undefined && rating.min > 0) {
        queryBuilder = queryBuilder.gte('rating_average', rating.min)
      }
      if (rating.max !== undefined && rating.max < 10) {
        queryBuilder = queryBuilder.lte('rating_average', rating.max)
      }
    }
    
    // ソート
    const sortMapping: Record<string, string> = {
      'name': 'name',
      'year_published': 'year_published',
      'rating_average': 'rating_average',
      'created_at': 'created_at',
      'popularity': 'rating_count'
    }
    
    const sortColumn = sortMapping[sortBy] || 'name'
    queryBuilder = queryBuilder.order(sortColumn, { ascending: sortOrder === 'asc' })
    
    // ページネーション
    queryBuilder = queryBuilder.range(offset, offset + limit - 1)
    
    const { data, error, count } = await queryBuilder
    
    if (error) {
      console.error('Games search error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to search games', error: error.message },
        { status: 500 }
      )
    }
    
    // レスポンス用にデータを整形
    const formattedGames = (data || []).map(game => ({
      id: game.id,
      name: game.name,
      japaneseName: game.japanese_name,
      description: game.description,
      yearPublished: game.year_published,
      minPlayers: game.min_players,
      maxPlayers: game.max_players,
      playingTime: game.playing_time,
      minAge: game.min_age,
      imageUrl: game.image_url,
      thumbnailUrl: game.thumbnail_url,
      categories: game.site_categories || [],
      mechanics: game.site_mechanics || [],
      designers: game.designers || [],
      publishers: game.site_publishers || [],
      ratingAverage: game.rating_average,
      ratingCount: game.rating_count,
      createdAt: game.created_at
    }))
    
    return NextResponse.json({
      success: true,
      data: formattedGames,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      message: `Found ${count || 0} games`
    })
    
  } catch (error) {
    console.error('Games search API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error during search',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Search query is required' },
        { status: 400 }
      )
    }

    if (query.length < 2) {
      return NextResponse.json(
        { success: false, message: 'Search query must be at least 2 characters long' },
        { status: 400 }
      )
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { success: false, message: 'Invalid limit parameter' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // PostgreSQLの全文検索を使用
    const { data: games, error } = await supabase
      .from('games')
      .select('*')
      .or(
        `name.ilike.%${query}%,japanese_name.ilike.%${query}%,description.ilike.%${query}%,designers.cs.{${query}},site_publishers.cs.{${query}}`
      )
      .order('rating_average', { ascending: false, nullsFirst: false })
      .order('rating_count', { ascending: false, nullsFirst: false })
      .limit(limit)

    if (error) {
      console.error('Game search error:', error)
      return NextResponse.json(
        { success: false, message: 'Search failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: games || [],
      message: `Found ${games?.length || 0} games`,
      query: query.trim(),
    })

  } catch (error) {
    console.error('Game search error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}