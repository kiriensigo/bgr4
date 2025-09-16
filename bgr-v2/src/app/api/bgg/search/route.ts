import { NextRequest, NextResponse } from 'next/server'
import { searchGames } from '@/lib/bgg-api'
import { BGGApiError } from '@/types/bgg'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Search query is required' },
        { status: 400 }
      )
    }
    
    if (query.length < 2) {
      return NextResponse.json(
        { success: false, message: 'Search query must be at least 2 characters long' },
        { status: 400 }
      )
    }
    
    const results = await searchGames(query.trim())
    
    return NextResponse.json({
      success: true,
      data: results,
      message: `Found ${results.length} games`
    })
    
  } catch (error) {
    console.error('BGG Search API Error:', error)
    
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
        message: 'Internal server error occurred while searching games' 
      },
      { status: 500 }
    )
  }
}