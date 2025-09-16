import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  try {
    const user = await requireAuth()
    
    const { data: favorites, error } = await supabase
      .from('favorites')
      .select(`
        id,
        created_at,
        games (
          id,
          name,
          description,
          year_published,
          min_players,
          max_players,
          playing_time,
          image_url,
          thumbnail_url,
          rating_average,
          rating_count
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Favorites fetch error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch favorites' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: favorites || [],
    })

  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    console.error('Favorites API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { gameId } = await request.json()

    if (!gameId || isNaN(parseInt(gameId))) {
      return NextResponse.json(
        { success: false, message: 'Valid game ID is required' },
        { status: 400 }
      )
    }

    // ゲームが存在するかチェック
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id')
      .eq('id', gameId)
      .single()

    if (gameError || !game) {
      return NextResponse.json(
        { success: false, message: 'Game not found' },
        { status: 404 }
      )
    }

    // 既にお気に入りに登録済みかチェック
    const { data: existingFavorite } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('game_id', gameId)
      .single()

    if (existingFavorite) {
      return NextResponse.json(
        { success: false, message: 'Game is already in favorites' },
        { status: 409 }
      )
    }

    // お気に入りに追加
    const { data, error } = await supabase
      .from('favorites')
      .insert({
        user_id: user.id,
        game_id: gameId,
      })
      .select()
      .single()

    if (error) {
      console.error('Add favorite error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to add favorite' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Game added to favorites',
    })

  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    console.error('Add favorite error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get('gameId')

    if (!gameId || isNaN(parseInt(gameId))) {
      return NextResponse.json(
        { success: false, message: 'Valid game ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('game_id', parseInt(gameId))

    if (error) {
      console.error('Remove favorite error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to remove favorite' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Game removed from favorites',
    })

  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    console.error('Remove favorite error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}