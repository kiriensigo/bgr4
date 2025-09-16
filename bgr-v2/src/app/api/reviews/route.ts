import { NextRequest, NextResponse } from 'next/server'
import { getReviewUseCase, registerServices } from '@/application/container'
import { ErrorHandler } from '@/application/errors/ErrorHandler'

// Force recompilation

export async function GET(request: NextRequest) {
  try {
    await registerServices()
    const reviewUseCase = await getReviewUseCase()
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const gameId = searchParams.get('game_id')
    const userId = searchParams.get('user_id')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    const filters = {
      page,
      limit,
      ...(gameId && { gameId: parseInt(gameId) }),
      ...(userId && { userId }),
      sortBy: sortBy as any,
      sortOrder: sortOrder as 'asc' | 'desc',
      isPublished: true
    }

    const result = await reviewUseCase.searchReviews({ filters })
    
    // Transform the Review entities to enhanced review format for frontend
    // We'll use the rawData if available, otherwise fallback to the entity data
    const rawData = (result as any).rawData || []
    const enhancedReviews = rawData.length > 0 ? rawData.map((item: any) => ({
      id: item.id,
      title: item.title,
      content: item.content,
      overall_score: item.overall_score,
      rating: item.rating,
      rule_complexity: item.complexity_score,
      luck_factor: item.luck_factor,
      interaction: item.interaction_score,
      downtime: item.downtime_score,
      recommended_players: [], // Will be populated from tag extraction
      mechanics: [], // Will be populated from tag extraction
      categories: [], // Will be populated from tag extraction
      custom_tags: [],
      play_time_actual: item.play_time_actual,
      player_count_played: item.player_count_played,
      pros: item.pros,
      cons: item.cons,
      user_id: item.user_id,
      game_id: item.game_id,
      is_published: item.is_published,
      created_at: item.created_at,
      updated_at: item.updated_at,
      // Include joined data (no japanese_name since it doesn't exist in DB)
      games: item.games ? {
        id: item.games.id,
        name: item.games.name,
        japanese_name: item.games.name, // Use regular name as fallback
        image_url: item.games.image_url,
        bgg_id: item.games.bgg_id?.toString() || item.games.id?.toString()
      } : undefined,
      profiles: item.profiles ? {
        id: item.profiles.id,
        username: item.profiles.username,
        full_name: item.profiles.full_name,
        avatar_url: item.profiles.avatar_url
      } : undefined
    })) : result.data.map(review => ({
      id: review.id,
      title: review.title,
      content: review.content,
      overall_score: review.overallScore,
      rating: review.rating,
      rule_complexity: review.ruleComplexity,
      luck_factor: review.luckFactor,
      interaction: review.interaction,
      downtime: review.downtime,
      recommended_players: review.recommendedPlayers,
      mechanics: review.mechanics,
      categories: review.categories,
      custom_tags: review.customTags,
      play_time_actual: review.playTimeActual,
      player_count_played: review.playerCountPlayed,
      pros: review.pros,
      cons: review.cons,
      user_id: review.userId,
      game_id: review.gameId,
      is_published: review.isPublished,
      created_at: review.createdAt,
      updated_at: review.updatedAt,
      games: undefined,
      profiles: undefined
    }))
    
    return NextResponse.json({
      reviews: enhancedReviews,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    })
    
  } catch (error) {
    return ErrorHandler.handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await registerServices()
    const reviewUseCase = await getReviewUseCase()
    
    // Get user ID from headers (set by middleware after auth)
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { 
      game_id, 
      gameId,
      title, 
      content, 
      rating,
      ratings,
      overall_score,
      rule_complexity,
      luck_factor,
      interaction,
      downtime,
      pros = [],
      cons = [],
      categories = [],
      mechanics = [],
      custom_tags = [],
      tags = [],
      recommendedPlayers = [],
      recommended_players = [],
      play_time_actual,
      player_count_played,
      comment,
      is_published = true
    } = body
    
    // Support both v1 and v2 review formats
    const finalGameId = gameId || game_id
    const finalTitle = title || `${ratings?.overall || overall_score || rating}/10点のレビュー`
    const finalContent = content || comment || ''
    const finalRecommendedPlayers = recommendedPlayers.length > 0 ? recommendedPlayers : recommended_players
    const finalTags = tags.length > 0 ? tags : custom_tags
    
    const reviewInput = {
      title: finalTitle,
      content: finalContent,
      rating: rating || Math.round(ratings?.overall || overall_score || 5),
      overallScore: ratings?.overall || overall_score || rating || 5,
      ruleComplexity: ratings?.complexity || rule_complexity || 3,
      luckFactor: ratings?.luck || luck_factor || 3,
      interaction: ratings?.interaction || interaction || 3,
      downtime: ratings?.downtime || downtime || 3,
      recommendedPlayers: finalRecommendedPlayers,
      mechanics,
      categories,
      customTags: finalTags,
      playTimeActual: play_time_actual,
      playerCountPlayed: player_count_played,
      pros,
      cons,
      gameId: finalGameId,
      userId,
      isPublished: is_published
    }
    
    const newReview = await reviewUseCase.createReview(reviewInput)
    
    return NextResponse.json(newReview, { status: 201 })
    
  } catch (error) {
    return ErrorHandler.handleApiError(error)
  }
}

