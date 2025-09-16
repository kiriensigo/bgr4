import { NextRequest, NextResponse } from 'next/server'
import { getBggRankings } from '@/lib/bgg-api'
import { BGGApiError } from '@/types/bgg'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'boardgame'
    const page = parseInt(searchParams.get('page') || '1')
    
    if (page < 1 || page > 20) {
      return NextResponse.json(
        { success: false, message: 'Page must be between 1 and 20' },
        { status: 400 }
      )
    }
    
    const rankings = await getBggRankings(type, page)
    
    return NextResponse.json({
      success: true,
      data: rankings,
      page,
      message: `Retrieved ${rankings.length} ranked games`
    })
    
  } catch (error) {
    console.error('BGG Rankings API Error:', error)
    
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
        message: 'Internal server error occurred while fetching rankings' 
      },
      { status: 500 }
    )
  }
}