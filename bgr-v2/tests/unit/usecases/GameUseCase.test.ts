import { describe, it, expect, beforeEach } from '@jest/globals'
import { registerTestServices, getTestGameUseCase, getTestGameRepository } from '@/application/container'
import { GameUseCaseImpl } from '@/application/usecases/GameUseCaseImpl'
import { 
  ValidationError, 
  GameNotFoundError, 
  ConflictError 
} from '@/domain/errors/DomainErrors'

describe('GameUseCase', () => {
  let gameUseCase: GameUseCaseImpl
  
  beforeEach(() => {
    registerTestServices()
    gameUseCase = getTestGameUseCase() as GameUseCaseImpl
  })

  describe('createGameManually', () => {
    it('should create game with valid input', async () => {
      const input = {
        name: 'Test Game',
        japaneseName: 'テストゲーム',
        minPlayers: 2,
        maxPlayers: 4,
        playingTime: 90,
        userId: 'user-123'
      }

      const result = await gameUseCase.createGameManually(input)

      expect(result).toHaveProperty('id')
      expect(result.name).toBe(input.name)
      expect(result.japanese_name).toBe(input.japaneseName)
      expect(result.min_players).toBe(input.minPlayers)
      expect(result.max_players).toBe(input.maxPlayers)
    })

    it('should throw ValidationError for missing required fields', async () => {
      const input = {
        name: '',
        japaneseName: '',
        userId: 'user-123'
      }

      await expect(gameUseCase.createGameManually(input))
        .rejects
        .toThrow(ValidationError)
    })

    it('should throw ConflictError for duplicate Japanese name', async () => {
      const input1 = {
        name: 'Game 1',
        japaneseName: '重複ゲーム',
        userId: 'user-123'
      }

      const input2 = {
        name: 'Game 2',
        japaneseName: '重複ゲーム', // Same Japanese name
        userId: 'user-456'
      }

      await gameUseCase.createGameManually(input1)
      
      await expect(gameUseCase.createGameManually(input2))
        .rejects
        .toThrow(ConflictError)
    })
  })

  describe('getGameById', () => {
    it('should return game when found', async () => {
      // Create a game first
      const createInput = {
        name: 'Test Game',
        japaneseName: 'テストゲーム',
        userId: 'user-123'
      }
      
      const createdGame = await gameUseCase.createGameManually(createInput)
      
      const result = await gameUseCase.getGameById(createdGame.id)
      
      expect(result).toEqual(createdGame)
    })

    it('should throw GameNotFoundError when not found', async () => {
      await expect(gameUseCase.getGameById(999999))
        .rejects
        .toThrow(GameNotFoundError)
    })
  })

  describe('searchGames', () => {
    it('should return paginated results', async () => {
      // Create test games
      await gameUseCase.createGameManually({
        name: 'Search Test Game 1',
        japaneseName: 'サーチテスト1',
        userId: 'user-123'
      })
      
      await gameUseCase.createGameManually({
        name: 'Search Test Game 2',
        japaneseName: 'サーチテスト2',
        userId: 'user-123'
      })

      const result = await gameUseCase.searchGames({
        filters: {
          page: 1,
          limit: 10,
          search: 'Search Test'
        }
      })

      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('total')
      expect(result).toHaveProperty('page', 1)
      expect(result).toHaveProperty('limit', 10)
      expect(Array.isArray(result.data)).toBeTruthy()
      expect(result.data.length).toBeGreaterThan(0)
    })

    it('should filter by category', async () => {
      const result = await gameUseCase.searchGames({
        filters: {
          page: 1,
          limit: 10,
          category: '戦略'
        }
      })

      expect(result).toHaveProperty('data')
      expect(Array.isArray(result.data)).toBeTruthy()
    })
  })

  describe('checkGameExists', () => {
    it('should return true for existing BGG ID', async () => {
      // Create game with specific BGG ID
      const gameRepo = getTestGameRepository()
      await gameRepo.save({
        bgg_id: 12345,
        name: 'Existing Game',
        min_players: 1,
        max_players: 4,
        site_categories: [],
        site_mechanics: [],
        site_publishers: [],
        bgg_categories: [],
        bgg_mechanics: [],
        bgg_publishers: [],
        categories: [],
        mechanics: [],
        publishers: [],
        designers: [],
        rating_count: 0
      })

      const exists = await gameUseCase.checkGameExists(12345)
      expect(exists).toBe(true)
    })

    it('should return false for non-existing BGG ID', async () => {
      const exists = await gameUseCase.checkGameExists(999999)
      expect(exists).toBe(false)
    })
  })
})