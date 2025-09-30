/**
 * @jest-environment node
 */

import { createMocks } from 'node-mocks-http'
import { GET } from '@/app/api/games/[id]/stats/route'
import { createServerSupabaseClient } from '@/lib/supabase'

jest.mock('@/lib/supabase', () => ({
  createServerSupabaseClient: jest.fn()
}))

const mockSupabaseClient: any = {
  rpc: jest.fn()
}

const setGameRowResponse = (result: { data: any; error: any }) => {
  const builder: any = {}
  const dataWithDefaults = result.data ? { bgg_id: 30549, ...result.data } : result.data
  builder.select = jest.fn(() => builder)
  builder.eq = jest.fn(() => builder)
  builder.single = jest.fn().mockResolvedValue({
    data: dataWithDefaults,
    error: result.error,
  })
  mockSupabaseClient.from = jest.fn(() => builder)
  return builder
}

describe('/api/games/[id]/stats API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabaseClient)
    mockSupabaseClient.rpc.mockReset()
    setGameRowResponse({ data: { bgg_best_players: [], bgg_recommended_players: [] }, error: null })
  })

  test('正常な統計データを返す', async () => {
    setGameRowResponse({
      data: {
        bgg_best_players: ['2'],
        bgg_recommended_players: []
      },
      error: null
    })

    const mockMechanicsData = [
      {
        mechanic_name: 'セットコレクション',
        review_votes: 0,
        bgg_votes: 10,
        total_votes: 10,
        total_reviews: 11,
        percentage: '90.9',
        display_priority: 'highlight'
      }
    ]

    const mockCategoriesData: any[] = []

    const mockPlayerCountData = [
      {
        player_count_name: '2人',
        review_votes: 1,
        bgg_votes: 0,
        total_votes: 1,
        total_reviews: 11,
        percentage: '40.0',
        display_priority: 'normal'
      }
    ]

    mockSupabaseClient.rpc
      .mockResolvedValueOnce({ data: mockMechanicsData, error: null })
      .mockResolvedValueOnce({ data: mockCategoriesData, error: null })
      .mockResolvedValueOnce({ data: mockPlayerCountData, error: null })

    const { req } = createMocks({
      method: 'GET',
      url: '/api/games/30549/stats'
    })

    const params = Promise.resolve({ id: '30549' })
    const response = await GET(req as any, { params })

    expect(response.status).toBe(200)

    const responseData = await response.json()

    expect(responseData.mechanics).toHaveLength(1)
    expect(responseData.mechanics[0].name).toBe('セットコレクション')
    expect(responseData.mechanics[0].percentage).toBe(90.9)
    expect(responseData.mechanics[0].displayPriority).toBe('highlight')

    expect(responseData.categories).toHaveLength(0)

    expect(responseData.playerCounts).toHaveLength(1)
    const playerStat = responseData.playerCounts[0]
    expect(playerStat.name).toBe('2人')
    expect(playerStat.percentage).toBe(100)
    expect(playerStat.bggVotes).toBe(10)
    expect(playerStat.totalVotes).toBe(11)
    expect(playerStat.totalReviews).toBe(11)
    expect(playerStat.displayPriority).toBe('highlight')

    expect(responseData.metadata).toBeDefined()
    expect(responseData.metadata.gameId).toBe(30549)
    expect(responseData.metadata.totalItems).toBe(2)
  })

  test('無効なgameIdは400エラーを返す', async () => {
    const { req } = createMocks({
      method: 'GET',
      url: '/api/games/invalid/stats'
    })

    const params = Promise.resolve({ id: 'invalid' })
    const response = await GET(req as any, { params })

    expect(response.status).toBe(400)

    const responseData = await response.json()
    expect(responseData.error).toBe('Invalid game ID')
  })

  test('Supabaseエラー時は500エラーを返す', async () => {
    setGameRowResponse({
      data: { bgg_best_players: [], bgg_recommended_players: [] },
      error: null
    })

    mockSupabaseClient.rpc
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' }
      })

    const { req } = createMocks({
      method: 'GET',
      url: '/api/games/30549/stats'
    })

    const params = Promise.resolve({ id: '30549' })
    const response = await GET(req as any, { params })

    expect(response.status).toBe(500)

    const responseData = await response.json()
    expect(responseData.error).toBe('Failed to fetch game statistics')
  })

  test('30%未満の項目は除外される', async () => {
    const mockMechanicsData = [
      {
        mechanic_name: 'セットコレクション',
        review_votes: 0,
        bgg_votes: 10,
        total_votes: 10,
        total_reviews: 11,
        percentage: '90.9',
        display_priority: 'highlight'
      },
      {
        mechanic_name: 'ダイスロール',
        review_votes: 0,
        bgg_votes: 1,
        total_votes: 1,
        total_reviews: 11,
        percentage: '9.1',
        display_priority: 'hidden'
      }
    ]

    mockSupabaseClient.rpc
      .mockResolvedValueOnce({ data: mockMechanicsData, error: null })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null })

    const { req } = createMocks({
      method: 'GET',
      url: '/api/games/30549/stats'
    })

    const params = Promise.resolve({ id: '30549' })
    const response = await GET(req as any, { params })

    const responseData = await response.json()

    expect(responseData.mechanics).toHaveLength(1)
    expect(responseData.mechanics[0].name).toBe('セットコレクション')
  })

  test('キャッシュヘッダーが正しく設定される', async () => {
    setGameRowResponse({
      data: { bgg_best_players: [], bgg_recommended_players: [] },
      error: null
    })

    mockSupabaseClient.rpc.mockResolvedValue({ data: [], error: null })

    const { req } = createMocks({
      method: 'GET',
      url: '/api/games/30549/stats'
    })

    const params = Promise.resolve({ id: '30549' })
    const response = await GET(req as any, { params })

    const cacheControl = response.headers.get('Cache-Control')
    expect(cacheControl).toContain('s-maxage=60')
    expect(cacheControl).toContain('stale-while-revalidate=300')

    const etag = response.headers.get('ETag')
    expect(etag).toMatch(/W\/"stats-30549-\d+"/)
  })
})
