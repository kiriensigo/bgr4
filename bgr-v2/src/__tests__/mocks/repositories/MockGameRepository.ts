import { Game } from '@/types/game'
import { GameRepository, GameFilters, PaginatedResult } from '@/domain/repositories/GameRepository'

export class MockGameRepository implements GameRepository {
  private games: Game[] = []
  private nextId = 1

  setMockData(games: Game[]): void {
    this.games = games
    this.nextId = Math.max(...games.map(g => g.id), 0) + 1
  }

  async findById(id: number): Promise<Game | null> {
    return this.games.find(game => game.id === id) || null
  }

  async findByBggId(bggId: number): Promise<Game | null> {
    return this.games.find(game => Number(game.bgg_id) === bggId) || null
  }

  async findMany(filters: GameFilters): Promise<PaginatedResult<Game>> {
    let filteredGames = [...this.games]

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filteredGames = filteredGames.filter(game => 
        game.name.toLowerCase().includes(searchLower) ||
        (game.japanese_name && game.japanese_name.toLowerCase().includes(searchLower))
      )
    }

    if (filters.category) {
      filteredGames = filteredGames.filter(game => 
        game.site_categories.includes(filters.category!)
      )
    }

    if (filters.mechanic) {
      filteredGames = filteredGames.filter(game => 
        game.site_mechanics.includes(filters.mechanic!)
      )
    }

    if (filters.minPlayers) {
      filteredGames = filteredGames.filter(game => 
        game.max_players >= filters.minPlayers!
      )
    }

    if (filters.maxPlayers) {
      filteredGames = filteredGames.filter(game => 
        game.min_players <= filters.maxPlayers!
      )
    }

    // Apply sorting
    const sortBy = filters.sortBy || 'rating_average'
    const sortOrder = filters.sortOrder || 'desc'
    
    filteredGames.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortBy) {
        case 'name':
          aValue = a.name
          bValue = b.name
          break
        case 'rating_average':
          aValue = a.rating_average || 0
          bValue = b.rating_average || 0
          break
        case 'year_published':
          aValue = a.year_published || 0
          bValue = b.year_published || 0
          break
        case 'created_at':
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        default:
          return 0
      }

      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : bValue < aValue ? -1 : 0
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
      }
    })

    // Apply pagination
    const page = filters.page || 1
    const limit = filters.limit || 20
    const offset = (page - 1) * limit
    const paginatedGames = filteredGames.slice(offset, offset + limit)

    return {
      data: paginatedGames,
      total: filteredGames.length,
      page,
      limit,
      totalPages: Math.ceil(filteredGames.length / limit)
    }
  }

  async save(gameData: Omit<Game, 'id' | 'created_at' | 'updated_at'>): Promise<Game> {
    const newGame: Game = {
      ...gameData,
      id: this.nextId++,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    this.games.push(newGame)
    return newGame
  }

  async update(id: number, updates: Partial<Game>): Promise<Game> {
    const index = this.games.findIndex(game => game.id === id)
    if (index === -1) {
      throw new Error(`Game with id ${id} not found`)
    }

    const updatedGame = {
      ...this.games[index],
      ...updates,
      updated_at: new Date().toISOString()
    }

    this.games[index] = updatedGame
    return updatedGame
  }

  async delete(id: number): Promise<void> {
    const index = this.games.findIndex(game => game.id === id)
    if (index === -1) {
      throw new Error(`Game with id ${id} not found`)
    }

    this.games.splice(index, 1)
  }

  async exists(bggId: number): Promise<boolean> {
    return this.games.some(game => Number(game.bgg_id) === bggId)
  }

  async updateRatingStatistics(gameId: number): Promise<void> {
    // Mock implementation - in real scenario would calculate from reviews
    const game = await this.findById(gameId)
    if (game) {
      game.rating_average = 7.5
      game.rating_count = 10
      game.updated_at = new Date().toISOString()
    }
  }

  // Test utility methods
  reset(): void {
    this.games = []
    this.nextId = 1
  }

  getAll(): Game[] {
    return [...this.games]
  }
}