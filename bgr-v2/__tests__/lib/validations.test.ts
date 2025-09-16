import { 
  gameSchema, 
  reviewSchema, 
  userProfileSchema,
  validateGameData,
  validateReviewData 
} from '@/lib/validations'

describe('Validation Schemas', () => {
  describe('gameSchema', () => {
    it('should validate valid game data', () => {
      const validGame = {
        name: 'Gloomhaven',
        description: 'Epic board game',
        yearPublished: 2017,
        minPlayers: 1,
        maxPlayers: 4,
        playingTime: 120,
        bggId: 174430
      }

      const result = gameSchema.safeParse(validGame)
      expect(result.success).toBe(true)
    })

    it('should reject invalid year', () => {
      const invalidGame = {
        name: 'Test Game',
        yearPublished: 1700, // Too old (before 1800)
        minPlayers: 1,
        maxPlayers: 4
      }

      const result = gameSchema.safeParse(invalidGame)
      expect(result.success).toBe(false)
    })

    it('should reject invalid player count', () => {
      const invalidGame = {
        name: 'Test Game',
        minPlayers: 0, // Invalid (must be >= 1)
        maxPlayers: 4
      }

      const result = gameSchema.safeParse(invalidGame)
      expect(result.success).toBe(false)
    })
  })

  describe('reviewSchema', () => {
    it('should validate valid review data', () => {
      const validReview = {
        title: 'Great Game!',
        content: 'This is an amazing board game that I highly recommend.',
        rating: 8,
        gameId: 1,
        pros: ['Great gameplay', 'Beautiful artwork'],
        cons: ['Long setup time']
      }

      const result = reviewSchema.safeParse(validReview)
      expect(result.success).toBe(true)
    })

    it('should reject invalid rating', () => {
      const invalidReview = {
        title: 'Test Review',
        content: 'Test content',
        rating: 11, // Out of range
        gameId: 1
      }

      const result = reviewSchema.safeParse(invalidReview)
      expect(result.success).toBe(false)
    })

    it('should reject short title', () => {
      const invalidReview = {
        title: 'Bad', // Too short (< 5 chars)
        content: 'Test content that is long enough',
        rating: 8,
        gameId: 1
      }

      const result = reviewSchema.safeParse(invalidReview)
      expect(result.success).toBe(false)
    })
  })

  describe('userProfileSchema', () => {
    it('should validate valid user profile', () => {
      const validProfile = {
        username: 'testuser',
        fullName: 'Test User',
        email: 'test@example.com'
      }

      const result = userProfileSchema.safeParse(validProfile)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidProfile = {
        username: 'testuser',
        email: 'invalid-email'
      }

      const result = userProfileSchema.safeParse(invalidProfile)
      expect(result.success).toBe(false)
    })
  })

  describe('Helper functions', () => {
    it('validateGameData should work correctly', () => {
      const validGame = {
        name: 'Test Game',
        minPlayers: 2,
        maxPlayers: 4
      }

      expect(validateGameData(validGame)).toBe(true)
    })

    it('validateReviewData should work correctly', () => {
      const validReview = {
        title: 'Great!',
        content: 'Amazing game',
        rating: 9,
        gameId: 1
      }

      expect(validateReviewData(validReview)).toBe(true)
    })
  })
})