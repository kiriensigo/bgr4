import { Game, GameProps } from '@/domain/entities/Game'
import { GameRepository, PaginatedResult } from '@/domain/repositories/GameRepository'
import { MappingService } from '@/domain/services/MappingService'
import { JapaneseGameIdService } from '@/infrastructure/services/JapaneseGameIdService'
import { getBggGameDetails } from '@/lib/bgg'
import { 
  GameUseCase, 
  CreateGameFromBGGInput, 
  CreateGameManuallyInput, 
  SearchGamesInput 
} from './GameUseCase'
import { 
  GameNotFoundError, 
  ValidationError, 
  ConflictError, 
  BGGApiError 
} from '@/domain/errors/DomainErrors'

export class GameUseCaseImpl implements GameUseCase {
  constructor(
    private gameRepository: GameRepository,
    private mappingService: MappingService,
    private japaneseGameIdService: JapaneseGameIdService
  ) {}

  async createGameFromBGG(input: CreateGameFromBGGInput): Promise<Game> {
    const { bggId, autoRegister = false } = input

    // Validate BGG ID
    if (!bggId || bggId <= 0) {
      throw new ValidationError(['BGG ID is required and must be positive'])
    }

    // Check if game already exists
    const existingGame = await this.gameRepository.findByBggId(String(bggId))
    if (existingGame) {
      if (!autoRegister) {
        throw new ConflictError('Game already exists', { gameId: existingGame.id })
      }
      return existingGame
    }

    try {
      // Fetch from BGG API
      const bggGame = await getBggGameDetails(bggId)
      const bestPlayerCounts = Array.isArray(bggGame.bestPlayerCounts) ? bggGame.bestPlayerCounts : []
      const recommendedPlayerCountsRaw = Array.isArray(bggGame.recommendedPlayerCounts) ? bggGame.recommendedPlayerCounts : []
      const recommendedPlayerCounts = Array.from(new Set(recommendedPlayerCountsRaw.filter(count => !bestPlayerCounts.includes(count))))

      // Map BGG data to site data
      const mappingResult = this.mappingService.mapBGGToSiteData(
        bggGame.categories || [],
        bggGame.mechanics || [],
        bggGame.publishers || [],
        bestPlayerCounts,
        recommendedPlayerCounts
      )

      // Create game entity; keep site-specific ID (auto or JP range) and store BGG ID separately
      const game = new Game({
        bggId: bggId,
        name: bggGame.name,
        japaneseName: '',
        ...(bggGame.description && { description: bggGame.description }),
        ...(bggGame.yearPublished && { yearPublished: bggGame.yearPublished }),
        minPlayers: bggGame.minPlayers || 1,
        maxPlayers: bggGame.maxPlayers || 1,
        ...(bggGame.playingTime && { playingTime: bggGame.playingTime }),
        ...(bggGame.minPlayingTime && { minPlayingTime: bggGame.minPlayingTime }),
        ...(bggGame.maxPlayingTime && { maxPlayingTime: bggGame.maxPlayingTime }),
        ...(bggGame.minAge && { minAge: bggGame.minAge }),
        ...(bggGame.imageUrl && { imageUrl: bggGame.imageUrl }),
        ...(bggGame.thumbnailUrl && { thumbnailUrl: bggGame.thumbnailUrl }),
        
        // BGG original data
        bggCategories: bggGame.categories || [],
        bggMechanics: bggGame.mechanics || [],
        bggPublishers: bggGame.publishers || [],
        bggBestPlayers: bestPlayerCounts,
        bggRecommendedPlayers: recommendedPlayerCounts,
        
        // Site-specific mapped data
        siteCategories: mappingResult.siteCategories,
        siteMechanics: mappingResult.siteMechanics,
        sitePublishers: mappingResult.normalizedPublishers,
        
        designers: bggGame.designers || [],
        ratingAverage: bggGame.averageRating || 0,
        ratingCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Save to database
      const savedGame = await this.gameRepository.save(game)
      
      return savedGame

    } catch (error) {
      if (error instanceof Error && error.message.includes('BGG')) {
        throw new BGGApiError(`Failed to fetch game from BGG: ${error.message}`)
      }
      throw error
    }
  }

  async createGameManually(input: CreateGameManuallyInput): Promise<Game> {
    const { name, japaneseName, minPlayers = 1, maxPlayers = 4, playingTime = 60 } = input

    // Validate required fields
    if (!name || !japaneseName) {
      throw new ValidationError(['Name and Japanese name are required'])
    }

    // Check for duplicate Japanese name
    const existingGame = await this.gameRepository.findMany({
      search: japaneseName,
      limit: 1
    })

    if (existingGame.data.length > 0) {
      throw new ConflictError('Game with this Japanese name already exists', {
        existingGameId: existingGame.data[0]?.id
      })
    }

    // Generate Japanese game ID (10,000,000 range)
    const japaneseGameId = await this.japaneseGameIdService.generateNextId()

    // Create game entity
    const game = new Game({
      id: japaneseGameId,
      bggId: `jp-${japaneseGameId}`,
      name,
      japaneseName: japaneseName,
      description: '',
      minPlayers: minPlayers || 1,
      maxPlayers: maxPlayers || 1,
      playingTime: playingTime,
      
      // Empty BGG data for manual games
      bggCategories: [],
      bggMechanics: [],
      bggPublishers: [],
      
      // Empty site data (can be added later)
      siteCategories: [],
      siteMechanics: [],
      sitePublishers: [],
      
      designers: [],
      ratingAverage: 0,
      ratingCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    return await this.gameRepository.save(game)
  }

  async searchGames(input: SearchGamesInput): Promise<PaginatedResult<Game>> {
    return await this.gameRepository.findMany(input.filters)
  }

  async getGameById(id: number): Promise<Game> {
    const game = await this.gameRepository.findById(id)
    if (!game) {
      throw new GameNotFoundError(id)
    }
    return game
  }

  async getGameByBggId(bggId: number): Promise<Game> {
    const game = await this.gameRepository.findByBggId(String(bggId))
    if (!game) {
      throw new GameNotFoundError(bggId, `Game with BGG ID ${bggId} not found`)
    }
    return game
  }

  async updateGame(id: number, updates: Partial<GameProps>): Promise<Game> {
    // Get existing game
    const existingGame = await this.getGameById(id)
    
    // Update the game entity
    const updatedGame = existingGame.update(updates)
    
    return await this.gameRepository.update(updatedGame)
  }

  async deleteGame(id: number): Promise<void> {
    // Verify game exists
    await this.getGameById(id)
    
    await this.gameRepository.delete(id)
  }

  async checkGameExists(bggId: number): Promise<boolean> {
    return await this.gameRepository.exists(String(bggId))
  }

  async createJapaneseGame(input: {
    name: string
    nameJp?: string
    description: string
    yearPublished?: number
    minPlayers: number
    maxPlayers: number
    minPlayingTime?: number
    maxPlayingTime?: number
    playingTime?: number
    designers: string[]
    publishers: string[]
    mechanics: string[]
    categories: string[]
    imageUrl?: string
  }): Promise<Game> {
    // 日本独自ゲーム用IDを生成
    const japaneseId = await this.japaneseGameIdService.generateNextId()

    // バリデーション
    if (input.maxPlayers < input.minPlayers) {
      throw new ValidationError(['最大人数は最小人数以上で設定してください'])
    }

    if (input.maxPlayingTime && input.minPlayingTime && input.maxPlayingTime < input.minPlayingTime) {
      throw new ValidationError(['最大プレイ時間は最小プレイ時間以上で設定してください'])
    }

    // Game entityを作成
    const game = new Game({
      id: japaneseId,
      bggId: undefined, // 日本独自ゲームはBGG IDなし
      name: input.name,
      // nameJp: input.nameJp, // Not in GameProps
      description: input.description,
      yearPublished: input.yearPublished,
      minPlayers: input.minPlayers,
      maxPlayers: input.maxPlayers,
      minPlayingTime: input.minPlayingTime,
      maxPlayingTime: input.maxPlayingTime,
      playingTime: input.playingTime || input.maxPlayingTime || input.minPlayingTime,
      designers: input.designers,
      // publishers: input.publishers, // Not in GameProps
      bggCategories: [],
      bggMechanics: [],
      bggPublishers: [],
      siteCategories: input.categories || [],
      siteMechanics: input.mechanics || [],
      sitePublishers: input.publishers || [],
      imageUrl: input.imageUrl,
      thumbnailUrl: input.imageUrl, // 同じ画像を使用
      ratingAverage: undefined,
      ratingCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    return await this.gameRepository.save(game)
  }

  // Duplicate method removed - using the first implementation
}
