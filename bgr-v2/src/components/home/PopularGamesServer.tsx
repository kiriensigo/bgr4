import { PopularGames } from './PopularGames'
import { registerServices, getGameUseCase } from '@/application/container'
import { PresentationAdapter } from '@/app/api/adapters/PresentationAdapter'

export default async function PopularGamesServer() {
  try {
    await registerServices()
    const gameUseCase = await getGameUseCase()
    const popular = await gameUseCase.searchGames({
      filters: { page: 1, limit: 6, sortBy: 'rating_average', sortOrder: 'desc' }
    })
    const games = popular.data.map((g: any) => PresentationAdapter.gameToPopularGameResponse(g))
    return <PopularGames games={games} />
  } catch (e) {
    console.warn('PopularGamesServer failed, returning empty list')
    return <PopularGames games={[]} />
  }
}
