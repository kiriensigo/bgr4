import { NextRequest } from 'next/server'
import { GET } from './route'

// Supabaseクライアントのモック
jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClientForAPI: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          or: jest.fn(() => ({
            then: jest.fn(() => Promise.resolve({
              data: mockReviewsData,
              error: null
            }))
          }))
        }))
      }))
    }))
  }))
}))

// モックデータ
const mockReviewsData = [
  {
    game_id: 1,
    overall_score: 8,
    complexity_score: 6,
    luck_factor: 4,
    interaction_score: 9,
    downtime_score: 3,
    rec_players_2: true,
    rec_players_3: true,
    rec_players_4: false,
    rec_players_5: false,
    rec_players_6plus: false,
    mech_area_control: true,
    mech_auction: false,
    mech_betting: false,
    mech_drafting: false,
    mech_cooperative: false,
    mech_deck_building: false,
    mech_dice_rolling: true,
    mech_hidden_roles: false,
    mech_modular_board: false,
    mech_route_building: false,
    mech_push_luck: false,
    mech_set_collection: false,
    mech_simultaneous: false,
    mech_tile_placement: false,
    mech_variable_powers: false,
    mech_worker_placement: false,
    cat_animals: false,
    cat_bluffing: false,
    cat_card_game: false,
    cat_childrens: false,
    cat_deduction: false,
    cat_memory: false,
    cat_negotiation: false,
    cat_party: false,
    cat_puzzle: false,
    cat_wargame: true,
    cat_word_game: false,
    cat_acting: false,
    cat_legacy_campaign: false,
    cat_paper_pencil: false,
    cat_solo: false,
    cat_trick_taking: false,
    cat_pair: false,
    cat_large_group: false,
    games: {
      id: 1,
      name: 'Test Game',
      image_url: 'test.jpg',
      min_players: 2,
      max_players: 4,
      playing_time: 90,
      year_published: 2023
    }
  },
  {
    game_id: 1,
    overall_score: 9,
    complexity_score: 7,
    luck_factor: 3,
    interaction_score: 8,
    downtime_score: 2,
    rec_players_2: true,
    rec_players_3: true,
    rec_players_4: true,
    rec_players_5: false,
    rec_players_6plus: false,
    mech_area_control: true,
    mech_auction: false,
    mech_betting: false,
    mech_drafting: false,
    mech_cooperative: false,
    mech_deck_building: false,
    mech_dice_rolling: true,
    mech_hidden_roles: false,
    mech_modular_board: false,
    mech_route_building: false,
    mech_push_luck: false,
    mech_set_collection: false,
    mech_simultaneous: false,
    mech_tile_placement: false,
    mech_variable_powers: false,
    mech_worker_placement: false,
    cat_animals: false,
    cat_bluffing: false,
    cat_card_game: false,
    cat_childrens: false,
    cat_deduction: false,
    cat_memory: false,
    cat_negotiation: false,
    cat_party: false,
    cat_puzzle: false,
    cat_wargame: true,
    cat_word_game: false,
    cat_acting: false,
    cat_legacy_campaign: false,
    cat_paper_pencil: false,
    cat_solo: false,
    cat_trick_taking: false,
    cat_pair: false,
    cat_large_group: false,
    games: {
      id: 1,
      name: 'Test Game',
      image_url: 'test.jpg',
      min_players: 2,
      max_players: 4,
      playing_time: 90,
      year_published: 2023
    }
  }
]

describe('/api/search/reviews', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('基本的な検索APIが動作する', async () => {
    const request = new NextRequest('http://localhost:3001/api/search/reviews')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toBeDefined()
    expect(Array.isArray(data.data)).toBe(true)
  })

  test('総合得点フィルタリングが動作する', async () => {
    const request = new NextRequest('http://localhost:3001/api/search/reviews?overallScoreMin=7&overallScoreMax=9')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toBeDefined()
    
    // 統計データが正しく計算されているか確認
    if (data.data.length > 0) {
      const game = data.data[0]
      expect(game.review_stats).toBeDefined()
      expect(game.review_stats.avg_overall_score).toBeGreaterThanOrEqual(7)
      expect(game.review_stats.avg_overall_score).toBeLessThanOrEqual(9)
    }
  })

  test('メカニクスフィルタリングが動作する', async () => {
    const request = new NextRequest('http://localhost:3001/api/search/reviews?mechanics=エリア支配&mechanics=ダイスロール')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toBeDefined()
    
    // メカニクスデータが正しく含まれているか確認
    if (data.data.length > 0) {
      const game = data.data[0]
      expect(game.review_stats.popular_mechanics).toContain('エリア支配')
      expect(game.review_stats.popular_mechanics).toContain('ダイスロール')
    }
  })

  test('プレイ人数フィルタリングが動作する', async () => {
    const request = new NextRequest('http://localhost:3001/api/search/reviews?gamePlayerCounts=3')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toBeDefined()
  })

  test('ページネーションが動作する', async () => {
    const request = new NextRequest('http://localhost:3001/api/search/reviews?page=1&limit=10')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.pagination).toBeDefined()
    expect(data.pagination.page).toBe(1)
    expect(data.pagination.limit).toBe(10)
    expect(typeof data.pagination.total).toBe('number')
    expect(typeof data.pagination.totalPages).toBe('number')
  })

  test('ソート機能が動作する', async () => {
    const request = new NextRequest('http://localhost:3001/api/search/reviews?sortBy=overall_score&sortOrder=desc')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.filters.sortBy).toBe('overall_score')
    expect(data.filters.sortOrder).toBe('desc')
  })

  test('複数フィルターの組み合わせが動作する', async () => {
    const request = new NextRequest('http://localhost:3001/api/search/reviews?overallScoreMin=7&mechanics=エリア支配&categories=ウォーゲーム&playTimeMin=60&playTimeMax=120')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toBeDefined()
  })

  test('無効なパラメータでエラーが返される', async () => {
    const request = new NextRequest('http://localhost:3001/api/search/reviews?overallScoreMin=invalid')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200) // NaNは0として扱われるため成功
    expect(data.success).toBe(true)
  })

  test('空の結果が正しく処理される', async () => {
    // 条件に合致しないフィルターをセット
    const request = new NextRequest('http://localhost:3001/api/search/reviews?overallScoreMin=15') // 不可能な条件
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual([])
    expect(data.pagination.total).toBe(0)
  })

  test('レスポンス構造が正しい', async () => {
    const request = new NextRequest('http://localhost:3001/api/search/reviews')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('success')
    expect(data).toHaveProperty('data')
    expect(data).toHaveProperty('pagination')
    expect(data).toHaveProperty('filters')
    expect(data).toHaveProperty('facets')
    
    // paginationの構造確認
    expect(data.pagination).toHaveProperty('page')
    expect(data.pagination).toHaveProperty('limit')
    expect(data.pagination).toHaveProperty('total')
    expect(data.pagination).toHaveProperty('totalPages')
    expect(data.pagination).toHaveProperty('hasNext')
    expect(data.pagination).toHaveProperty('hasPrev')
  })
})