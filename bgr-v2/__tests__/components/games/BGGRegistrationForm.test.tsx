import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import BGGRegistrationForm from '@/components/games/BGGRegistrationForm'

// Supabase client mock
jest.mock('@/lib/supabase-client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(() => Promise.resolve({
        data: {
          session: {
            access_token: 'mock-token',
            user: { id: 'test-user-id' }
          }
        }
      }))
    }
  }
}))

// Next.js router mock
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    prefetch: jest.fn()
  }))
}))

// fetch APIをモック
global.fetch = jest.fn()
const mockFetch = fetch as jest.MockedFunction<typeof fetch>

describe('BGGRegistrationForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('コンポーネント基本レンダリング', () => {
    it('初期状態で正しくレンダリングされる', () => {
      render(<BGGRegistrationForm />)
      
      expect(screen.getByLabelText('BGG URL または ゲームID')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '検索' })).toBeDisabled()
      expect(screen.getByText('入力例:')).toBeInTheDocument()
    })

    it('BGG ID入力例が表示される', () => {
      render(<BGGRegistrationForm />)
      
      expect(screen.getByText('266192')).toBeInTheDocument()
      expect(screen.getByText('- BGG ID直接入力')).toBeInTheDocument()
      expect(screen.getByText('https://boardgamegeek.com/boardgame/266192/wingspan')).toBeInTheDocument()
    })
  })

  describe('フォーム入力バリデーション', () => {
    it('有効なBGG ID入力で検索ボタンが有効になる', () => {
      render(<BGGRegistrationForm />)
      
      const input = screen.getByLabelText('BGG URL または ゲームID')
      const searchButton = screen.getByRole('button', { name: '検索' })
      
      expect(searchButton).toBeDisabled()
      
      fireEvent.change(input, { target: { value: '224517' } })
      expect(searchButton).toBeEnabled()
    })

    it('BGG URL入力でID抽出とボタン有効化', () => {
      render(<BGGRegistrationForm />)
      
      const input = screen.getByLabelText('BGG URL または ゲームID')
      const searchButton = screen.getByRole('button', { name: '検索' })
      
      fireEvent.change(input, { 
        target: { value: 'https://boardgamegeek.com/boardgame/266192/wingspan' } 
      })
      
      expect(searchButton).toBeEnabled()
    })

    it('無効な入力で検索ボタンが無効のまま', () => {
      render(<BGGRegistrationForm />)
      
      const input = screen.getByLabelText('BGG URL または ゲームID')
      const searchButton = screen.getByRole('button', { name: '検索' })
      
      fireEvent.change(input, { target: { value: 'invalid input' } })
      expect(searchButton).toBeDisabled()
    })
  })

  describe('BGG API連携テスト', () => {
    it('BGG情報取得成功時にプレビューが表示される', async () => {
      const mockGameData = {
        id: 224517,
        name: 'Brass: Birmingham',
        description: 'A strategy game',
        yearPublished: 2018,
        minPlayers: 2,
        maxPlayers: 4,
        playingTime: 120,
        averageRating: 8.57459,
        usersRated: 53767,
        image: 'https://example.com/image.jpg',
        mechanics: ['Network Building'],
        categories: ['Economic'],
        designers: ['Martin Wallace'],
        publishers: ['Roxley']
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockGameData
        })
      } as Response)

      render(<BGGRegistrationForm />)
      
      const input = screen.getByLabelText('BGG URL または ゲームID')
      const searchButton = screen.getByRole('button', { name: '検索' })
      
      fireEvent.change(input, { target: { value: '224517' } })
      fireEvent.click(searchButton)
      
      await waitFor(() => {
        expect(screen.getByText('Brass: Birmingham')).toBeInTheDocument()
        expect(screen.getByText('発売年: 2018')).toBeInTheDocument()
        expect(screen.getByText('2〜4人')).toBeInTheDocument()
        expect(screen.getByText('120分')).toBeInTheDocument()
        expect(screen.getByText('BGG評価: 8.57459')).toBeInTheDocument()
      })
    })

    it('BGG API エラー時にエラーメッセージ表示', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          message: 'ゲーム情報が見つかりませんでした'
        })
      } as Response)

      render(<BGGRegistrationForm />)
      
      const input = screen.getByLabelText('BGG URL または ゲームID')
      const searchButton = screen.getByRole('button', { name: '検索' })
      
      fireEvent.change(input, { target: { value: '999999' } })
      fireEvent.click(searchButton)
      
      await waitFor(() => {
        expect(screen.getByText('指定されたIDのゲームが見つかりませんでした')).toBeInTheDocument()
      })
    })

    it('ネットワークエラー時の適切なエラー処理', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(<BGGRegistrationForm />)
      
      const input = screen.getByLabelText('BGG URL または ゲームID')
      const searchButton = screen.getByRole('button', { name: '検索' })
      
      fireEvent.change(input, { target: { value: '224517' } })
      fireEvent.click(searchButton)
      
      await waitFor(() => {
        expect(screen.getByText('ネットワークエラーが発生しました')).toBeInTheDocument()
      })
    })
  })

  describe('ゲーム登録機能テスト', () => {
    it('ゲーム登録成功時の処理', async () => {
      const mockGameData = {
        id: 266192,
        name: 'Wingspan',
        description: 'Bird game',
        yearPublished: 2019,
        minPlayers: 1,
        maxPlayers: 5,
        playingTime: 70,
        averageRating: 8.0,
        usersRated: 30000,
        image: 'https://example.com/wingspan.jpg',
        mechanics: [],
        categories: [],
        designers: [],
        publishers: []
      }

      // BGG情報取得成功
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockGameData })
      } as Response)

      // ゲーム登録成功
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'ゲームが正常に登録されました',
          data: { id: 32, ...mockGameData }
        })
      } as Response)

      render(<BGGRegistrationForm />)
      
      // BGG情報取得
      const input = screen.getByLabelText('BGG URL または ゲームID')
      const searchButton = screen.getByRole('button', { name: '検索' })
      
      fireEvent.change(input, { target: { value: '266192' } })
      fireEvent.click(searchButton)
      
      // ゲーム登録
      await waitFor(() => {
        expect(screen.getByText('Wingspan')).toBeInTheDocument()
      })
      
      const registerButton = screen.getByRole('button', { name: 'ゲームを登録' })
      fireEvent.click(registerButton)
      
      await waitFor(() => {
        expect(screen.getByText('ゲームが正常に登録されました！ゲーム詳細ページに移動します...')).toBeInTheDocument()
      })
    })

    it('ゲーム登録失敗時のエラー表示', async () => {
      const mockGameData = {
        id: 13,
        name: 'CATAN',
        description: 'Settlement building game',
        yearPublished: 1995,
        minPlayers: 3,
        maxPlayers: 4,
        playingTime: 75,
        averageRating: 7.2,
        usersRated: 100000,
        image: 'https://example.com/catan.jpg',
        mechanics: [],
        categories: [],
        designers: [],
        publishers: []
      }

      // BGG情報取得成功
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockGameData })
      } as Response)

      // ゲーム登録失敗（重複）
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          success: false,
          message: 'このゲーム「CATAN」は既に登録されています'
        })
      } as Response)

      render(<BGGRegistrationForm />)
      
      const input = screen.getByLabelText('BGG URL または ゲームID')
      const searchButton = screen.getByRole('button', { name: '検索' })
      
      fireEvent.change(input, { target: { value: '13' } })
      fireEvent.click(searchButton)
      
      await waitFor(() => {
        expect(screen.getByText('CATAN')).toBeInTheDocument()
      })
      
      const registerButton = screen.getByRole('button', { name: 'ゲームを登録' })
      fireEvent.click(registerButton)
      
      await waitFor(() => {
        expect(screen.getByText('このゲーム「CATAN」は既に登録されています')).toBeInTheDocument()
      })
    })
  })

  describe('認証状態処理', () => {
    it('認証状態でのフォーム動作確認', () => {
      render(<BGGRegistrationForm />)
      
      const input = screen.getByLabelText('BGG URL または ゲームID')
      const searchButton = screen.getByRole('button', { name: '検索' })
      
      fireEvent.change(input, { target: { value: '224517' } })
      expect(searchButton).toBeEnabled()
    })
  })

  describe('アクセシビリティ', () => {
    it('適切なARIAラベルとロールが設定されている', () => {
      render(<BGGRegistrationForm />)
      
      const input = screen.getByLabelText('BGG URL または ゲームID')
      expect(input).toHaveAttribute('placeholder')
      
      const searchButton = screen.getByRole('button', { name: '検索' })
      expect(searchButton).toBeInTheDocument()
    })

    it('エラーメッセージが適切にアナウンスされる', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'))

      render(<BGGRegistrationForm />)
      
      const input = screen.getByLabelText('BGG URL または ゲームID')
      const searchButton = screen.getByRole('button', { name: '検索' })
      
      fireEvent.change(input, { target: { value: '224517' } })
      fireEvent.click(searchButton)
      
      await waitFor(() => {
        const errorMessage = screen.getByText('ネットワークエラーが発生しました')
        expect(errorMessage).toBeInTheDocument()
      })
    })
  })
})