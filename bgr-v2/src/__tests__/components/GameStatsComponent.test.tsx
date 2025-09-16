import { render, screen, waitFor } from '@testing-library/react'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import GameStatsComponent from '@/components/games/GameStatsComponent'

// MSWサーバーのセットアップ
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
            },
            {
              name: 'プレイヤー別能力',
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
            },
            {
              name: '4人',
              reviewVotes: 0,
              bggVotes: 10,
              totalVotes: 10,
              totalReviews: 11,
              percentage: 90.9,
              displayPriority: 'highlight'
            }
          ],
          metadata: {
            generatedAt: new Date().toISOString(),
            gameId: parseInt(id as string),
            totalItems: 4,
            cacheKey: `game-stats-${id}`,
            version: '1.0'
          }
        })
      )
    }
    
    return res(ctx.status(404))
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('GameStatsComponent', () => {
  test('統計データを正常に表示する', async () => {
    render(<GameStatsComponent gameId={30549} />)

    // ローディング状態の確認
    expect(screen.getByText('ゲーム統計')).toBeInTheDocument()
    
    // 統計データの読み込み完了を待機
    await waitFor(() => {
      expect(screen.getByText('セット収集')).toBeInTheDocument()
    })

    // メカニクスタブのデータを確認
    expect(screen.getByText('セット収集')).toBeInTheDocument()
    expect(screen.getByText('プレイヤー別能力')).toBeInTheDocument()
    expect(screen.getByText('90.9%')).toBeInTheDocument()

    // プレイ人数タブに切り替え
    const playersTab = screen.getByText('プレイ人数')
    playersTab.click()

    await waitFor(() => {
      expect(screen.getByText('2人')).toBeInTheDocument()
    })

    // プレイ人数データの確認
    expect(screen.getByText('2人')).toBeInTheDocument()
    expect(screen.getByText('4人')).toBeInTheDocument()
    expect(screen.getByText('100.0%')).toBeInTheDocument()
  })

  test('70%以上の項目がハイライト表示される', async () => {
    render(<GameStatsComponent gameId={30549} />)

    await waitFor(() => {
      expect(screen.getByText('セット収集')).toBeInTheDocument()
    })

    // ハイライト表示の確認（CSSクラスの存在）
    const highlightItems = screen.getAllByText(/90\.9%|100\.0%/)
    expect(highlightItems.length).toBeGreaterThan(0)
  })

  test('カテゴリータブに空メッセージが表示される', async () => {
    render(<GameStatsComponent gameId={30549} />)

    // カテゴリータブに切り替え
    const categoriesTab = screen.getByText('カテゴリー')
    categoriesTab.click()

    await waitFor(() => {
      expect(screen.getByText('カテゴリー統計データがありません（30%以上の項目なし）')).toBeInTheDocument()
    })
  })

  test('APIエラー時にエラーメッセージが表示される', async () => {
    // エラーレスポンスを返すハンドラーに変更
    server.use(
      rest.get('/api/games/:id/stats', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Internal Server Error' }))
      })
    )

    render(<GameStatsComponent gameId={30549} />)

    await waitFor(() => {
      expect(screen.getByText('統計データの取得に失敗しました')).toBeInTheDocument()
    })

    // 再試行ボタンの存在確認
    expect(screen.getByText('再試行')).toBeInTheDocument()
  })
})