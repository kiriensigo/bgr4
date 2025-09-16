import { Game } from '@/domain/entities/Game'
import { GameRepository, GameFilters, PaginatedResult } from '@/domain/repositories/GameRepository'

export class MockGameRepository implements GameRepository {
  private games: Game[] = []
  private nextId = 1

  async findById(id: number): Promise<Game | null> {
    return this.games.find(game => game.id === id) || null
  }

  async findByBggId(bggId: string): Promise<Game | null> {
    return this.games.find(game => String(game.bggId) === bggId) || null
  }

  async findByName(name: string): Promise<Game[]> {
    return this.games.filter(game => game.name === name)
  }

  async searchByName(name: string): Promise<Game[]> {
    const searchLower = name.toLowerCase()
    return this.games.filter(game => 
      game.name.toLowerCase().includes(searchLower) ||
      (game.japaneseName && game.japaneseName.toLowerCase().includes(searchLower))
    )
  }

  async findAll(): Promise<Game[]> {
    return [...this.games]
  }

  async findMany(filters: GameFilters): Promise<PaginatedResult<Game>> {
    let filtered = [...this.games]

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(game => 
        game.name.toLowerCase().includes(searchLower) ||
        game.japaneseName?.toLowerCase().includes(searchLower)
      )
    }

    if (filters.category) {
      filtered = filtered.filter(game => 
        game.siteCategories.includes(filters.category!) ||
        game.bggCategories.includes(filters.category!)
      )
    }

    if (filters.mechanic) {
      filtered = filtered.filter(game => 
        game.siteMechanics.includes(filters.mechanic!) ||
        game.bggMechanics.includes(filters.mechanic!)
      )
    }

    if (filters.minPlayers) {
      filtered = filtered.filter(game => game.maxPlayers >= filters.minPlayers!)
    }

    if (filters.maxPlayers) {
      filtered = filtered.filter(game => game.minPlayers <= filters.maxPlayers!)
    }

    // Apply sorting
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        let aVal: any, bVal: any
        
        switch (filters.sortBy) {
          case 'name':
            aVal = a.name
            bVal = b.name
            break
          case 'rating_average':
            aVal = a.ratingAverage || 0
            bVal = b.ratingAverage || 0
            break
          case 'year_published':
            aVal = a.yearPublished || 0
            bVal = b.yearPublished || 0
            break
          case 'created_at':
            aVal = a.createdAt ? new Date(a.createdAt).getTime() : 0
            bVal = b.createdAt ? new Date(b.createdAt).getTime() : 0
            break
          default:
            return 0
        }
        
        if (aVal === undefined || aVal === null) return 1
        if (bVal === undefined || bVal === null) return -1
        
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return filters.sortOrder === 'desc' 
            ? bVal.localeCompare(aVal)
            : aVal.localeCompare(bVal)
        }
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return filters.sortOrder === 'desc' ? bVal - aVal : aVal - bVal
        }
        
        return 0
      })
    }

    // Apply pagination
    const page = filters.page || 1
    const limit = filters.limit || 20
    const offset = (page - 1) * limit
    const paginatedData = filtered.slice(offset, offset + limit)

    return {
      data: paginatedData,
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit)
    }
  }

  async save(game: Game): Promise<Game> {
    const now = new Date()
    const updatedGame = game.id 
      ? game.update({ updatedAt: now })
      : new Game({
          bggId: game.bggId,
          name: game.name,
          japaneseName: game.japaneseName,
          description: game.description,
          yearPublished: game.yearPublished,
          minPlayers: game.minPlayers,
          maxPlayers: game.maxPlayers,
          playingTime: game.playingTime,
          minAge: game.minAge,
          imageUrl: game.imageUrl,
          thumbnailUrl: game.thumbnailUrl,
          bggCategories: game.bggCategories,
          bggMechanics: game.bggMechanics,
          bggPublishers: game.bggPublishers,
          siteCategories: game.siteCategories,
          siteMechanics: game.siteMechanics,
          sitePublishers: game.sitePublishers,
          designers: game.designers,
          ratingAverage: game.ratingAverage,
          ratingCount: game.ratingCount,
          createdAt: now,
          updatedAt: now
        })

    if (!game.id) {
      // Assign ID for new games
      const gameWithId = new Game({
        id: this.nextId++,
        bggId: updatedGame.bggId,
        name: updatedGame.name,
        japaneseName: updatedGame.japaneseName,
        description: updatedGame.description,
        yearPublished: updatedGame.yearPublished,
        minPlayers: updatedGame.minPlayers,
        maxPlayers: updatedGame.maxPlayers,
        playingTime: updatedGame.playingTime,
        minAge: updatedGame.minAge,
        imageUrl: updatedGame.imageUrl,
        thumbnailUrl: updatedGame.thumbnailUrl,
        bggCategories: updatedGame.bggCategories,
        bggMechanics: updatedGame.bggMechanics,
        bggPublishers: updatedGame.bggPublishers,
        siteCategories: updatedGame.siteCategories,
        siteMechanics: updatedGame.siteMechanics,
        sitePublishers: updatedGame.sitePublishers,
        designers: updatedGame.designers,
        ratingAverage: updatedGame.ratingAverage,
        ratingCount: updatedGame.ratingCount,
        createdAt: updatedGame.createdAt,
        updatedAt: updatedGame.updatedAt
      })
      this.games.push(gameWithId)
      return gameWithId
    } else {
      // Update existing game
      const gameIndex = this.games.findIndex(g => g.id === game.id)
      if (gameIndex === -1) {
        throw new Error(`Game with id ${game.id} not found`)
      }
      this.games[gameIndex] = updatedGame
      return updatedGame
    }
  }

  async update(game: Game): Promise<Game> {
    if (!game.id) {
      throw new Error('Game ID is required for update')
    }

    const gameIndex = this.games.findIndex(g => g.id === game.id)
    if (gameIndex === -1) {
      throw new Error(`Game with id ${game.id} not found`)
    }

    const updatedGame = game.update({ updatedAt: new Date() })
    this.games[gameIndex] = updatedGame
    return updatedGame
  }

  async delete(id: number): Promise<void> {
    const gameIndex = this.games.findIndex(game => game.id === id)
    if (gameIndex === -1) {
      throw new Error(`Game with id ${id} not found`)
    }

    this.games.splice(gameIndex, 1)
  }

  async exists(bggId: string): Promise<boolean> {
    return this.games.some(game => String(game.bggId) === bggId)
  }

  async updateRatingStatistics(gameId: number): Promise<void> {
    // Mock implementation - in real scenario this would calculate from reviews
    const gameIndex = this.games.findIndex(g => g.id === gameId)
    if (gameIndex >= 0) {
      const game = this.games[gameIndex]
      if (game) {
        const updatedGame = game.update({ 
          ratingCount: (game.ratingCount || 0) + 1,
          updatedAt: new Date()
        })
        this.games[gameIndex] = updatedGame
      }
    }
  }

  // Test helper methods
  clear(): void {
    this.games = []
    this.nextId = 1
  }

  getAll(): Game[] {
    return [...this.games]
  }

  count(): number {
    return this.games.length
  }
}