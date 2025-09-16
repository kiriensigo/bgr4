import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

    const query = `
      SELECT 
        id, bgg_id, name, description, year_published,
        min_players, max_players, playing_time, min_age,
        image_url, thumbnail_url, mechanics, categories,
        designers, publishers, rating_average, rating_count,
        created_at, updated_at
      FROM games 
      WHERE id = $1
    `

    const result = await db.query(query, [gameId])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Game not found' },
        { status: 404 }
      )
    }

    const game = {
      ...result.rows[0],
      rating_average: result.rows[0].rating_average ? parseFloat(result.rows[0].rating_average) : null,
    }

    return NextResponse.json({
      success: true,
      data: game,
    })

  } catch (error) {
    console.error('Local Game detail API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}