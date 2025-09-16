import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z, ZodError } from 'zod'

const createGameSchema = z.object({
  name: z.string().min(1, 'ゲーム名は必須です'),
  japaneseName: z.string().optional(),
  description: z.string().optional(),
  yearPublished: z.number().min(1900).max(new Date().getFullYear()).optional(),
  minPlayers: z.number().min(1),
  maxPlayers: z.number().min(1),
  playingTime: z.number().min(1).optional(),
  minAge: z.number().min(1).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  thumbnailUrl: z.string().url().optional().or(z.literal('')),
  bggId: z.number().optional(),
  siteCategories: z.array(z.string()).default([]),
  siteMechanics: z.array(z.string()).default([]),
  designers: z.array(z.string()).default([]),
  publishers: z.array(z.string()).default([])
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // 管理者権限チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    
    if (!profile?.is_admin) {
      return NextResponse.json(
        { success: false, message: 'Admin privileges required' },
        { status: 403 }
      )
    }
    
    // リクエストデータの検証
    const body = await request.json()
    const validatedData = createGameSchema.parse(body)
    
    // BGG IDの重複チェック
    if (validatedData.bggId) {
      const { data: existingGame } = await supabase
        .from('games')
        .select('id')
        .eq('bgg_id', validatedData.bggId)
        .single()
      
      if (existingGame) {
        return NextResponse.json(
          { success: false, message: 'このBGG IDのゲームは既に登録されています' },
          { status: 409 }
        )
      }
    }
    
    // ゲーム名の重複チェック（同じ年に発売された同名ゲーム）
    let duplicateQuery = supabase
      .from('games')
      .select('id')
      .eq('name', validatedData.name)
    
    if (validatedData.yearPublished) {
      duplicateQuery = duplicateQuery.eq('year_published', validatedData.yearPublished)
    }
    
    const { data: duplicateGame } = await duplicateQuery.single()
    
    if (duplicateGame) {
      return NextResponse.json(
        { success: false, message: 'このゲーム（同名・同年）は既に登録されています' },
        { status: 409 }
      )
    }
    
    // ゲームデータを挿入
    const gameData = {
      name: validatedData.name,
      japanese_name: validatedData.japaneseName || null,
      description: validatedData.description || null,
      year_published: validatedData.yearPublished || null,
      min_players: validatedData.minPlayers,
      max_players: validatedData.maxPlayers,
      playing_time: validatedData.playingTime || null,
      min_age: validatedData.minAge || null,
      image_url: validatedData.imageUrl || null,
      thumbnail_url: validatedData.thumbnailUrl || null,
      bgg_id: validatedData.bggId || null,
      
      // BGG original data (空の場合)
      bgg_categories: [],
      bgg_mechanics: [],
      bgg_publishers: validatedData.publishers,
      
      // Site-specific mapped data
      site_categories: validatedData.siteCategories,
      site_mechanics: validatedData.siteMechanics,
      site_publishers: validatedData.publishers,
      
      designers: validatedData.designers,
      rating_average: 0,
      rating_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('games')
      .insert(gameData)
      .select('id, name, japanese_name')
      .single()
    
    if (error) {
      console.error('Game creation error:', error)
      return NextResponse.json(
        { success: false, message: 'ゲームの作成に失敗しました', error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'ゲームが正常に作成されました',
      data: {
        id: data.id,
        name: data.name,
        japaneseName: data.japanese_name
      }
    })
    
  } catch (error) {
    console.error('Admin games API error:', error)
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid input data',
          errors: (error as ZodError).issues.map(e => e.message)
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // 管理者権限チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    
    if (!profile?.is_admin) {
      return NextResponse.json(
        { success: false, message: 'Admin privileges required' },
        { status: 403 }
      )
    }
    
    // クエリパラメータの取得
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const offset = (page - 1) * limit
    
    // ゲームデータの取得
    let query = supabase
      .from('games')
      .select(`
        id,
        name,
        japanese_name,
        year_published,
        min_players,
        max_players,
        playing_time,
        bgg_id,
        image_url,
        created_at,
        updated_at
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    // 検索フィルタ
    if (search) {
      query = query.or(`name.ilike.%${search}%,japanese_name.ilike.%${search}%`)
    }
    
    const { data, error, count } = await query
    
    if (error) {
      console.error('Games fetch error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch games', error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
    
  } catch (error) {
    console.error('Admin games API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}