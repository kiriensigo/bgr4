import { NextRequest, NextResponse } from 'next/server'
import { getGameDetail } from '@/lib/bgg-api'
import { BGGApiError } from '@/types/bgg'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const gameId = parseInt(id)
    
    if (isNaN(gameId) || gameId <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid game ID' },
        { status: 400 }
      )
    }
    
    const game = await getGameDetail(gameId)
    
    if (!game) {
      return NextResponse.json(
        { success: false, message: 'Game not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: game
    })
    
  } catch (error) {
    console.error('BGG Game Detail API Error:', error)
    
    if (error instanceof BGGApiError) {
      const statusCode = error.statusCode || 500
      return NextResponse.json(
        { 
          success: false, 
          message: statusCode === 404 
            ? 'Game not found in BGG database' 
            : 'BGG API service temporarily unavailable. Please try again later.',
          error: error.message 
        },
        { status: statusCode }
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error occurred while fetching game details' 
      },
      { status: 500 }
    )
  }
}