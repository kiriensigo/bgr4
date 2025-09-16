import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    
    if (action === 'migrate_games') {
      return NextResponse.json({
        success: false,
        message: 'Game migration moved to UseCase layer'
      })
    }

    if (action === 'migrate_reviews') {
      return NextResponse.json({
        success: false,
        message: 'Review migration moved to UseCase layer'
      })
    }

    if (action === 'migrate_all') {
      return NextResponse.json({
        success: false,
        message: 'Migration functionality moved to UseCase layer'
      })
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action. Use migrate_games, migrate_reviews, or migrate_all' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Supabase seed API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'status') {
      // Supabaseデータベースの状況を確認
      const [gamesResult, reviewsResult, profilesResult] = await Promise.all([
        supabaseAdmin.from('games').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('reviews').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true })
      ])

      return NextResponse.json({
        success: true,
        status: {
          games: gamesResult.count || 0,
          reviews: reviewsResult.count || 0,
          profiles: profilesResult.count || 0
        },
        errors: [
          gamesResult.error,
          reviewsResult.error,
          profilesResult.error
        ].filter(Boolean)
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase seed API is ready',
      actions: ['migrate_games', 'migrate_reviews', 'migrate_all', 'status']
    })

  } catch (error) {
    console.error('Supabase seed API GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}