
import { render, screen, waitFor } from '@testing-library/react'
jest.mock('lucide-react')

const GameStatsComponent = require('@/components/games/GameStatsComponent').default as typeof import('@/components/games/GameStatsComponent').default

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

describe.skip('GameStatsComponent', () => {
  test('統計データを正常に表示する', async () => {
    setFetchMock((url) => {
      if (url.includes('/api/games/30549/stats')) {
        return {
          status: 200,
          body: {
            mechanics: [
              { name: 'セットコレクション', reviewVotes: 0, bggVotes: 10, totalVotes: 10, totalReviews: 11, percentage: 90.9, displayPriority: 'highlight' },
              { name: 'プレイヤー差異', reviewVotes: 0, bggVotes: 10, totalVotes: 10, totalReviews: 11, percentage: 90.9, displayPriority: 'highlight' },
            ],
            categories: [],
            playerCounts: [
              { name: '2人', reviewVotes: 1, bggVotes: 10, totalVotes: 11, totalReviews: 21, percentage: 52, displayPriority: 'normal' },
              { name: '4人', reviewVotes: 0, bggVotes: 7, totalVotes: 7, totalReviews: 17, percentage: 41, displayPriority: 'normal' },
            ],
            metadata: { generatedAt: new Date().toISOString(), gameId: 30549, totalItems: 4, cacheKey: 'game-stats-30549', version: '1.0' },
          }
        }
      }
      return { status: 404, body: {} }
    })

    render(<GameStatsComponent gameId={30549} />)

    await waitFor(() => {
      expect(screen.getByText('統計')).toBeInTheDocument()
    })

    expect(screen.getByText('セットコレクション')).toBeInTheDocument()
    expect(screen.getByText('プレイヤー差異')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('おすすめのプレイ人数')).toBeInTheDocument()
    })

    expect(screen.getByText('2人')).toBeInTheDocument()
    expect(screen.getByText('4人')).toBeInTheDocument()
  })

  test('ハイライト対象のメカニクスが表示される', async () => {
    setFetchMock((url) => {
      if (url.includes('/api/games/30549/stats')) {
        return {
          status: 200,
          body: {
            mechanics: [{ name: 'セットコレクション', reviewVotes: 0, bggVotes: 10, totalVotes: 10, totalReviews: 11, percentage: 90.9, displayPriority: 'highlight' }],
            categories: [],
            playerCounts: [{ name: '2人', reviewVotes: 1, bggVotes: 10, totalVotes: 11, totalReviews: 21, percentage: 52, displayPriority: 'normal' }],
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

    expect(screen.getByText('セットコレクション')).toBeInTheDocument()
  })

  test('APIエラー時にエラーメッセージを表示する', async () => {
    setFetchMock((url) => (url.includes('/api/games/30549/stats') ? { status: 500, body: { error: 'Internal Server Error' } } : { status: 404, body: {} }))

    render(<GameStatsComponent gameId={30549} />)

    await waitFor(() => {
      expect(screen.getByText('統計データの取得に失敗しました')).toBeInTheDocument()
    })

    expect(screen.getByText('再試行')).toBeInTheDocument()
  })
})
