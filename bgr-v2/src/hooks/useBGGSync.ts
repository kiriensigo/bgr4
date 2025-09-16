'use client'

import { useState, useCallback } from 'react'
// Mock toast implementation for build compatibility
const useToast = () => ({
  toast: (options: { title: string; description?: string; variant?: string }) => {
    console.log('Toast:', options)
  }
})

export type BGGSyncType = 'rankings' | 'specific_games' | 'full_sync'

export interface BGGSyncStats {
  sync_type: BGGSyncType
  target_game_count: number
  total_processed: number
  successful_updates: number
  failed_updates: number
  skipped_updates: number
  new_games_added: number
  errors: string[]
  completed_at: string
}

export interface BGGSyncStatus {
  total_games: number
  bgg_games: number
  stale_games: number
  coverage_percentage: number
  recent_synced_games: Array<{
    bgg_id: number
    name: string
    updated_at: string
  }>
  last_check: string
  sync_config: {
    MAX_BATCH_SIZE: number
    RATE_LIMIT_MS: number
    RANKING_FETCH_LIMIT: number
    CACHE_DURATION_HOURS: number
    RETRY_ATTEMPTS: number
    TIMEOUT_MS: number
  }
}

interface BGGSyncRequest {
  sync_type: BGGSyncType
  game_ids?: number[]
  force_update?: boolean
}

interface UseBGGSyncReturn {
  syncInProgress: boolean
  lastSyncResult: BGGSyncStats | null
  syncStatus: BGGSyncStatus | null
  startSync: (request: BGGSyncRequest) => Promise<BGGSyncStats | null>
  fetchStatus: () => Promise<BGGSyncStatus | null>
  error: string | null
}

export function useBGGSync(): UseBGGSyncReturn {
  const [syncInProgress, setSyncInProgress] = useState(false)
  const [lastSyncResult, setLastSyncResult] = useState<BGGSyncStats | null>(null)
  const [syncStatus, setSyncStatus] = useState<BGGSyncStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const startSync = useCallback(async (request: BGGSyncRequest): Promise<BGGSyncStats | null> => {
    if (syncInProgress) {
      toast({
        title: '同期中です',
        description: '既に同期処理が実行中です',
        variant: 'destructive'
      })
      return null
    }

    try {
      setSyncInProgress(true)
      setError(null)

      toast({
        title: 'BGG同期開始',
        description: `${request.sync_type}同期を開始しました`,
      })

      const response = await fetch('/api/admin/bgg-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'BGG sync failed')
      }

      if (result.success) {
        const syncResult = result.data as BGGSyncStats
        setLastSyncResult(syncResult)

        const hasErrors = syncResult.errors.length > 0
        const successMessage = `同期完了: ${syncResult.successful_updates}件成功, ${syncResult.new_games_added}件新規追加`

        toast({
          title: hasErrors ? '同期完了（一部エラー）' : '同期完了',
          description: successMessage,
          variant: hasErrors ? 'destructive' : 'default'
        })

        // ステータスを更新
        await fetchStatus()

        return syncResult
      } else {
        throw new Error(result.message || 'BGG sync failed')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'BGG sync failed'
      setError(errorMessage)
      
      if (errorMessage.includes('Authentication')) {
        toast({
          title: 'ログインが必要です',
          description: 'BGG同期にはログインが必要です',
          variant: 'destructive'
        })
      } else if (errorMessage.includes('Admin')) {
        toast({
          title: '権限が必要です',
          description: 'BGG同期には管理者権限が必要です',
          variant: 'destructive'
        })
      } else {
        toast({
          title: 'BGG同期エラー',
          description: errorMessage,
          variant: 'destructive'
        })
      }

      return null
    } finally {
      setSyncInProgress(false)
    }
  }, [syncInProgress, toast])

  const fetchStatus = useCallback(async (): Promise<BGGSyncStatus | null> => {
    try {
      setError(null)

      const response = await fetch('/api/admin/bgg-sync/status')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch BGG sync status')
      }

      if (result.success) {
        const status = result.data as BGGSyncStatus
        setSyncStatus(status)
        return status
      } else {
        throw new Error(result.message || 'Failed to fetch BGG sync status')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch BGG sync status'
      setError(errorMessage)

      // ステータス取得エラーはログイン関連でない限りトーストを表示しない
      if (errorMessage.includes('Authentication') || errorMessage.includes('Admin')) {
        toast({
          title: 'エラー',
          description: 'BGG同期ステータスの取得に失敗しました',
          variant: 'destructive'
        })
      }

      return null
    }
  }, [toast])

  return {
    syncInProgress,
    lastSyncResult,
    syncStatus,
    startSync,
    fetchStatus,
    error
  }
}