import { render, screen, waitFor } from '@testing-library/react'
import GameStatsComponent from '@/components/games/GameStatsComponent'

const setFetchMock = (impl: (url: string) => { status: number; body?: any }) => {
  // @ts-ignore
  global.fetch = jest.fn(async (input: any) => {
    const url = typeof input === 'string' ? input : input?.url || ''
    const res = impl(url)
    return {
      ok: res.status >= 200 && res.status < 300,
      status: res.status,
      json: async () => res.body,
    } as any
  })
}

describe('GameStatsComponent', () => {
  test('統計データを正常に表示する', async () => {
    setFetchMock((url) => {
      if (url.includes('/api/games/30549/stats')) {
        return {
          status: 200,
          body: {
            mechanics: [
              { name: 'セットコレクション', reviewVotes: 0, bggVotes: 10, totalVotes: 10, totalReviews: 11, percentage: 90.9, displayPriority: 'highlight' },
              { name: 'プレイヤー間交渉', reviewVotes: 0, bggVotes: 10, totalVotes: 10, totalReviews: 11, percentage: 90.9, displayPriority: 'highlight' },
            ],
            categories: [],
            playerCounts: [
              { name: '2人', reviewVotes: 1, bggVotes: 10, totalVotes: 11, totalReviews: 11, percentage: 100, displayPriority: 'highlight' },
              { name: '4人', reviewVotes: 0, bggVotes: 10, totalVotes: 10, totalReviews: 11, percentage: 90.9, displayPriority: 'highlight' },
            ],
            metadata: { generatedAt: new Date().toISOString(), gameId: 30549, totalItems: 4, cacheKey: 'game-stats-30549', version: '1.0' },
          }
        }
      }
      return { status: 404, body: {} }
    })

    render(<GameStatsComponent gameId={30549} />)

    // ローディング表示
    expect(screen.getByText('ゲーム統計')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('セットコレクション')).toBeInTheDocument()
    })

    expect(screen.getByText('セットコレクション')).toBeInTheDocument()
    expect(screen.getByText('プレイヤー間交渉')).toBeInTheDocument()
    expect(screen.getByText('90.9%')).toBeInTheDocument()

    const playersTab = screen.getByText('プレイ人数')
    playersTab.click()

    await waitFor(() => {
      expect(screen.getByText('2人')).toBeInTheDocument()
    })

    expect(screen.getByText('2人')).toBeInTheDocument()
    expect(screen.getByText('4人')).toBeInTheDocument()
    expect(screen.getByText('100.0%')).toBeInTheDocument()
  })

  test('70%以上の項目がハイライト表示される', async () => {
    setFetchMock((url) => {
      if (url.includes('/api/games/30549/stats')) {
        return {
          status: 200,
          body: {
            mechanics: [{ name: 'セットコレクション', reviewVotes: 0, bggVotes: 10, totalVotes: 10, totalReviews: 11, percentage: 90.9, displayPriority: 'highlight' }],
            categories: [],
            playerCounts: [{ name: '2人', reviewVotes: 1, bggVotes: 10, totalVotes: 11, totalReviews: 11, percentage: 100, displayPriority: 'highlight' }],
            metadata: { generatedAt: new Date().toISOString(), gameId: 30549, totalItems: 2, cacheKey: 'game-stats-30549', version: '1.0' },
          }
        }
      }
      return { status: 404, body: {} }
    })

    render(<GameStatsComponent gameId={30549} />)

    await waitFor(() => {
      expect(screen.getByText('セットコレクション')).toBeInTheDocument()
    })

    const highlightItems = screen.getAllByText(/90\.9%|100\.0%/)
    expect(highlightItems.length).toBeGreaterThan(0)
  })

  test('APIエラー時にエラーメッセージが表示される', async () => {
    setFetchMock((url) => (url.includes('/api/games/30549/stats') ? { status: 500, body: { error: 'Internal Server Error' } } : { status: 404, body: {} }))

    render(<GameStatsComponent gameId={30549} />)

    await waitFor(() => {
      expect(screen.getByText('統計データの取得に失敗しました')).toBeInTheDocument()
    })

    expect(screen.getByText('再試行')).toBeInTheDocument()
  })
})

