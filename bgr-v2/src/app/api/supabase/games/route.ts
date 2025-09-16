import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    // バリデーション
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { success: false, message: 'Invalid pagination parameters' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('games')
      .select('*', { count: 'exact' })

    // 検索フィルタ
    if (search) {
      query = query.or(`name.ilike.%${search}%,japanese_name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // ソート
    const ascending = sortOrder === 'asc'
    if (sortBy === 'rating') {
      query = query.order('rating_average', { ascending, nullsFirst: false })
    } else if (sortBy === 'year') {
      query = query.order('year_published', { ascending, nullsFirst: false })
    } else if (sortBy === 'reviews') {
      query = query.order('rating_count', { ascending, nullsFirst: false })
    } else {
      query = query.order('name', { ascending })
    }

    // ページネーション
    const start = (page - 1) * limit
    query = query.range(start, start + limit - 1)

    const { data: games, error, count } = await query

    if (error) {
      console.error('Supabase games error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch games' },
        { status: 500 }
      )
    }

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: games || [],
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
    console.error('Games API error:', error)
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
      bgg_id, name, japanese_name, description,
      year_published, min_players, max_players, playing_time, min_age,
      image_url, thumbnail_url, mechanics, categories, designers, publishers
    } = body

    // バリデーション
    if (!name) {
      return NextResponse.json(
        { success: false, message: 'Game name is required' },
        { status: 400 }
      )
    }

    // ゲームをSupabaseに挿入
    const { data: game, error } = await supabaseAdmin
      .from('games')
      .insert([
        {
          bgg_id: bgg_id || null,
          name,
          japanese_name: japanese_name || null,
          description: description || null,
          year_published: year_published || null,
          min_players: min_players || null,
          max_players: max_players || null,
          playing_time: playing_time || null,
          min_age: min_age || null,
          image_url: image_url || null,
          thumbnail_url: thumbnail_url || null,
          mechanics: mechanics || [],
          categories: categories || [],
          designers: designers || [],
          publishers: publishers || [],
          rating_average: null,
          rating_count: 0
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Supabase game insert error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to create game' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: game,
      message: 'Game created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Create game API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}