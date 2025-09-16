import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EnhancedReviewCard } from '@/components/reviews/EnhancedReviewCard'
import { EnhancedReview } from '@/types/enhanced-review'

const mockReview: EnhancedReview = {
  id: 1,
  title: 'すばらしいゲーム！',
  content: 'このゲームは本当に面白いです。戦略性が高く、何度でも遊べます。長い間楽しめる素晴らしい作品だと思います。',
  overall_score: 9,
  fun_score: 9,
  component_quality: 8,
  rule_complexity: 6,
  replayability: 10,
  game_id: 1,
  user_id: 'user1',
  is_published: true,
  created_at: '2024-01-01T10:00:00.000Z',
  updated_at: '2024-01-01T10:00:00.000Z',
  game: {
    id: 1,
    name: 'テストゲーム',
    description: 'テスト用のゲーム',
    year_published: 2023,
    min_players: 2,
    max_players: 4,
    image_url: '/test-game.jpg'
  },
  user: {
    id: 'user1',
    username: 'testuser',
    full_name: 'テストユーザー',
    avatar_url: '/test-avatar.jpg'
  }
}

describe('EnhancedReviewCard', () => {
  it('レビューの基本情報が正しく表示される', () => {
    render(<EnhancedReviewCard review={mockReview} />)
    
    expect(screen.getByText('すばらしいゲーム！')).toBeInTheDocument()
    expect(screen.getByText(/このゲームは本当に面白いです/)).toBeInTheDocument()
    expect(screen.getByText('9')).toBeInTheDocument() // overall_score
  })

  it('ゲーム情報が表示される（showGame=true）', () => {
    render(<EnhancedReviewCard review={mockReview} showGame={true} />)
    
    expect(screen.getByText('テストゲーム')).toBeInTheDocument()
    expect(screen.getByText('2023年')).toBeInTheDocument()
  })

  it('ユーザー情報が表示される（showUser=true）', () => {
    render(<EnhancedReviewCard review={mockReview} showUser={true} />)
    
    expect(screen.getByText('テストユーザー')).toBeInTheDocument()
    expect(screen.getByText('@testuser')).toBeInTheDocument()
  })

  it('詳細評価が表示される（showDetailedRatings=true）', () => {
    render(<EnhancedReviewCard review={mockReview} showDetailedRatings={true} />)
    
    expect(screen.getByText('楽しさ')).toBeInTheDocument()
    expect(screen.getByText('コンポーネント')).toBeInTheDocument()
    expect(screen.getByText('ルール複雑度')).toBeInTheDocument()
    expect(screen.getByText('リプレイ性')).toBeInTheDocument()
  })

  it('compact バリアントで簡潔な表示になる', () => {
    render(<EnhancedReviewCard review={mockReview} variant="compact" />)
    
    // compactモードでは内容が短縮される
    const content = screen.getByText(/このゲームは本当に面白いです/)
    expect(content).toBeInTheDocument()
  })

  it('詳細表示の展開・収納が正しく動作する', async () => {
    const user = userEvent.setup()
    render(<EnhancedReviewCard review={mockReview} />)
    
    // 初期状態では「続きを読む」ボタンが表示される
    const expandButton = screen.getByText('続きを読む')
    expect(expandButton).toBeInTheDocument()
    
    // ボタンをクリックして展開
    await user.click(expandButton)
    
    // 展開後は「閉じる」ボタンが表示される
    expect(screen.getByText('閉じる')).toBeInTheDocument()
    
    // 全文が表示される
    expect(screen.getByText(/長い間楽しめる素晴らしい作品/)).toBeInTheDocument()
  })

  it('画像の読み込みエラー時にプレースホルダーが表示される', () => {
    const reviewWithoutImage = {
      ...mockReview,
      game: { ...mockReview.game, image_url: undefined }
    }
    
    render(<EnhancedReviewCard review={reviewWithoutImage} showGame={true} />)
    
    const img = screen.getByRole('img', { name: 'テストゲーム' })
    expect(img).toHaveAttribute('src', expect.stringContaining('placeholder'))
  })

  it('日付フォーマットが正しく表示される', () => {
    render(<EnhancedReviewCard review={mockReview} />)
    
    expect(screen.getByText('2024年1月1日')).toBeInTheDocument()
  })

  it('評価スコアの色分けが正しく適用される', () => {
    const lowScoreReview = { ...mockReview, overall_score: 3 }
    const { rerender } = render(<EnhancedReviewCard review={lowScoreReview} />)
    
    // 低評価（3点）は赤色
    expect(screen.getByText('3')).toHaveClass('text-red-600')
    
    const mediumScoreReview = { ...mockReview, overall_score: 6 }
    rerender(<EnhancedReviewCard review={mediumScoreReview} />)
    
    // 中評価（6点）は黄色
    expect(screen.getByText('6')).toHaveClass('text-yellow-600')
    
    const highScoreReview = { ...mockReview, overall_score: 9 }
    rerender(<EnhancedReviewCard review={highScoreReview} />)
    
    // 高評価（9点）は緑色
    expect(screen.getByText('9')).toHaveClass('text-green-600')
  })

  it('アクセシビリティ属性が正しく設定される', () => {
    render(<EnhancedReviewCard review={mockReview} />)
    
    const article = screen.getByRole('article')
    expect(article).toBeInTheDocument()
    
    const heading = screen.getByRole('heading', { name: 'すばらしいゲーム！' })
    expect(heading).toBeInTheDocument()
  })

  it('長いコンテンツが適切に切り詰められる', () => {
    const longContentReview = {
      ...mockReview,
      content: 'あ'.repeat(300) // 300文字の長いコンテンツ
    }
    
    render(<EnhancedReviewCard review={longContentReview} />)
    
    // 切り詰められたコンテンツが表示される
    const truncatedContent = screen.getByText(/あ+\.\.\./)
    expect(truncatedContent).toBeInTheDocument()
    
    // 「続きを読む」ボタンが表示される
    expect(screen.getByText('続きを読む')).toBeInTheDocument()
  })
})