import { NextResponse } from 'next/server'
import { getGameUseCase, getReviewUseCase, registerServices } from '@/application/container'

export async function GET() {
  try {
    // Ensure services are registered
    await registerServices()
    
    const gameUseCase = await getGameUseCase()
    const reviewUseCase = await getReviewUseCase()
    
    // Get basic counts from repositories
    const [gamesResult, recentReviews] = await Promise.all([
      gameUseCase.searchGames({ filters: { page: 1, limit: 1 } }),
      reviewUseCase.getRecentReviews(100) // Get more for calculations
    ])
    
    const totalGames = gamesResult.total
    const totalReviews = recentReviews.length
    const averageRating = totalReviews > 0
      ? recentReviews.reduce((sum, r) => sum + (r.rating || r.overallScore), 0) / totalReviews
      : 0
    
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    
    const reviewsThisMonth = recentReviews.filter(
      r => r.createdAt && new Date(r.createdAt) > oneMonthAgo
    ).length
    
    const activeReviewers = new Set(
      recentReviews
        .filter(r => r.createdAt && new Date(r.createdAt) > oneMonthAgo)
        .map(r => r.userId)
    ).size
    
    const stats = {
      totalReviews,
      totalGames,
      activeReviewers,
      averageRating: Math.round(averageRating * 10) / 10,
      reviewsThisMonth,
      detailedReviews: recentReviews.filter(r => r.ruleComplexity && r.luckFactor).length
    }
    
    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Home stats API error:', error)
    
    // フォールバック用のモックデータ
    const fallbackStats = {
      totalReviews: 0,
      totalGames: 0,
      activeReviewers: 0,
      averageRating: 0,
      reviewsThisMonth: 0,
      detailedReviews: 0
    }

    return NextResponse.json({
      success: true,
      data: fallbackStats
    })
  }
}