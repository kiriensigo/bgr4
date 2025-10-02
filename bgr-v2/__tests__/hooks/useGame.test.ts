import { renderHook, waitFor } from '@testing-library/react'
import type { Game } from '@/types'
import { useGame } from '@/hooks/useGame'

const createMockResponse = (
  body: Record<string, unknown>,
  init: Partial<{ status: number; ok: boolean }> = {},
) => ({
  ok: init.ok ?? true,
  status: init.status ?? 200,
  json: jest.fn(async () => body),
})

const createGame = (overrides: Partial<Game> = {}): Game => ({
  id: 1,
  bgg_id: 1,
  name: 'Gloomhaven',
  description: 'Epic board game',
  year_published: 2017,
  min_players: 1,
  max_players: 4,
  playing_time: 120,
  min_age: 14,
  image_url: null,
  thumbnail_url: null,
  bgg_categories: [],
  bgg_mechanics: [],
  bgg_publishers: [],
  site_categories: [],
  site_mechanics: [],
  site_publishers: [],
  categories: [],
  mechanics: [],
  publishers: [],
  designers: [],
  rating_average: 4.5,
  rating_count: 100,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
  review_stats: undefined,
  ...overrides,
})

describe('useGame hook', () => {
  const originalFetch = global.fetch
  const mockFetch = jest.fn()

  beforeEach(() => {
    mockFetch.mockReset()
    global.fetch = mockFetch as any
  })

  afterAll(() => {
    global.fetch = originalFetch
  })

  it('fetches game data successfully', async () => {
    const mockGameData = createGame()

    mockFetch.mockResolvedValueOnce(
      createMockResponse({ success: true, data: mockGameData })
    )

    const { result } = renderHook(() => useGame(1))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.game).toEqual(mockGameData)
    })

    expect(result.current.error).toBeNull()
    expect(mockFetch).toHaveBeenCalledWith('/api/games/1')
  })

  it('handles error responses', async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse(
        { success: false, message: 'Game not found' },
        { ok: false, status: 404 },
      )
    )

    const { result } = renderHook(() => useGame(999))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.game).toBeNull()
      expect(result.current.error).toBe('Game not found')
    })
  })

  it('does not fetch when gameId is null', async () => {
    const { result } = renderHook(() => useGame(null))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.game).toBeNull()
      expect(result.current.error).toBeNull()
    })

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('refetches when gameId changes', async () => {
    const firstGame = createGame({ id: 1, name: 'Game 1' })
    const secondGame = createGame({ id: 2, bgg_id: 2, name: 'Game 2' })

    mockFetch
      .mockResolvedValueOnce(
        createMockResponse({ success: true, data: firstGame }),
      )
      .mockResolvedValueOnce(
        createMockResponse({ success: true, data: secondGame }),
      )

    const { result, rerender } = renderHook(
      ({ gameId }) => useGame(gameId),
      { initialProps: { gameId: 1 } },
    )

    await waitFor(() => {
      expect(result.current.game).toEqual(firstGame)
    })

    rerender({ gameId: 2 })

    await waitFor(() => {
      expect(result.current.game).toEqual(secondGame)
    })

    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(mockFetch).toHaveBeenNthCalledWith(1, '/api/games/1')
    expect(mockFetch).toHaveBeenNthCalledWith(2, '/api/games/2')
  })
})
