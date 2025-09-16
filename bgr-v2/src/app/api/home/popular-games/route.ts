import { NextResponse } from 'next/server'
import { getGameUseCase, registerServices } from '@/application/container'
import { PresentationAdapter } from '../../adapters/PresentationAdapter'

export async function GET() {
  try {
    // Ensure services are registered
    await registerServices()
    
    const gameUseCase = await getGameUseCase()
    
    // Get games sorted by rating for popular games
    const popularGames = await gameUseCase.searchGames({
      filters: {
        page: 1,
        limit: 6,
        sortBy: 'rating_average',
        sortOrder: 'desc'
      }
    })
    
    // Transform Domain Entities to presentation format
    const transformedGames = popularGames.data.map(game => 
      PresentationAdapter.gameToPopularGameResponse(game)
    )
    
    return NextResponse.json({
      success: true,
      data: transformedGames
    })

  } catch (error) {
    console.error('Popular games API error:', error)
    
    // フォールバック用の空データ
    return NextResponse.json({
      success: true,
      data: []
    })
  }
}