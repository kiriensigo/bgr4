import useSWR from 'swr'

export interface GameStatItem {
  name: string
  reviewVotes: number
  bggVotes: number
  totalVotes: number
  totalReviews: number
  percentage: number
  displayPriority: 'highlight' | 'normal' | 'hidden'
}

export interface GameStats {
  mechanics: GameStatItem[]
  categories: GameStatItem[]
  playerCounts: GameStatItem[]
}

interface UseGameStatsResult {
  stats: GameStats | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  mutate: () => Promise<void>
}

// SWR fetcher function
const fetcher = async (url: string): Promise<GameStats> => {
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  const data = await response.json()
  
  // APIから返されたデータの構造を検証
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid response format')
  }
  
  return {
    mechanics: data.mechanics || [],
    categories: data.categories || [],
    playerCounts: data.playerCounts || []
  }
}

export function useGameStats(gameId: number): UseGameStatsResult {
  const shouldFetch = gameId && !isNaN(gameId)
  
  const {
    data: stats,
    error,
    isLoading,
    mutate
  } = useSWR(
    shouldFetch ? `/api/games/${gameId}/stats` : null,
    fetcher,
    {
      // キャッシュ設定
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 60000, // 1分間隔で自動更新
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      
      // 初期データローディング時の設定
      loadingTimeout: 10000,
      
      // エラーハンドリング
      onError: (err) => {
        console.error('SWR Stats fetch error:', err)
      },
      
      // 成功時のログ
      onSuccess: (data) => {
        console.log('Stats fetched successfully:', {
          mechanics: data.mechanics.length,
          categories: data.categories.length, 
          playerCounts: data.playerCounts.length
        })
      }
    }
  )

  // エラーメッセージの変換
  const errorMessage = error?.message || null

  // レガシーrefetch関数のサポート
  const refetch = async () => {
    await mutate()
  }

  // キャッシュの無効化
  const invalidateCache = async () => {
    await mutate(undefined, { revalidate: true })
  }

  return {
    stats: stats || null,
    isLoading,
    error: errorMessage,
    refetch,
    mutate: invalidateCache
  }
}