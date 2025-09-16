import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// ウィッシュリスト状態確認
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
    const gameId = searchParams.get('gameId')
    
    if (!gameId) {
      return NextResponse.json(
        { success: false, message: 'Game ID is required' },
        { status: 400 }
      )
    }
    
    const gameIdNum = parseInt(gameId)
    if (isNaN(gameIdNum) || gameIdNum <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid Game ID' },
        { status: 400 }
      )
    }
    
    // ウィッシュリストに存在するかチェック
    const { data, error } = await supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', user.id)
      .eq('game_id', gameIdNum)
      .single()
    
    // エラーは404（見つからない）の場合は正常（ウィッシュリストにない）
    const inWishlist = data !== null && !error
    
    return NextResponse.json({
      success: true,
      inWishlist,
      gameId: gameIdNum
    })
    
  } catch (error) {
    console.error('Wishlist check error:', error)
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