import { NextRequest, NextResponse } from 'next/server'
import { getGameUseCase, registerServices } from '@/application/container'
import { ErrorHandler } from '@/application/errors/ErrorHandler'

export async function GET(request: NextRequest) {
  try {
    await registerServices()
    const gameUseCase = await getGameUseCase()
    
    // Parse filters from search params
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const mechanic = searchParams.get('mechanic')
    const sortBy = searchParams.get('sortBy')
    
    const filters = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      ...(search && { search }),
      ...(category && { category }),
      ...(mechanic && { mechanic }),
      sortBy: (['name', 'year_published', 'rating_average', 'created_at'].includes(sortBy === 'calculated_score' ? 'rating_average' : sortBy || '') ? (sortBy === 'calculated_score' ? 'rating_average' : sortBy) : 'rating_average') as 'name' | 'year_published' | 'rating_average' | 'created_at',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'
    }

    const result = await gameUseCase.searchGames({ filters })

    // minimize payload for list view
    const games = result.data.map((game: any) => {
      const p = game.toPlainObject ? game.toPlainObject() : game
      return {
        id: p.id,
        name: p.name,
        japanese_name: p.japanese_name ?? p.name_jp ?? p.nameJp,
        image_url: p.image_url ?? p.imageUrl ?? p.thumbnail_url ?? p.thumbnailUrl,
        thumbnail_url: p.thumbnail_url ?? p.thumbnailUrl ?? p.image_url ?? p.imageUrl,
        year_published: p.year_published ?? p.yearPublished,
        min_players: p.min_players ?? p.minPlayers,
        max_players: p.max_players ?? p.maxPlayers,
        playing_time: p.playing_time ?? p.playingTime,
        min_playing_time: p.min_playing_time ?? p.minPlayingTime,
        max_playing_time: p.max_playing_time ?? p.maxPlayingTime,
        rating_average: p.rating_average ?? p.ratingAverage,
        rating_count: p.rating_count ?? p.ratingCount,
      }
    })

    return NextResponse.json(
      {
        games,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    )
    
  } catch (error) {
    return ErrorHandler.handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await registerServices()
    const gameUseCase = await getGameUseCase()
    
    // Get user ID from headers (set by middleware after auth)
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { game, auto_register, manual_registration } = body
    
    if (manual_registration) {
      const result = await gameUseCase.createGameManually({
        name: game.name,
        japaneseName: game.japanese_name,
        minPlayers: game.min_players,
        maxPlayers: game.max_players,
        playingTime: game.play_time,
        userId
      })
      return NextResponse.json(result.toPlainObject(), { status: 201 })
    } else {
      const result = await gameUseCase.createGameFromBGG({
        bggId: game.bggId || game.bgg_id,
        userId,
        autoRegister: auto_register
      })
      return NextResponse.json(result.toPlainObject(), { status: 201 })
    }
  } catch (error) {
    return ErrorHandler.handleApiError(error)
  }
}
