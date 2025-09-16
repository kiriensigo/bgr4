import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // バリデーション
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { success: false, message: 'Invalid pagination parameters' },
        { status: 400 }
      )
    }

    const offset = (page - 1) * limit

    // ゲーム一覧を取得
    const gamesQuery = `
      SELECT 
        id, bgg_id, name, description, year_published,
        min_players, max_players, playing_time, min_age,
        image_url, thumbnail_url, mechanics, categories,
        designers, publishers, rating_average, rating_count,
        created_at, updated_at
      FROM games 
      ORDER BY rating_average DESC NULLS LAST, created_at DESC
      LIMIT $1 OFFSET $2
    `

    const countQuery = 'SELECT COUNT(*) as total FROM games'

    const [gamesResult, countResult] = await Promise.all([
      db.query(gamesQuery, [limit, offset]),
      db.query(countQuery)
    ])

    const games = gamesResult.rows.map(game => ({
      ...game,
      rating_average: game.rating_average ? parseFloat(game.rating_average) : null,
    }))
    const total = parseInt(countResult.rows[0].total)
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: games,
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
    console.error('Local Games API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}