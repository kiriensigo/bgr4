/**
 * @jest-environment node
 */

import { createMocks } from 'node-mocks-http'
import { GET } from '@/app/api/games/[id]/stats/route'
import { createServerSupabaseClient } from '@/lib/supabase'

// Supabaseクライアントのモック
jest.mock('@/lib/supabase', () => ({
  createServerSupabaseClient: jest.fn()
}))

const mockSupabaseClient = {
  rpc: jest.fn()
}

describe('/api/games/[id]/stats API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabaseClient)
  })

  test('正常な統計データを返す', async () => {
    // モックデータの設定
    const mockMechanicsData = [
      {
        mechanic_name: 'セット収集',
        review_votes: 0,
        bgg_votes: 10,
        total_votes: 10,
        total_reviews: 11,
        percentage: '90.9',
        display_priority: 'highlight'
      }
    ]

    const mockCategoriesData = []

    const mockPlayerCountData = [
      {
        player_count_name: '2人',
        review_votes: 1,
        bgg_votes: 10,
        total_votes: 11,
        total_reviews: 11,
        percentage: '100.0',
        display_priority: 'highlight'
      }
    ]

    // Supabase RPCモックの設定
    mockSupabaseClient.rpc
      .mockResolvedValueOnce({ data: mockMechanicsData, error: null })
      .mockResolvedValueOnce({ data: mockCategoriesData, error: null })
      .mockResolvedValueOnce({ data: mockPlayerCountData, error: null })

    // APIリクエストの作成
    const { req } = createMocks({
      method: 'GET',
      url: '/api/games/30549/stats'
    })

    // APIエンドポイントの実行
    const params = Promise.resolve({ id: '30549' })
    const response = await GET(req as any, { params })

    // レスポンスの確認
    expect(response.status).toBe(200)
    
    const responseData = await response.json()
    
    expect(responseData.mechanics).toHaveLength(1)
    expect(responseData.mechanics[0].name).toBe('セット収集')
    expect(responseData.mechanics[0].percentage).toBe(90.9)
    expect(responseData.mechanics[0].displayPriority).toBe('highlight')

    expect(responseData.categories).toHaveLength(0)
    
    expect(responseData.playerCounts).toHaveLength(1)
    expect(responseData.playerCounts[0].name).toBe('2人')
    expect(responseData.playerCounts[0].percentage).toBe(100)

    expect(responseData.metadata).toBeDefined()
    expect(responseData.metadata.gameId).toBe(30549)
    expect(responseData.metadata.totalItems).toBe(2)
  })

  test('無効なgameIdで400エラーを返す', async () => {
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

  test('Supabaseエラー時に500エラーを返す', async () => {
    // Supabase RPCエラーの設定
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

  test('30%未満の項目が除外される', async () => {
    // 30%未満の項目を含むモックデータ
    const mockMechanicsData = [
      {
        mechanic_name: 'セット収集',
        review_votes: 0,
        bgg_votes: 10,
        total_votes: 10,
        total_reviews: 11,
        percentage: '90.9', // 70%以上
        display_priority: 'highlight'
      },
      {
        mechanic_name: 'ダイスロール',
        review_votes: 0,
        bgg_votes: 1,
        total_votes: 1,
        total_reviews: 11,
        percentage: '9.1', // 30%未満
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
    
    // 30%以上の項目のみが含まれることを確認
    expect(responseData.mechanics).toHaveLength(1)
    expect(responseData.mechanics[0].name).toBe('セット収集')
  })

  test('キャッシュヘッダーが正しく設定される', async () => {
    mockSupabaseClient.rpc
      .mockResolvedValue({ data: [], error: null })

    const { req } = createMocks({
      method: 'GET',
      url: '/api/games/30549/stats'
    })

    const params = Promise.resolve({ id: '30549' })
    const response = await GET(req as any, { params })

    // キャッシュヘッダーの確認
    const cacheControl = response.headers.get('Cache-Control')
    expect(cacheControl).toContain('s-maxage=60')
    expect(cacheControl).toContain('stale-while-revalidate=300')

    const etag = response.headers.get('ETag')
    expect(etag).toMatch(/W\/"stats-30549-\d+"/)
  })
})