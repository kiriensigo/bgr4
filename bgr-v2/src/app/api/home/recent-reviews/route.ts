import { NextResponse } from 'next/server'
import { getReviewUseCase, registerServices } from '@/application/container'
import { PresentationAdapter } from '../../adapters/PresentationAdapter'

export async function GET() {
  try {
    // Ensure services are registered
    await registerServices()
    
    const reviewUseCase = await getReviewUseCase()
    const reviews = await reviewUseCase.getRecentReviews(6)
    
    // Transform Domain Entities to presentation format
    const transformedReviews = reviews.map(review => 
      PresentationAdapter.reviewToResponse(review)
    )
    
    return NextResponse.json({
      success: true,
      data: transformedReviews
    })

  } catch (error) {
    console.error('Recent reviews API error:', error)
    
    // フォールバック用の空データ
    return NextResponse.json({
      success: true,
      data: []
    })
  }
}