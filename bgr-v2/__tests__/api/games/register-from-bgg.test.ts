/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from 'next/server'
import { POST } from '@/app/api/games/register-from-bgg/route'

// NextResponseをモック
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data: any, options?: any) => ({
      json: async () => data,
      status: options?.status || 200,
      ok: (options?.status || 200) < 400
    }))
  }
}))

// Next.js cookiesをモック
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn()
  }))
}))

// Supabaseクライアントをモック
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }))
}))

// BGG APIをモック
jest.mock('@/lib/bgg-api', () => ({
  getBggGameRawData: jest.fn()
}))

// BGG mappingをモック
jest.mock('@/lib/bgg-mapping', () => ({
  convertBggToSiteData: jest.fn(() => ({
    siteCategories: ['戦略'],
    siteMechanics: ['エリア支配'],
    normalizedPublishers: ['TestPublisher']
  }))
}))

// 翻訳機能をモック (DeepL対応)
jest.mock('@/lib/translate', () => ({
  translateToJapanese: jest.fn((text: string) => Promise.resolve({
    translatedText: `翻訳済み: ${text}`,
    originalText: text,
    detectedSourceLanguage: 'en'
  }))
}))

import { getBggGameRawData } from '@/lib/bgg-api'
import { convertBggToSiteData } from '@/lib/bgg-mapping'
import { translateToJapanese } from '@/lib/translate'
import { createServerClient } from '@supabase/ssr'

const mockBggGameRawData = getBggGameRawData as jest.MockedFunction<typeof getBggGameRawData>
const mockConvertBggToSiteData = convertBggToSiteData as jest.MockedFunction<typeof convertBggToSiteData>
const mockTranslateToJapanese = translateToJapanese as jest.MockedFunction<typeof translateToJapanese>
const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>

describe('/api/games/register-from-bgg', () => {
  let mockSupabaseClient: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Supabaseクライアントのモック設定
    const mockSelectChain = {
      eq: jest.fn(() => ({
        single: jest.fn()
      }))
    }
    
    const mockInsertChain = {
      select: jest.fn(() => ({
        single: jest.fn()
      }))
    }
    
    mockSupabaseClient = {
      auth: {
        getUser: jest.fn()
      },
      from: jest.fn(() => ({
        select: jest.fn(() => mockSelectChain),
        insert: jest.fn(() => mockInsertChain)
      }))
    }
    
    mockCreateServerClient.mockReturnValue(mockSupabaseClient)
    
    // 環境変数をモック
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'test-url'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
  })

  describe('正常系テスト', () => {
    it('BGGゲーム登録が成功する', async () => {
      // モック設定
      const mockGameData = {
        id: 224517,
        name: 'Brass: Birmingham',
        description: 'A strategy game about industrial revolution',
        yearPublished: 2018,
        minPlayers: 2,
        maxPlayers: 4,
        playingTime: 120,
        minAge: 14,
        imageUrl: 'https://example.com/image.jpg',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        categories: ['Economic'],
        mechanics: ['Network Building'],
        designers: ['Martin Wallace'],
        publishers: ['Roxley'],
        averageRating: 8.5,
        ratingCount: 50000
      }

      const mockNewGame = {
        id: 31,
        ...mockGameData,
        description: '翻訳済み: A strategy game about industrial revolution'
      }

      // BGG API mock
      mockBggGameRawData.mockResolvedValue(mockGameData)
      
      // 認証成功をモック
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      })
      
      // 既存ゲーム検索（見つからない）
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' } // Not found
      })
      
      // ゲーム挿入成功
      mockSupabaseClient.from().insert().select().single.mockResolvedValue({
        data: mockNewGame,
        error: null
      })

      // リクエストを作成
      const request = new Request('http://localhost:3001/api/games/register-from-bgg', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ bggId: 224517 })
      }) as any

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.message).toBe('ゲームが正常に登録されました')
      expect(responseData.data).toEqual(mockNewGame)
      
      // 翻訳が実行されたことを確認
      expect(mockTranslateToJapanese).toHaveBeenCalledWith('A strategy game about industrial revolution')
    })

    it('翻訳機能が正しく動作する', async () => {
      const mockGameData = {
        id: 266192,
        name: 'Wingspan',
        description: 'You are bird enthusiasts',
        yearPublished: 2019,
        minPlayers: 1,
        maxPlayers: 5,
        playingTime: 70,
        categories: [],
        mechanics: [],
        designers: [],
        publishers: [],
        averageRating: 8.0,
        ratingCount: 30000
      }

      mockBggGameRawData.mockResolvedValue(mockGameData)
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user' } },
        error: null
      })
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      })
      mockSupabaseClient.from().insert().select().single.mockResolvedValue({
        data: { id: 32, name: 'Wingspan' },
        error: null
      })

      const request = new Request('http://localhost:3001/api/games/register-from-bgg', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ bggId: 266192 })
      }) as any

      await POST(request)

      // 翻訳が呼ばれたことを確認
      expect(mockTranslateToJapanese).toHaveBeenCalledWith('You are bird enthusiasts')
    })
  })

  describe('エラー系テスト', () => {
    it('BGG IDが無効な場合400エラーを返す', async () => {
      const request = new Request('http://localhost:3001/api/games/register-from-bgg', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ bggId: null })
      }) as any

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toBe('Valid BGG ID is required')
    })

    it('認証トークンが無い場合401エラーを返す', async () => {
      const request = new Request('http://localhost:3001/api/games/register-from-bgg', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ bggId: 224517 })
      }) as any

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toBe('Authorization token required')
    })

    it('重複ゲーム登録時に409エラーを返す', async () => {
      // 既存ゲームが見つかる場合
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user' } },
        error: null
      })
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: { id: 27, name: 'Existing Game' },
        error: null
      })

      const request = new Request('http://localhost:3001/api/games/register-from-bgg', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ bggId: 13 })
      }) as any

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(409)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toContain('既に登録されています')
    })

    it('BGGから情報取得できない場合404エラーを返す', async () => {
      mockBggGameRawData.mockResolvedValue(null)
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user' } },
        error: null
      })
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      })

      const request = new Request('http://localhost:3001/api/games/register-from-bgg', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ bggId: 999999 })
      }) as any

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(404)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toBe('BGG からゲーム情報を取得できませんでした')
    })
  })

  describe('翻訳エラーハンドリング', () => {
    it('翻訳失敗時に原文を使用する', async () => {
      const mockGameData = {
        id: 123,
        name: 'Test Game',
        description: 'Original description',
        yearPublished: 2020,
        minPlayers: 2,
        maxPlayers: 4,
        playingTime: 60,
        categories: [],
        mechanics: [],
        designers: [],
        publishers: [],
        averageRating: 7.0,
        ratingCount: 1000
      }

      // 翻訳エラーをモック
      mockTranslateToJapanese.mockRejectedValue(new Error('Translation API error'))
      mockBggGameRawData.mockResolvedValue(mockGameData)
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user' } },
        error: null
      })
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      })
      
      // ゲーム挿入時に渡されるデータをキャプチャ
      let insertedData: any
      mockSupabaseClient.from().insert.mockImplementation((data: any) => {
        insertedData = data
        return {
          select: () => ({
            single: () => Promise.resolve({
              data: { id: 33, ...data },
              error: null
            })
          })
        }
      })

      const request = new Request('http://localhost:3001/api/games/register-from-bgg', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ bggId: 123 })
      }) as any

      const response = await POST(request)

      expect(response.status).toBe(200)
      // 翻訳失敗時は原文がそのまま使用される
      expect(insertedData.description).toBe('Original description')
    })
  })
})