/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from 'next/server'
import { POST } from '@/app/api/games/register-from-bgg/route'

jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data: any, options?: { status?: number }) => ({
      json: async () => data,
      status: options?.status ?? 200,
      ok: (options?.status ?? 200) < 400,
    })),
  },
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}))

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}))

jest.mock('@/lib/bgg-api', () => ({
  getGameDetailForAutoRegistration: jest.fn(),
  getBggGameRawData: jest.fn(),
}))

jest.mock('@/lib/bgg', () => ({
  getBggGameDetails: jest.fn(),
}))

jest.mock('@/lib/bgg-mapping', () => ({
  convertBggToSiteData: jest.fn(() => ({
    siteCategories: ['Economic'],
    siteMechanics: ['Hand Management'],
    normalizedPublishers: ['Roxley']
  })),
}))

jest.mock('@/lib/translate', () => ({
  translateToJapanese: jest.fn(async (text: string) => ({
    translatedText: `[JP] ${text}`,
    originalText: text,
    detectedSourceLanguage: 'en',
  })),
}))

import { createServerClient } from '@supabase/ssr'
import { getGameDetailForAutoRegistration, getBggGameRawData } from '@/lib/bgg-api'
import { getBggGameDetails } from '@/lib/bgg'
import { convertBggToSiteData } from '@/lib/bgg-mapping'
import { translateToJapanese } from '@/lib/translate'

const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>
const mockGetGameDetailForAutoRegistration = getGameDetailForAutoRegistration as jest.MockedFunction<typeof getGameDetailForAutoRegistration>
const mockGetBggGameRawData = getBggGameRawData as jest.MockedFunction<typeof getBggGameRawData>
const mockGetBggGameDetails = getBggGameDetails as jest.MockedFunction<typeof getBggGameDetails>
const mockConvertBggToSiteData = convertBggToSiteData as jest.MockedFunction<typeof convertBggToSiteData>
const mockTranslateToJapanese = translateToJapanese as jest.MockedFunction<typeof translateToJapanese>

const AUTH_SUCCESS = {
  data: { user: { id: 'test-user' } },
  error: null,
}

describe('/api/games/register-from-bgg', () => {
  let mockSupabaseClient: any
  let selectSingleMock: jest.Mock
  let insertSingleMock: jest.Mock
  let insertSelectMock: jest.Mock
  let selectMock: jest.Mock
  let insertMock: jest.Mock
  let insertedPayload: any

  beforeEach(() => {
    jest.clearAllMocks()

    selectSingleMock = jest.fn()
    const eqMock = jest.fn(() => ({ single: selectSingleMock }))
    selectMock = jest.fn(() => ({ eq: eqMock }))

    insertSingleMock = jest.fn()
    insertSelectMock = jest.fn(() => ({ single: insertSingleMock }))
    insertedPayload = undefined
    insertMock = jest.fn((data: any) => {
      insertedPayload = data
      return { select: insertSelectMock }
    })

    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(() => ({
        select: selectMock,
        insert: insertMock,
      })),
    }

    mockCreateServerClient.mockReturnValue(mockSupabaseClient)

    mockTranslateToJapanese.mockImplementation(async (text: string) => ({
      translatedText: `[JP] ${text}`,
      originalText: text,
      detectedSourceLanguage: 'en',
    }))

    process.env.NEXT_PUBLIC_SUPABASE_URL = 'test-url'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
  })

  const createRequest = (body: unknown, headers: Record<string, string> = {}) =>
    new Request('http://localhost:3000/api/games/register-from-bgg', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
    })

  it('returns 400 when bggId is missing or invalid', async () => {
    const response = await POST(createRequest({}) as unknown as NextRequest)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.message).toBe('Valid BGG ID is required')
    expect(mockCreateServerClient).not.toHaveBeenCalled()
  })

  it('registers a new game using helper data', async () => {
    const helperGameDetail = {
      id: 224517,
      name: 'Brass: Birmingham',
      description: 'A strategy game about industrial revolution',
      yearPublished: 2018,
      minPlayers: 2,
      maxPlayers: 4,
      playingTime: 120,
      minPlayingTime: 90,
      maxPlayingTime: 120,
      minAge: 14,
      imageUrl: 'https://example.com/brass.jpg',
      japaneseImageUrl: null,
      thumbnailUrl: 'https://example.com/brass-thumb.jpg',
      categories: ['Economic'],
      mechanics: ['Hand Management'],
      designers: ['Martin Wallace'],
      averageRating: 8.7,
      ratingCount: 45000,
      bestPlayerCounts: [4],
      recommendedPlayerCounts: [2, 3, 4],
      publishers: ['Roxley'],
    }
    const registrationData = {
      useName: helperGameDetail.name,
      usePublisher: 'Roxley Games',
      reason: 'primary-helper',
    }

    mockGetGameDetailForAutoRegistration.mockResolvedValue({
      gameDetail: helperGameDetail,
      registrationData,
    })
    mockGetBggGameDetails.mockResolvedValue({
      bestPlayerCounts: [4],
      recommendedPlayerCounts: [2, 3, 4],
    })
    mockSupabaseClient.auth.getUser.mockResolvedValue(AUTH_SUCCESS)
    selectSingleMock.mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
    insertSingleMock.mockResolvedValue({
      data: { id: 999, name: registrationData.useName },
      error: null,
    })

    const response = await POST(
      createRequest({ bggId: helperGameDetail.id }, { authorization: 'Bearer valid-token' }) as unknown as NextRequest,
    )
    const responseData = await response.json()

    expect(response.status).toBe(200)
    expect(responseData.success).toBe(true)
    expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledWith('valid-token')
    expect(mockGetGameDetailForAutoRegistration).toHaveBeenCalledWith(helperGameDetail.id)
    expect(mockGetBggGameRawData).not.toHaveBeenCalled()

    expect(insertedPayload).toMatchObject({
      bgg_id: helperGameDetail.id,
      name: registrationData.useName,
      description: `[JP] ${helperGameDetail.description}`,
      year_published: helperGameDetail.yearPublished,
      min_players: helperGameDetail.minPlayers,
      max_players: helperGameDetail.maxPlayers,
      playing_time: helperGameDetail.playingTime,
      min_playing_time: helperGameDetail.minPlayingTime,
      max_playing_time: helperGameDetail.maxPlayingTime,
      min_age: helperGameDetail.minAge,
      image_url: helperGameDetail.imageUrl,
      thumbnail_url: helperGameDetail.thumbnailUrl,
      categories: helperGameDetail.categories,
      mechanics: helperGameDetail.mechanics,
      designers: helperGameDetail.designers,
      publishers: [registrationData.usePublisher],
      rating_average: helperGameDetail.averageRating,
      rating_count: helperGameDetail.ratingCount,
      bgg_best_players: ['4'],
      bgg_recommended_players: ['2', '3'],
    })
  })

  it('returns 401 when authorization header is missing', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue(AUTH_SUCCESS)

    const response = await POST(createRequest({ bggId: 111 }) as unknown as NextRequest)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.message).toBe('Authorization token required')
  })

  it('returns 409 when the game already exists', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue(AUTH_SUCCESS)
    selectSingleMock.mockResolvedValue({
      data: { id: 77, name: 'Existing Game' },
      error: null,
    })

    const response = await POST(
      createRequest({ bggId: 777 }, { authorization: 'Bearer valid-token' }) as unknown as NextRequest,
    )
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.success).toBe(false)
    expect(data.message).toContain('Existing Game')
    expect(mockGetGameDetailForAutoRegistration).not.toHaveBeenCalled()
  })

  it('returns 404 when BGG data cannot be fetched in fallback path', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue(AUTH_SUCCESS)
    selectSingleMock.mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
    mockGetGameDetailForAutoRegistration.mockResolvedValue(null)
    mockGetBggGameRawData.mockResolvedValue(null)

    const response = await POST(
      createRequest({ bggId: 123456 }, { authorization: 'Bearer valid-token' }) as unknown as NextRequest,
    )
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(String(data.message)).toContain('BGG')
  })

  it('falls back to original description when translation fails', async () => {
    const rawGameData = {
      id: 321,
      name: 'Fallback Game',
      description: 'Original description from BGG',
      yearPublished: 2020,
      minPlayers: 1,
      maxPlayers: 4,
      playingTime: 75,
      minPlayingTime: 60,
      maxPlayingTime: 90,
      minAge: 10,
      image: 'https://example.com/fallback.jpg',
      thumbnail: 'https://example.com/fallback-thumb.jpg',
      categories: ['Adventure'],
      mechanics: ['Cooperative'],
      designers: ['Jane Doe'],
      publishers: ['Example Publisher'],
      averageRating: 7.5,
      ratingCount: 1200,
    }

    mockSupabaseClient.auth.getUser.mockResolvedValue(AUTH_SUCCESS)
    selectSingleMock.mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
    mockGetGameDetailForAutoRegistration.mockResolvedValue(null)
    mockGetBggGameRawData.mockResolvedValue(rawGameData)
    mockGetBggGameDetails.mockResolvedValue({
      bestPlayerCounts: [4],
      recommendedPlayerCounts: [2, 3, 4],
    })
    mockTranslateToJapanese.mockRejectedValue(new Error('Translation API error'))

    insertSingleMock.mockResolvedValue({ data: { id: 55 }, error: null })

    const response = await POST(
      createRequest({ bggId: rawGameData.id }, { authorization: 'Bearer valid-token' }) as unknown as NextRequest,
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(insertedPayload.description).toBe(rawGameData.description)
    expect(insertedPayload.publishers).toEqual(['Roxley'])
    expect(insertedPayload.bgg_best_players).toEqual(['4'])
    expect(insertedPayload.bgg_recommended_players).toEqual(['2', '3'])
    expect(mockConvertBggToSiteData).toHaveBeenCalledWith(
      rawGameData.categories,
      rawGameData.mechanics,
      rawGameData.publishers,
      [4],
      [2, 3],
    )
  })
})
