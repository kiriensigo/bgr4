import { Game, GameProps } from '@/domain/entities/Game'
import { GameFilters, PaginatedResult } from '@/domain/repositories/GameRepository'

export interface CreateGameFromBGGInput {
  bggId: number
  userId: string
  autoRegister?: boolean
}

export interface CreateGameManuallyInput {
  name: string
  japaneseName: string
  minPlayers?: number
  maxPlayers?: number
  playingTime?: number
  userId: string
}

export interface SearchGamesInput {
  filters: GameFilters
}

export interface GameUseCase {
  createGameFromBGG(input: CreateGameFromBGGInput): Promise<Game>
  createGameManually(input: CreateGameManuallyInput): Promise<Game>
  searchGames(input: SearchGamesInput): Promise<PaginatedResult<Game>>
  getGameById(id: number): Promise<Game>
  getGameByBggId(bggId: number): Promise<Game>
  updateGame(id: number, updates: Partial<GameProps>): Promise<Game>
  deleteGame(id: number): Promise<void>
  checkGameExists(bggId: number): Promise<boolean>
}