import { test, expect } from '@playwright/test'

test.describe('UseCase Layer Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001')
  })

  test('should create game via GameUseCase API', async ({ page }) => {
    // Navigate to game registration page (if exists)
    const addGameButton = page.getByRole('button', { name: /ゲーム.*追加|新規.*ゲーム/ })
    
    if (await addGameButton.isVisible()) {
      await addGameButton.click()
      
      // Fill game registration form
      await page.fill('[name="japanese_name"]', 'テストゲーム_' + Date.now())
      await page.fill('[name="name"]', 'Test Game')
      await page.fill('[name="min_players"]', '2')
      await page.fill('[name="max_players"]', '4')
      
      // Submit form
      await page.click('button[type="submit"]')
      
      // Wait for success response
      await expect(page.getByText(/成功|追加.*完了/)).toBeVisible({ timeout: 10000 })
    }
  })

  test('should handle BGG game creation via API', async ({ page }) => {
    // Test BGG API integration through the frontend
    const response = await page.request.post('/api/games', {
      data: {
        game: {
          bggId: 174430, // Gloomhaven BGG ID
        },
        auto_register: true
      }
    })
    
    // Should either create new game or return existing one
    expect([200, 201, 409]).toContain(response.status())
    
    const responseData = await response.json()
    if (response.status() === 201) {
      expect(responseData).toHaveProperty('id')
      expect(responseData).toHaveProperty('name')
    }
  })

  test('should create review via ReviewUseCase API', async ({ page }) => {
    // First ensure we have a game to review
    const gameResponse = await page.request.post('/api/games', {
      data: {
        game: {
          name: 'Test Game for Review',
          japanese_name: 'テストレビューゲーム_' + Date.now(),
          min_players: 1,
          max_players: 4,
          play_time: 60
        },
        manual_registration: true
      }
    })
    
    if (gameResponse.status() === 201) {
      const game = await gameResponse.json()
      
      // Create review for the game
      const reviewResponse = await page.request.post('/api/reviews', {
        data: {
          game_id: game.id,
          title: 'Test Review',
          content: 'This is a test review content that is long enough to pass validation.',
          rating: 8,
          overall_score: 8,
          rule_complexity: 3,
          luck_factor: 2,
          interaction: 4,
          downtime: 2,
          pros: ['Great gameplay', 'Beautiful art'],
          cons: ['Long setup time'],
          categories: ['戦略'],
          mechanics: ['ワカプレ'],
          is_published: true
        }
      })
      
      expect([200, 201]).toContain(reviewResponse.status())
      
      if (reviewResponse.status() === 201) {
        const review = await reviewResponse.json()
        expect(review).toHaveProperty('id')
        expect(review).toHaveProperty('title', 'Test Review')
        expect(review).toHaveProperty('rating', 8)
      }
    }
  })

  test('should validate review input via UseCase layer', async ({ page }) => {
    // Test validation errors
    const invalidReviewResponse = await page.request.post('/api/reviews', {
      data: {
        game_id: 1,
        title: '短い', // Too short title
        content: '短い',  // Too short content
        rating: 11,      // Invalid rating
        overall_score: 0 // Invalid score
      }
    })
    
    expect(invalidReviewResponse.status()).toBe(400)
    
    const errorData = await invalidReviewResponse.json()
    expect(errorData).toHaveProperty('error')
  })

  test('should search games via GameUseCase API', async ({ page }) => {
    // Test game search API
    const searchResponse = await page.request.get('/api/games?search=test&page=1&limit=10')
    
    expect(searchResponse.status()).toBe(200)
    
    const searchData = await searchResponse.json()
    expect(searchData).toHaveProperty('games')
    expect(searchData).toHaveProperty('total')
    expect(searchData).toHaveProperty('page', 1)
    expect(searchData).toHaveProperty('limit', 10)
    expect(Array.isArray(searchData.games)).toBeTruthy()
  })

  test('should filter games by category via UseCase', async ({ page }) => {
    const categoryResponse = await page.request.get('/api/games?category=戦略&page=1&limit=5')
    
    expect(categoryResponse.status()).toBe(200)
    
    const categoryData = await categoryResponse.json()
    expect(categoryData).toHaveProperty('games')
    expect(Array.isArray(categoryData.games)).toBeTruthy()
  })

  test('should handle game not found errors properly', async ({ page }) => {
    // Test non-existent game ID
    const notFoundResponse = await page.request.get('/api/games/999999')
    
    expect(notFoundResponse.status()).toBe(404)
    
    const errorData = await notFoundResponse.json()
    expect(errorData).toHaveProperty('error')
    expect(errorData.error).toContain('not found')
  })

  test('should maintain error consistency across UseCase layer', async ({ page }) => {
    // Test error format consistency
    const responses = await Promise.all([
      page.request.get('/api/games/999999'),           // GameNotFoundError
      page.request.post('/api/reviews', { data: {} }), // ValidationError
      page.request.get('/api/games?sortBy=invalid')    // ValidationError
    ])
    
    responses.forEach(response => {
      expect(response.status()).toBeGreaterThanOrEqual(400)
    })
    
    const errorBodies = await Promise.all(responses.map(r => r.json()))
    errorBodies.forEach(errorBody => {
      expect(errorBody).toHaveProperty('error')
      expect(typeof errorBody.error).toBe('string')
    })
  })
})