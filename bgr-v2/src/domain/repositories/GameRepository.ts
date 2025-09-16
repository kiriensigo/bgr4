import { Game } from '../entities/Game'

export interface GameFilters {
  search?: string
  category?: string
  mechanic?: string
  minPlayers?: number
  maxPlayers?: number
  yearPublished?: number
  sortBy?: 'name' | 'rating_average' | 'year_published' | 'created_at'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface GameRepository {
  findById(id: number): Promise<Game | null>
  findByBggId(bggId: string): Promise<Game | null>
  findByName(name: string): Promise<Game[]>
  searchByName(name: string): Promise<Game[]>
  findAll(): Promise<Game[]>
  findMany(filters: GameFilters): Promise<PaginatedResult<Game>>
  save(game: Game): Promise<Game>
  update(game: Game): Promise<Game>
  delete(id: number): Promise<void>
  exists(bggId: string): Promise<boolean>
  updateRatingStatistics(gameId: number): Promise<void>
}