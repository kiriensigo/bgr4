import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const gameId = parseInt(id)

    if (isNaN(gameId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid game ID' },
        { status: 400 }
      )
    }

    const { data: game, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, message: 'Game not found' },
          { status: 404 }
        )
      }

      console.error('Game detail API error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch game' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: game,
    })

  } catch (error) {
    console.error('Game detail API error:', error)
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
    const { id } = await params
    const gameId = parseInt(id)
    const body = await request.json()

    if (isNaN(gameId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid game ID' },
        { status: 400 }
      )
    }

    // Service role client for admin operations
    const serviceSupabase = createClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['SUPABASE_SERVICE_ROLE_KEY']!
    )

    // 更新可能なフィールドのみを抽出
    const allowedFields = [
      'name', 'description', 'year_published', 'min_players', 'max_players',
      'playing_time', 'min_age', 'image_url', 'thumbnail_url',
      'mechanics', 'categories', 'designers', 'publishers',
      'rating_average', 'rating_count'
    ]

    const updateData: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, message: 'No valid fields to update' },
        { status: 400 }
      )
    }

    updateData['updated_at'] = new Date().toISOString()

    console.log(`🔄 ゲーム ${gameId} のデータ更新:`)
    if (updateData['categories']) console.log(`   カテゴリー: ${JSON.stringify(updateData['categories'])}`)
    if (updateData['mechanics']) console.log(`   メカニクス: ${JSON.stringify(updateData['mechanics'])}`)

    const { data, error } = await serviceSupabase
      .from('games')
      .update(updateData)
      .eq('id', gameId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.error(`❌ ゲーム ${gameId} が見つかりません`)
        return NextResponse.json(
          { success: false, message: 'Game not found' },
          { status: 404 }
        )
      }

      console.error(`❌ ゲーム ${gameId} 更新エラー:`, error)
      return NextResponse.json(
        { success: false, message: 'Failed to update game' },
        { status: 500 }
      )
    }

    console.log(`✅ ゲーム ${gameId} 更新完了`)
    return NextResponse.json({
      success: true,
      data,
      message: 'Game updated successfully',
    })

  } catch (error) {
    console.error('Update game error:', error)
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
    const { id } = await params
    const gameId = parseInt(id)

    if (isNaN(gameId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid game ID' },
        { status: 400 }
      )
    }

    // Service role client for admin operations
    const serviceSupabase = createClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['SUPABASE_SERVICE_ROLE_KEY']!
    )

    console.log(`🗑️ ゲーム削除開始: ID ${gameId}`)

    const { error } = await serviceSupabase
      .from('games')
      .delete()
      .eq('id', gameId)

    if (error) {
      console.error(`❌ ゲーム ${gameId} 削除エラー:`, error)
      return NextResponse.json(
        { success: false, message: 'Failed to delete game' },
        { status: 500 }
      )
    }

    console.log(`✅ ゲーム ${gameId} 削除完了`)
    return NextResponse.json({
      success: true,
      message: 'Game deleted successfully',
    })

  } catch (error) {
    console.error('Delete game error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}