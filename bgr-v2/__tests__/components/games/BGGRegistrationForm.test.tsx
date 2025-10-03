import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import BGGRegistrationForm from '@/components/games/BGGRegistrationForm'
import { getSupabaseClient } from '@/lib/supabase-client'
import { toast } from '@/hooks/useToast'

jest.mock('@/lib/supabase-client', () => ({
  getSupabaseClient: jest.fn(),
}))

jest.mock('@/hooks/useToast', () => ({
  toast: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    prefetch: jest.fn(),
  })),
}))

const mockedGetSupabaseClient = getSupabaseClient as jest.MockedFunction<typeof getSupabaseClient>
const toastMock = toast as jest.MockedFunction<typeof toast>

const createSupabaseMock = () => ({
  auth: {
    getSession: jest.fn(async () => ({
      data: {
        session: {
          access_token: 'mock-token',
          user: { id: 'test-user-id' },
        },
      },
      error: null,
    })),
  },
})

const createBggGame = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 224517,
  name: 'Brass: Birmingham',
  description: 'A strategy game about the industrial revolution.',
  yearPublished: 2018,
  minPlayers: 2,
  maxPlayers: 4,
  playingTime: 120,
  averageRating: 8.57459,
  ratingCount: 53767,
  image: 'https://example.com/image.jpg',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  mechanics: ['Network Building'],
  categories: ['Economic'],
  designers: ['Martin Wallace'],
  publishers: ['Roxley'],
  ...overrides,
})

global.fetch = jest.fn()
const mockFetch = fetch as jest.MockedFunction<typeof fetch>

beforeEach(() => {
  jest.clearAllMocks()
  mockedGetSupabaseClient.mockReturnValue(createSupabaseMock() as any)
})

afterEach(() => {
  mockFetch.mockReset()
})

const fillSearchInput = (value: string) => {
  const input = screen.getByLabelText('BGG URL または ゲームID')
  fireEvent.change(input, { target: { value } })
  return input
}

describe('BGGRegistrationForm', () => {
  it('renders disabled search button by default', () => {
    render(<BGGRegistrationForm />)

    const input = screen.getByLabelText('BGG URL または ゲームID')
    const searchButton = screen.getByRole('button', { name: '検索' })

    expect(input).toHaveValue('')
    expect(searchButton).toBeDisabled()
  })

  it('handles button state and invalid input feedback', async () => {
    render(<BGGRegistrationForm />)

    const searchButton = screen.getByRole('button', { name: '検索' })

    fillSearchInput('224517')
    expect(searchButton).toBeEnabled()

    fillSearchInput('https://boardgamegeek.com/boardgame/224517/brass-birmingham')
    expect(searchButton).toBeEnabled()

    mockFetch.mockClear()
    toastMock.mockClear()

    fillSearchInput('invalid input')
    fireEvent.click(searchButton)

    expect(mockFetch).not.toHaveBeenCalled()

    const errorMessage = await screen.findByRole('alert')
    expect((errorMessage.textContent ?? '').trim().length).toBeGreaterThan(0)
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'destructive' }),
    )
  })

  it('loads preview after successful BGG lookup', async () => {
    const game = createBggGame()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: game }),
    } as Response)

    render(<BGGRegistrationForm />)

    fillSearchInput(String(game.id))
    fireEvent.click(screen.getByRole('button', { name: '検索' }))

    const previewHeading = await screen.findByRole('heading', { name: game.name })
    expect(previewHeading).toBeInTheDocument()
    expect(screen.getByText(/BGG評価/)).toBeInTheDocument()
    expect(screen.getByText(/8\.57459/)).toBeInTheDocument()
    expect(screen.getByText('Network Building')).toBeInTheDocument()
    expect(screen.getByText('Martin Wallace')).toBeInTheDocument()
  })

  it('shows API error message when BGG returns failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false, message: 'ゲーム情報が見つかりませんでした' }),
    } as Response)

    render(<BGGRegistrationForm />)

    fillSearchInput('999999')
    fireEvent.click(screen.getByRole('button', { name: '検索' }))

    const errorMessage = await screen.findByRole('alert')
    expect(errorMessage).toHaveTextContent('指定されたIDのゲームが見つかりませんでした')
  })

  it('shows network error when fetch is rejected', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(<BGGRegistrationForm />)

    fillSearchInput('224517')
    fireEvent.click(screen.getByRole('button', { name: '検索' }))

    const errorMessage = await screen.findByRole('alert')
    expect(errorMessage).toHaveTextContent('ネットワークエラーが発生しました')
  })

  it('registers game after preview and shows success toast', async () => {
    const previewGame = createBggGame({ id: 266192, name: 'Wingspan' })
    const registered = { id: 99, ...previewGame }

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: previewGame }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: registered }),
      } as Response)

    render(<BGGRegistrationForm />)

    fillSearchInput(String(previewGame.id))
    fireEvent.click(screen.getByRole('button', { name: '検索' }))
    await screen.findByRole('heading', { name: previewGame.name })

    fireEvent.click(screen.getByRole('button', { name: 'ゲームを登録' }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/games/register-from-bgg',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ Authorization: expect.stringContaining('Bearer') }),
        }),
      )
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'success' }),
      )
    })
  })

  it('shows duplicate registration error from API response', async () => {
    const previewGame = createBggGame({ id: 13, name: 'CATAN' })

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: previewGame }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          success: false,
          message: 'このゲーム「CATAN」は既に登録されています',
        }),
      } as Response)

    render(<BGGRegistrationForm />)

    fillSearchInput(String(previewGame.id))
    fireEvent.click(screen.getByRole('button', { name: '検索' }))
    await screen.findByRole('heading', { name: previewGame.name })

    fireEvent.click(screen.getByRole('button', { name: 'ゲームを登録' }))

    const errorMessage = await screen.findByText('このゲーム「CATAN」は既に登録されています')
    expect(errorMessage).toBeInTheDocument()
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'destructive' }),
    )
  })

  it('keeps placeholder and aria attributes for accessibility', () => {
    render(<BGGRegistrationForm />)

    const input = screen.getByLabelText('BGG URL または ゲームID')
    const searchButton = screen.getByRole('button', { name: '検索' })

    expect(input).toHaveAttribute(
      'placeholder',
      '例: https://boardgamegeek.com/boardgame/266192/ または 266192',
    )
    expect(searchButton).toHaveAttribute('disabled')
  })
})

