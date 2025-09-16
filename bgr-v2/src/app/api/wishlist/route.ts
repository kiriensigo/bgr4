import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z, ZodError } from 'zod'

const addWishlistSchema = z.object({
  gameId: z.number().positive('Game ID must be positive')
})

const removeWishlistSchema = z.object({
  gameId: z.number().positive('Game ID must be positive')
})

// ウィッシュリスト一覧取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // クエリパラメータ取得
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const offset = (page - 1) * limit
    
    // ウィッシュリストとゲーム情報を結合して取得
    const { data, error, count } = await supabase
      .from('wishlists')
      .select(`
        id,
        game_id,
        created_at,
        games!inner (
          id,
          name,
          japanese_name,
          description,
          year_published,
          min_players,
          max_players,
          playing_time,
          image_url,
          thumbnail_url,
          site_categories,
          site_mechanics,
          designers,
          site_publishers,
          rating_average,
          rating_count
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1)
    
    if (error) {
      console.error('Wishlist fetch error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch wishlist', error: error.message },
        { status: 500 }
      )
    }
    
    // レスポンス用にデータを整形
    const formattedWishlist = (data || []).map(item => {
      const game = Array.isArray(item.games) ? item.games[0] : item.games
      if (!game) {
        throw new Error('Game data missing for wishlist item')
      }
      return {
        id: item.id,
        gameId: item.game_id,
        addedAt: item.created_at,
        game: {
          id: game.id,
          name: game.name,
          japaneseName: game.japanese_name,
          description: game.description,
          yearPublished: game.year_published,
          minPlayers: game.min_players,
          maxPlayers: game.max_players,
          playingTime: game.playing_time,
          imageUrl: game.image_url,
          thumbnailUrl: game.thumbnail_url,
          categories: game.site_categories || [],
          mechanics: game.site_mechanics || [],
          designers: game.designers || [],
          publishers: game.site_publishers || [],
          ratingAverage: game.rating_average,
          ratingCount: game.rating_count
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      data: formattedWishlist,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      message: `Found ${count || 0} games in wishlist`
    })
    
  } catch (error) {
    console.error('Wishlist GET error:', error)
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

// ウィッシュリストにゲーム追加
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // リクエストデータの検証
    const body = await request.json()
    const validatedData = addWishlistSchema.parse(body)
    
    // ゲームの存在確認
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id, name, japanese_name')
      .eq('id', validatedData.gameId)
      .single()
    
    if (gameError || !game) {
      return NextResponse.json(
        { success: false, message: 'Game not found' },
        { status: 404 }
      )
    }
    
    // 既にウィッシュリストに追加済みかチェック
    const { data: existing } = await supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', user.id)
      .eq('game_id', validatedData.gameId)
      .single()
    
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Game already in wishlist' },
        { status: 409 }
      )
    }
    
    // ウィッシュリストに追加
    const { data: wishlistItem, error: insertError } = await supabase
      .from('wishlists')
      .insert({
        user_id: user.id,
        game_id: validatedData.gameId,
        created_at: new Date().toISOString()
      })
      .select('id, created_at')
      .single()
    
    if (insertError) {
      console.error('Wishlist insert error:', insertError)
      return NextResponse.json(
        { success: false, message: 'Failed to add to wishlist', error: insertError.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Game added to wishlist successfully',
      data: {
        id: wishlistItem.id,
        gameId: validatedData.gameId,
        gameName: game.japanese_name || game.name,
        addedAt: wishlistItem.created_at
      }
    })
    
  } catch (error) {
    console.error('Wishlist POST error:', error)
    
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

// ウィッシュリストからゲーム削除
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // リクエストデータの検証
    const body = await request.json()
    const validatedData = removeWishlistSchema.parse(body)
    
    // ウィッシュリスト項目の存在確認
    const { data: wishlistItem, error: findError } = await supabase
      .from('wishlists')
      .select(`
        id,
        games!inner (
          name,
          japanese_name
        )
      `)
      .eq('user_id', user.id)
      .eq('game_id', validatedData.gameId)
      .single()
    
    if (findError || !wishlistItem) {
      return NextResponse.json(
        { success: false, message: 'Game not found in wishlist' },
        { status: 404 }
      )
    }
    
    // ウィッシュリストから削除
    const { error: deleteError } = await supabase
      .from('wishlists')
      .delete()
      .eq('id', wishlistItem.id)
    
    if (deleteError) {
      console.error('Wishlist delete error:', deleteError)
      return NextResponse.json(
        { success: false, message: 'Failed to remove from wishlist', error: deleteError.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Game removed from wishlist successfully',
      data: {
        gameId: validatedData.gameId,
        gameName: (wishlistItem.games as any)?.japanese_name || (wishlistItem.games as any)?.name || 'Unknown Game'
      }
    })
    
  } catch (error) {
    console.error('Wishlist DELETE error:', error)
    
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