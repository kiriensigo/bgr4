'use client'

import { useState } from 'react'
import { GameImageUpload } from '@/components/forms/GameImageUpload'
import { ProfileImageUpload } from '@/components/forms/ProfileImageUpload'
import { FileUpload } from '@/components/ui/FileUpload'
import { uploadFile, uploadConfigs } from '@/lib/upload'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { createSimpleSupabaseClient } from '@/lib/supabase-simple'

export default function UploadTestPage() {
  const [gameImageUrl, setGameImageUrl] = useState<string | null>(null)
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null)
  const [reviewImages, setReviewImages] = useState<File[]>([])
  const [uploadResults, setUploadResults] = useState<string[]>([])
  const [status, setStatus] = useState<string>('')
  const [connectionStatus, setConnectionStatus] = useState<string>('未確認')

  const testSupabaseConnection = async () => {
    setConnectionStatus('確認中...')
    try {
      const supabase = createSimpleSupabaseClient()
      
      // 接続テスト
      const { error: healthError } = await supabase
        .from('games')
        .select('count')
        .limit(1)
      
      if (healthError) {
        setConnectionStatus(`接続エラー: ${healthError.message}`)
        return
      }

      // Storage バケット確認
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
      
      if (bucketError) {
        setConnectionStatus(`Storage エラー: ${bucketError.message}`)
        return
      }
      
      const bucketNames = buckets?.map(b => b.name) || []
      setConnectionStatus(`✅ 接続成功 - バケット: ${bucketNames.join(', ')}`)
      
    } catch (error) {
      setConnectionStatus(`予期しないエラー: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleReviewImagesUpload = async () => {
    if (reviewImages.length === 0) return

    setStatus('アップロード中...')
    const results: string[] = []

    for (const file of reviewImages) {
      const result = await uploadFile(file, 'reviewImages', 'test-user')
      if (result.success && result.url) {
        results.push(result.url)
      } else {
        results.push(`エラー: ${result.error}`)
      }
    }

    setUploadResults(results)
    setStatus('アップロード完了')
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">画像アップロード機能テスト</h1>
        <p className="text-muted-foreground mt-2">
          各種画像アップロード機能の動作を確認できます
        </p>
      </div>

      {/* 接続テスト */}
      <Card>
        <CardHeader>
          <CardTitle>Supabase 接続テスト</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button onClick={testSupabaseConnection}>
              接続テスト実行
            </Button>
            <span className="text-sm">
              ステータス: {connectionStatus}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-8 md:grid-cols-2">
        {/* ゲーム画像アップロード */}
        <Card>
          <CardHeader>
            <CardTitle>ゲーム画像アップロード</CardTitle>
          </CardHeader>
          <CardContent>
            <GameImageUpload
              value={gameImageUrl || undefined}
              onChange={setGameImageUrl}
            />
            {gameImageUrl && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">
                  アップロード成功: {gameImageUrl}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* プロフィール画像アップロード */}
        <Card>
          <CardHeader>
            <CardTitle>プロフィール画像アップロード</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileImageUpload
              value={profileImageUrl || undefined}
              onChange={setProfileImageUrl}
              userId="test-user"
              userName="Test User"
              size="lg"
            />
            {profileImageUrl && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">
                  アップロード成功: {profileImageUrl}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* レビュー画像アップロード */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>レビュー画像アップロード（複数）</CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload
              accept={uploadConfigs.reviewImages.allowedTypes.join(',')}
              multiple={true}
              maxSize={uploadConfigs.reviewImages.maxSize}
              maxFiles={uploadConfigs.reviewImages.maxFiles}
              onFileSelect={setReviewImages}
            />

            {reviewImages.length > 0 && (
              <div className="mt-4 space-y-4">
                <Button onClick={handleReviewImagesUpload}>
                  {reviewImages.length}ファイルをアップロード
                </Button>

                {status && (
                  <p className="text-sm text-muted-foreground">{status}</p>
                )}

                {uploadResults.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">アップロード結果:</h4>
                    {uploadResults.map((result, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg ${
                          result.startsWith('エラー') 
                            ? 'bg-red-50 text-red-700' 
                            : 'bg-green-50 text-green-700'
                        }`}
                      >
                        <p className="text-sm">{result}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 設定情報 */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>アップロード設定</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <h4 className="font-medium mb-2">プロフィール画像</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>最大サイズ: {uploadConfigs.profile.maxSize}MB</li>
                  <li>ファイル数: {uploadConfigs.profile.maxFiles}</li>
                  <li>形式: {uploadConfigs.profile.allowedTypes.join(', ')}</li>
                  <li>バケット: {uploadConfigs.profile.bucket}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">ゲーム画像</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>最大サイズ: {uploadConfigs.gameImage.maxSize}MB</li>
                  <li>ファイル数: {uploadConfigs.gameImage.maxFiles}</li>
                  <li>形式: {uploadConfigs.gameImage.allowedTypes.join(', ')}</li>
                  <li>バケット: {uploadConfigs.gameImage.bucket}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">レビュー画像</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>最大サイズ: {uploadConfigs.reviewImages.maxSize}MB</li>
                  <li>ファイル数: {uploadConfigs.reviewImages.maxFiles}</li>
                  <li>形式: {uploadConfigs.reviewImages.allowedTypes.join(', ')}</li>
                  <li>バケット: {uploadConfigs.reviewImages.bucket}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}