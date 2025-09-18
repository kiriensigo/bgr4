/**
 * @jest-environment node
 */
import { POST } from '@/app/api/games/register-from-bgg/route'

// NextResponse mock
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data: any, options?: any) => ({
      json: async () => data,
      status: options?.status || 200,
      ok: (options?.status || 200) < 400,
    })),
  },
}))

// Supabase SRK mock
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({
    auth: { getUser: jest.fn() },
    from: jest.fn(() => ({
      select: jest.fn(() => ({ eq: jest.fn(() => ({ single: jest.fn() })) })),
      insert: jest.fn(() => ({ select: jest.fn(() => ({ single: jest.fn() })) })),
    })),
  })),
}))

// BGG API mock
jest.mock('@/lib/bgg-api', () => ({
  getGameDetailForAutoRegistration: jest.fn(),
}))

// translate mock
jest.mock('@/lib/translate', () => ({
  translateToJapanese: jest.fn((text: string) => Promise.resolve({
    translatedText: `翻訳: ${text}`,
    originalText: text,
    detectedSourceLanguage: 'en',
  })),
}))

import { createServerClient } from '@supabase/ssr'
import { getGameDetailForAutoRegistration } from '@/lib/bgg-api'
import { translateToJapanese } from '@/lib/translate'

const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>
const mockGetGameDetailForAutoRegistration = getGameDetailForAutoRegistration as jest.MockedFunction<typeof getGameDetailForAutoRegistration>
const mockTranslate = translateToJapanese as jest.MockedFunction<typeof translateToJapanese>

describe('POST /api/games/register-from-bgg (v2 tests)', () => {
  let supabase: any

  beforeEach(() => {
    jest.clearAllMocks()
    const selectSingleChain: any = { single: jest.fn() }
    const selectEqChain: any = { eq: jest.fn(() => selectSingleChain) }
    const insertSelectSingleChain: any = { single: jest.fn() }
    const insertChain: any = { select: jest.fn(() => insertSelectSingleChain) }
    const tableMock: any = {
      select: jest.fn(() => selectEqChain),
      insert: jest.fn(() => insertChain),
    }
    supabase = {
      auth: { getUser: jest.fn() },
      from: jest.fn(() => tableMock),
    }
    mockCreateServerClient.mockReturnValue(supabase)
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'u'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'k'
  })

  it('登録成功: id/bgg_id=BGGID, カテゴリ/メカニクス保存、min/max保存、publishers空', async () => {
    const bgg = {
      id: 111,
      name: 'Test Game',
      description: 'desc',
      yearPublished: 2020,
      minPlayers: 2,
      maxPlayers: 4,
      playingTime: 60,
      minPlayingTime: 50,
      maxPlayingTime: 70,
      imageUrl: 'img',
      thumbnailUrl: 'thumb',
      categories: ['戦略'],
      mechanics: ['ワカプレ'],
      designers: ['Alice'],
      publishers: ['Foo'],
      averageRating: 8,
      ratingCount: 100,
    }
    mockGetGameDetailForAutoRegistration.mockResolvedValue({
      gameDetail: bgg,
      registrationData: { useName: bgg.name, usePublisher: undefined, reason: 'use-bgg' },
    } as any)
    supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u' } }, error: null })
    supabase.from().select().eq().single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } })

    let inserted: any
    supabase.from().insert.mockImplementation((d: any) => {
      inserted = d
      return { select: () => ({ single: () => Promise.resolve({ data: { id: d.id, ...d }, error: null }) }) }
    })

    const req = new Request('http://x/api/games/register-from-bgg', {
      method: 'POST',
      headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
      body: JSON.stringify({ bggId: bgg.id }),
    }) as any
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(inserted.id).toBe(bgg.id)
    expect(inserted.bgg_id).toBe(bgg.id)
    expect(inserted.categories).toEqual(['戦略'])
    expect(inserted.mechanics).toEqual(['ワカプレ'])
    expect(inserted.min_playing_time).toBe(50)
    expect(inserted.max_playing_time).toBe(70)
    expect(inserted.publishers).toEqual([])
  })

  it('401: Authorizationヘッダ無し', async () => {
    const req = new Request('http://x/api/games/register-from-bgg', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ bggId: 1 }),
    }) as any
    const res = await POST(req)
    const data = await (res as any).json()
    expect(res.status).toBe(401)
    expect(data.message).toContain('Authorization')
  })

  it('404: BGG詳細が取得できない', async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u' } }, error: null })
    supabase.from().select().eq().single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
    mockGetGameDetailForAutoRegistration.mockResolvedValue(null as any)

    const req = new Request('http://x/api/games/register-from-bgg', {
      method: 'POST',
      headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
      body: JSON.stringify({ bggId: 999 }),
    }) as any
    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  it('409: 既に同じBGG IDで登録済み', async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u' } }, error: null })
    supabase.from().select().eq().single.mockResolvedValue({ data: { id: 42, name: 'Exists' }, error: null })

    const req = new Request('http://x/api/games/register-from-bgg', {
      method: 'POST',
      headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
      body: JSON.stringify({ bggId: 42 }),
    }) as any
    const res = await POST(req)
    const data = await (res as any).json()
    expect(res.status).toBe(409)
    expect(data.existingGameId).toBe(42)
  })

  it('翻訳が失敗した場合は原文descriptionを使う', async () => {
    const bgg = { id: 7, name: 'G', description: 'orig' }
    mockTranslate.mockRejectedValue(new Error('fail'))
    mockGetGameDetailForAutoRegistration.mockResolvedValue({ gameDetail: bgg, registrationData: { useName: 'G', reason: 'r' } } as any)
    supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u' } }, error: null })
    supabase.from().select().eq().single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
    let inserted: any
    supabase.from().insert.mockImplementation((d: any) => { inserted = d; return { select: () => ({ single: () => Promise.resolve({ data: d, error: null }) }) } })

    const req = new Request('http://x/api/games/register-from-bgg', { method: 'POST', headers: { authorization: 'Bearer t', 'content-type': 'application/json' }, body: JSON.stringify({ bggId: 7 }) }) as any
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(inserted.description).toBe('orig')
  })
})
