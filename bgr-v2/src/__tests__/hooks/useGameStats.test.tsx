import { renderHook, waitFor, act } from '@testing-library/react'
import { useGameStats } from '@/hooks/useGameStats'

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return <div>{children}</div>
}

const setFetchMock = (impl: (url: string) => { status: number; body?: any } | Error) => {
  // @ts-ignore
  global.fetch = jest.fn(async (input: any) => {
    const url = typeof input === 'string' ? input : input?.url || ''
    const res = impl(url)
    if (res instanceof Error) throw res
    return {
      ok: res.status >= 200 && res.status < 300,
      status: res.status,
      json: async () => res.body,
    } as any
  })
}

describe('useGameStats', () => {
  test('正常にゲーム統計データを取得できる', async () => {
    setFetchMock((url) => {
      if (url.includes('/api/games/30549/stats')) {
        return {
          status: 200,
          body: {
            mechanics: [
              {
                name: 'セットコレクション',
                reviewVotes: 0,
                bggVotes: 10,
                totalVotes: 10,
                totalReviews: 11,
                percentage: 90.9,
                displayPriority: 'highlight',
              },
            ],
            categories: [],
            playerCounts: [
              {
                name: '2人',
                reviewVotes: 1,
                bggVotes: 10,
                totalVotes: 11,
                totalReviews: 11,
                percentage: 100,
                displayPriority: 'highlight',
              },
            ],
            metadata: {
              generatedAt: new Date().toISOString(),
              gameId: 30549,
              totalItems: 2,
              cacheKey: 'game-stats-30549',
              version: '1.0',
            },
          },
        }
      }
      return { status: 404, body: {} }
    })

    const { result } = renderHook(() => useGameStats(30549), {
      wrapper: TestWrapper
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.stats).toBe(null)
    expect(result.current.error).toBe(null)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.stats).not.toBe(null)
    expect(result.current.stats?.mechanics).toHaveLength(1)
    expect(result.current.stats?.mechanics[0].name).toBe('セットコレクション')
    expect(result.current.stats?.mechanics[0].percentage).toBe(90.9)
    expect(result.current.stats?.mechanics[0].displayPriority).toBe('highlight')

    expect(result.current.stats?.categories).toHaveLength(0)
    expect(result.current.stats?.playerCounts).toHaveLength(1)
    expect(result.current.stats?.playerCounts[0].percentage).toBe(100)
    expect(result.current.stats?.playerCounts[0].displayPriority).toBe('highlight')
  })

  test('APIエラー時にエラー状態になる', async () => {
    setFetchMock((url) => {
      if (url.includes('/api/games/999/stats')) {
        return { status: 500, body: { error: 'Internal Server Error' } }
      }
      return { status: 404, body: {} }
    })

    const { result } = renderHook(() => useGameStats(999), {
      wrapper: TestWrapper
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).not.toBe(null)
    expect(result.current.stats).toBe(null)
  })

  test('無効なgameIdの場合はリクエストしない', () => {
    const { result } = renderHook(() => useGameStats(NaN), {
      wrapper: TestWrapper
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.stats).toBe(null)
    expect(result.current.error).toBe(null)
  })

  test('refetch関数で再取得できる', async () => {
    setFetchMock((url) => {
      if (url.includes('/api/games/30549/stats')) {
        return {
          status: 200,
          body: {
            mechanics: [],
            categories: [],
            playerCounts: [],
            metadata: {
              generatedAt: new Date().toISOString(),
              gameId: 30549,
              totalItems: 0,
              cacheKey: 'game-stats-30549',
              version: '1.0',
            },
          }
        }
      }
      return { status: 404, body: {} }
    })

    const { result } = renderHook(() => useGameStats(30549), {
      wrapper: TestWrapper
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.refetch()
    })

    expect(result.current.stats).not.toBe(null)
  })
})
