import { NextRequest, NextResponse } from 'next/server'
import { registerServices, getReviewUseCase } from '@/application/container'

export async function GET(request: NextRequest) {
  try {
    await registerServices()
    const reviewUseCase = await getReviewUseCase()
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const gameId = searchParams.get('gameId')
    const userId = searchParams.get('userId')
    const published = searchParams.get('published')

    // バリデーション
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { success: false, message: 'Invalid pagination parameters' },
        { status: 400 }
      )
    }

    const filters = {
      page,
      limit,
      ...(gameId && { gameId: parseInt(gameId) }),
      ...(userId && { userId }),
      ...(published !== null && { isPublished: published === 'true' })
    }

    const result = await reviewUseCase.searchReviews({ filters })

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNext: result.page < result.totalPages,
        hasPrev: result.page > 1,
      },
    })

  } catch (error) {
    console.error('Local Reviews API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await registerServices()
    const reviewUseCase = await getReviewUseCase()
    const body = await request.json()
    
    const { 
      title, content, rating, overall_score,
      rule_complexity, luck_factor, interaction, downtime,
      recommended_players, mechanics, categories, custom_tags,
      play_time_actual, player_count_played,
      pros, cons, is_published, game_id, user_id 
    } = body

    const reviewInput = {
      title,
      content,
      rating: rating || overall_score || 7,
      overallScore: overall_score || rating || 7,
      ruleComplexity: rule_complexity || 3,
      luckFactor: luck_factor || 3,
      interaction: interaction || 3,
      downtime: downtime || 3,
      recommendedPlayers: recommended_players || [],
      mechanics: mechanics || [],
      categories: categories || [],
      customTags: custom_tags || [],
      playTimeActual: play_time_actual,
      playerCountPlayed: player_count_played,
      pros: pros || [],
      cons: cons || [],
      gameId: game_id,
      userId: user_id,
      isPublished: is_published ?? true
    }

    const review = await reviewUseCase.createReview(reviewInput)

    return NextResponse.json({
      success: true,
      data: review,
      message: 'Review created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Create review API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}