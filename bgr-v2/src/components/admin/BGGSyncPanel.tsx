'use client'

import { useEffect, useState } from 'react'
import { 
  RefreshCw, 
  Database, 
  Clock, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  PlayCircle,
  Loader2,
  Settings
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useBGGSync, BGGSyncType } from '@/hooks/useBGGSync'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'

export function BGGSyncPanel() {
  const { 
    syncInProgress, 
    lastSyncResult, 
    syncStatus, 
    startSync, 
    fetchStatus,
    error 
  } = useBGGSync()

  const [selectedSyncType, setSelectedSyncType] = useState<BGGSyncType>('rankings')
  const [gameIds, setGameIds] = useState('')
  const [forceUpdate, setForceUpdate] = useState(false)

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const handleStartSync = async () => {
    const request = {
      sync_type: selectedSyncType,
      force_update: forceUpdate,
      ...(selectedSyncType === 'specific_games' && {
        game_ids: gameIds
          .split(',')
          .map(id => parseInt(id.trim()))
          .filter(id => !isNaN(id))
      })
    }

    if (selectedSyncType === 'specific_games' && request.game_ids?.length === 0) {
      return
    }

    await startSync(request)
  }

  const getSyncTypeDescription = (type: BGGSyncType) => {
    switch (type) {
      case 'rankings':
        return 'BGGホットランキング上位100ゲーム'
      case 'specific_games':
        return '指定したBGG IDのゲーム'
      case 'full_sync':
        return '既存のBGGゲーム全て'
      default:
        return ''
    }
  }

  const getStatusColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* ステータス概要 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{syncStatus?.total_games || 0}</div>
                <div className="text-xs text-muted-foreground">総ゲーム数</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{syncStatus?.bgg_games || 0}</div>
                <div className="text-xs text-muted-foreground">BGG連携済み</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">{syncStatus?.stale_games || 0}</div>
                <div className="text-xs text-muted-foreground">要更新</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-purple-600" />
              <div>
                <div className={`text-2xl font-bold ${getStatusColor(syncStatus?.coverage_percentage || 0)}`}>
                  {syncStatus?.coverage_percentage || 0}%
                </div>
                <div className="text-xs text-muted-foreground">カバレッジ</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 同期操作パネル */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            BGG同期設定
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>同期タイプ</Label>
              <Select 
                value={selectedSyncType} 
                onValueChange={(value) => setSelectedSyncType(value as BGGSyncType)}
                disabled={syncInProgress}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rankings">ホットランキング</SelectItem>
                  <SelectItem value="specific_games">指定ゲーム</SelectItem>
                  <SelectItem value="full_sync">全体同期</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {getSyncTypeDescription(selectedSyncType)}
              </p>
            </div>

            {selectedSyncType === 'specific_games' && (
              <div className="space-y-2">
                <Label>BGG ID（カンマ区切り）</Label>
                <Input
                  value={gameIds}
                  onChange={(e) => setGameIds(e.target.value)}
                  placeholder="174430, 220308, 182028"
                  disabled={syncInProgress}
                />
                <p className="text-xs text-muted-foreground">
                  同期したいゲームのBGG IDをカンマで区切って入力
                </p>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="force-update"
                checked={forceUpdate}
                onCheckedChange={setForceUpdate}
                disabled={syncInProgress}
              />
              <Label htmlFor="force-update">強制更新</Label>
            </div>
            <p className="text-xs text-muted-foreground col-span-2">
              キャッシュを無視して全てのゲームデータを更新します
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleStartSync}
              disabled={syncInProgress || (selectedSyncType === 'specific_games' && !gameIds.trim())}
              className="flex items-center gap-2"
            >
              {syncInProgress ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <PlayCircle className="w-4 h-4" />
              )}
              同期開始
            </Button>

            <Button
              variant="outline"
              onClick={() => fetchStatus()}
              disabled={syncInProgress}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              ステータス更新
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 進行状況・結果表示 */}
      {syncInProgress && (
        <Card>
          <CardHeader>
            <CardTitle>同期進行中...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>BGGからデータを取得・更新中です。しばらくお待ちください。</span>
            </div>
            <Progress value={33} className="mt-4" />
          </CardContent>
        </Card>
      )}

      {/* 最新の同期結果 */}
      {lastSyncResult && (
        <Card>
          <CardHeader>
            <CardTitle>最新の同期結果</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-lg font-semibold text-green-600">
                  {lastSyncResult.successful_updates}
                </div>
                <div className="text-sm text-muted-foreground">成功</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-blue-600">
                  {lastSyncResult.new_games_added}
                </div>
                <div className="text-sm text-muted-foreground">新規追加</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-yellow-600">
                  {lastSyncResult.skipped_updates}
                </div>
                <div className="text-sm text-muted-foreground">スキップ</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-red-600">
                  {lastSyncResult.failed_updates}
                </div>
                <div className="text-sm text-muted-foreground">失敗</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>同期タイプ: {lastSyncResult.sync_type}</span>
              <span>
                完了時刻: {formatDistanceToNow(new Date(lastSyncResult.completed_at), { 
                  addSuffix: true, 
                  locale: ja 
                })}
              </span>
            </div>

            {lastSyncResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-red-600">エラー詳細</h4>
                <div className="text-xs bg-red-50 p-3 rounded border max-h-32 overflow-y-auto">
                  {lastSyncResult.errors.slice(0, 5).map((error, index) => (
                    <div key={index} className="text-red-700">
                      {error}
                    </div>
                  ))}
                  {lastSyncResult.errors.length > 5 && (
                    <div className="text-red-600 font-medium">
                      ...および他{lastSyncResult.errors.length - 5}件のエラー
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 最近同期されたゲーム */}
      {syncStatus?.recent_synced_games && syncStatus.recent_synced_games.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>最近同期されたゲーム</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {syncStatus.recent_synced_games.map((game, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div>
                    <div className="font-medium">{game.name}</div>
                    <div className="text-sm text-muted-foreground">
                      BGG ID: {game.bgg_id}
                    </div>
                  </div>
                  <Badge variant="outline">
                    {formatDistanceToNow(new Date(game.updated_at), { 
                      addSuffix: true, 
                      locale: ja 
                    })}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}