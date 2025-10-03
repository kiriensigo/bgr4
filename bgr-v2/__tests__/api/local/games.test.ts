/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/local/games/route'
import { db } from '@/lib/db'

jest.mock('@/lib/db', () => ({
  db: {
    query: jest.fn(),
  },
}))

const mockedDb = db as unknown as { query: jest.Mock }

describe('/api/local/games', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns paginated games with metadata', async () => {
    const gamesRows = [
      {
        id: 1,
        bgg_id: 123,
        name: 'Sample Game',
        description: 'Test',
        year_published: 2020,
        min_players: 1,
        max_players: 4,
        playing_time: 60,
        min_age: 10,
        image_url: null,
        thumbnail_url: null,
        mechanics: ['Deck Building'],
        categories: ['Strategy'],
        designers: ['Designer A'],
        publishers: ['Publisher A'],
        rating_average: '7.5',
        rating_count: 100,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]

    mockedDb.query
      .mockResolvedValueOnce({ rows: gamesRows })
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })

    const request = new NextRequest('http://localhost:3001/api/local/games?page=1&limit=10')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const body = await response.json()

    expect(body.success).toBe(true)
    expect(body.data).toHaveLength(1)
    expect(body.data[0].rating_average).toBe(7.5)
    expect(body.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    })
  })

  it('returns 400 for invalid pagination params', async () => {
    const request = new NextRequest('http://localhost:3001/api/local/games?page=0&limit=10')
    const response = await GET(request)

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.success).toBe(false)
    expect(body.message).toBe('Invalid pagination parameters')
    expect(mockedDb.query).not.toHaveBeenCalled()
  })

  it('returns 500 when database query fails', async () => {
    mockedDb.query.mockRejectedValueOnce(new Error('connection error'))

    const request = new NextRequest('http://localhost:3001/api/local/games?page=1&limit=10')
    const response = await GET(request)

    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.success).toBe(false)
    expect(body.message).toBe('Internal server error')
  })
})
