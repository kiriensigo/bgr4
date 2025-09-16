import { renderHook, waitFor } from '@testing-library/react'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { useGameStats } from '@/hooks/useGameStats'

// SWR用のテストラッパー
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return <div>{children}</div>
}

const server = setupServer(
  rest.get('/api/games/:id/stats', (req, res, ctx) => {
    const { id } = req.params
    
    if (id === '30549') {
      return res(
        ctx.json({
          mechanics: [
            {
              name: 'セット収集',
              reviewVotes: 0,
              bggVotes: 10,
              totalVotes: 10,
              totalReviews: 11,
              percentage: 90.9,
              displayPriority: 'highlight'
            }
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
              displayPriority: 'highlight'
            }
          ],
          metadata: {
            generatedAt: new Date().toISOString(),
            gameId: parseInt(id as string),
            totalItems: 2,
            cacheKey: `game-stats-${id}`,
            version: '1.0'
          }
        })
      )
    }
    
    if (id === '999') {
      return res(ctx.status(500), ctx.json({ error: 'Internal Server Error' }))
    }
    
    return res(ctx.status(404))
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('useGameStats', () => {
  test('正常にゲーム統計データを取得できる', async () => {
    const { result } = renderHook(() => useGameStats(30549), {
      wrapper: TestWrapper
    })

    // 初期状態の確認
    expect(result.current.isLoading).toBe(true)
    expect(result.current.stats).toBe(null)
    expect(result.current.error).toBe(null)

    // データの読み込み完了を待機
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // 取得されたデータの確認
    expect(result.current.stats).not.toBe(null)
    expect(result.current.stats?.mechanics).toHaveLength(1)
    expect(result.current.stats?.mechanics[0].name).toBe('セット収集')
    expect(result.current.stats?.mechanics[0].percentage).toBe(90.9)
    expect(result.current.stats?.mechanics[0].displayPriority).toBe('highlight')
    
    expect(result.current.stats?.categories).toHaveLength(0)
    expect(result.current.stats?.playerCounts).toHaveLength(1)
    expect(result.current.stats?.playerCounts[0].percentage).toBe(100)
  })

  test('APIエラー時にエラー状態になる', async () => {
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

  test('refetch関数が動作する', async () => {
    const { result } = renderHook(() => useGameStats(30549), {
      wrapper: TestWrapper
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // refetch実行
    await result.current.refetch()

    // データが再取得されることを確認
    expect(result.current.stats).not.toBe(null)
  })
})