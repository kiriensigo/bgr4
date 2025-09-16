import { NextResponse } from 'next/server'
import { getHotGames } from '@/lib/bgg-api'
import { BGGApiError } from '@/types/bgg'

export async function GET() {
  try {
    const hotGames = await getHotGames()
    
    return NextResponse.json({
      success: true,
      data: hotGames,
      message: `Retrieved ${hotGames.length} hot games`
    })
    
  } catch (error) {
    console.error('BGG Hot Games API Error:', error)
    
    if (error instanceof BGGApiError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'BGG API service temporarily unavailable. Please try again later.',
          error: error.message 
        },
        { status: error.statusCode || 500 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error occurred while fetching hot games' 
      },
      { status: 500 }
    )
  }
}