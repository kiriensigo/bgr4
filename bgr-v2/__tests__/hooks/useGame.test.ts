import { renderHook, waitFor } from '@testing-library/react'
import { useGame } from '@/hooks/useGame'

// Supabaseクライアントのモック
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn()
  }))
}

jest.mock('@/lib/supabase', () => ({
  createSupabaseClient: () => mockSupabase
}))

describe('useGame hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch game data successfully', async () => {
    const mockGameData = {
      id: 1,
      name: 'Gloomhaven',
      description: 'Epic board game',
      yearPublished: 2017,
      minPlayers: 1,
      maxPlayers: 4,
      playingTime: 120
    }

    mockSupabase.from().single.mockResolvedValueOnce({
      data: mockGameData,
      error: null
    })

    const { result } = renderHook(() => useGame(1))

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockGameData)
    expect(result.current.error).toBeNull()
    expect(mockSupabase.from).toHaveBeenCalledWith('games')
  })

  it('should handle error when fetching game', async () => {
    const mockError = { message: 'Game not found' }

    mockSupabase.from().single.mockResolvedValueOnce({
      data: null,
      error: mockError
    })

    const { result } = renderHook(() => useGame(999))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBeNull()
    expect(result.current.error).toEqual(mockError)
  })

  it('should not fetch when gameId is null', () => {
    const { result } = renderHook(() => useGame(null))

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
    expect(mockSupabase.from).not.toHaveBeenCalled()
  })

  it('should refetch when gameId changes', async () => {
    const mockGameData1 = { id: 1, name: 'Game 1' }
    const mockGameData2 = { id: 2, name: 'Game 2' }

    mockSupabase.from().single
      .mockResolvedValueOnce({
        data: mockGameData1,
        error: null
      })
      .mockResolvedValueOnce({
        data: mockGameData2,
        error: null
      })

    const { result, rerender } = renderHook(
      ({ gameId }) => useGame(gameId),
      { initialProps: { gameId: 1 } }
    )

    await waitFor(() => {
      expect(result.current.data).toEqual(mockGameData1)
    })

    rerender({ gameId: 2 })

    await waitFor(() => {
      expect(result.current.data).toEqual(mockGameData2)
    })

    expect(mockSupabase.from).toHaveBeenCalledTimes(2)
  })
})