'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useAuth } from '@/hooks/useAuth'
import { useUser } from '@/hooks/useUser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { 
  Server,
  Database,
  Globe,
  Mail,
  Shield,
  AlertTriangle,
  Save,
  RotateCcw
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'

function AdminSettingsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useUser()
  const [loading, setLoading] = useState(true)
  const [saveLoading, setSaveLoading] = useState(false)

  // Settings State
  const [siteSettings, setSiteSettings] = useState({
    siteName: 'BGR - Board Game Review',
    siteDescription: 'ボードゲームのレビューと情報を共有するコミュニティサイト',
    siteUrl: 'https://bgrq.netlify.app',
    adminEmail: 'admin@bgr.com',
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: true
  })

  const [bggSettings, setBggSettings] = useState({
    apiKey: '',
    rateLimit: 1000,
    cacheDuration: 3600,
    autoSync: true,
    syncInterval: 24
  })

  const [emailSettings, setEmailSettings] = useState({
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    fromEmail: 'noreply@bgr.com',
    fromName: 'BGR Team'
  })

  useEffect(() => {
    if (!authLoading && !profileLoading) {
      if (!user) {
        router.push('/login?redirect=/admin/settings')
        return
      }
      
      if (!profile?.is_admin) {
        router.push('/?error=unauthorized')
        return
      }
      
      setLoading(false)
    }
  }, [user, profile, authLoading, profileLoading, router])

  if (loading || authLoading || profileLoading) {
    return <AdminSettingsPageSkeleton />
  }

  const handleSaveSettings = async () => {
    setSaveLoading(true)
    try {
      // 実装: 設定保存API
      console.log('Saving settings:', { siteSettings, bggSettings, emailSettings })
      await new Promise(resolve => setTimeout(resolve, 1000)) // Mock delay
      alert('設定を保存しました')
    } catch (error) {
      console.error('Settings save error:', error)
      alert('設定の保存に失敗しました')
    } finally {
      setSaveLoading(false)
    }
  }

  const handleResetSettings = () => {
    if (confirm('設定をデフォルト値にリセットしますか？')) {
      // Reset to defaults
      setSiteSettings({
        siteName: 'BGR - Board Game Review',
        siteDescription: 'ボードゲームのレビューと情報を共有するコミュニティサイト',
        siteUrl: 'https://bgrq.netlify.app',
        adminEmail: 'admin@bgr.com',
        maintenanceMode: false,
        allowRegistration: true,
        requireEmailVerification: true
      })
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">システム設定</h1>
            <p className="mt-2 text-gray-600">
              サイト全体の設定とシステム管理を行えます
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handleResetSettings}
              disabled={saveLoading}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              リセット
            </Button>
            <Button
              onClick={handleSaveSettings}
              disabled={saveLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              {saveLoading ? '保存中...' : '設定を保存'}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="site" className="space-y-6">
          <TabsList>
            <TabsTrigger value="site">
              <Globe className="h-4 w-4 mr-2" />
              サイト設定
            </TabsTrigger>
            <TabsTrigger value="bgg">
              <Database className="h-4 w-4 mr-2" />
              BGG連携
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="h-4 w-4 mr-2" />
              メール設定
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              セキュリティ
            </TabsTrigger>
            <TabsTrigger value="maintenance">
              <Server className="h-4 w-4 mr-2" />
              システム
            </TabsTrigger>
          </TabsList>

          {/* Site Settings */}
          <TabsContent value="site">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>サイト基本設定</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">サイト名</Label>
                    <Input
                      id="siteName"
                      value={siteSettings.siteName}
                      onChange={(e) => setSiteSettings({...siteSettings, siteName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="siteUrl">サイトURL</Label>
                    <Input
                      id="siteUrl"
                      type="url"
                      value={siteSettings.siteUrl}
                      onChange={(e) => setSiteSettings({...siteSettings, siteUrl: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="siteDescription">サイト説明</Label>
                  <Textarea
                    id="siteDescription"
                    value={siteSettings.siteDescription}
                    onChange={(e) => setSiteSettings({...siteSettings, siteDescription: e.target.value})}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">管理者メールアドレス</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={siteSettings.adminEmail}
                    onChange={(e) => setSiteSettings({...siteSettings, adminEmail: e.target.value})}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>新規登録を許可</Label>
                      <p className="text-sm text-gray-500">ユーザーの新規アカウント作成を許可します</p>
                    </div>
                    <Switch
                      checked={siteSettings.allowRegistration}
                      onCheckedChange={(checked) => setSiteSettings({...siteSettings, allowRegistration: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>メール認証を必要とする</Label>
                      <p className="text-sm text-gray-500">登録時にメールアドレスの認証を必須にします</p>
                    </div>
                    <Switch
                      checked={siteSettings.requireEmailVerification}
                      onCheckedChange={(checked) => setSiteSettings({...siteSettings, requireEmailVerification: checked})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* BGG Settings */}
          <TabsContent value="bgg">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>BoardGameGeek連携設定</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    BGG APIは利用制限があります。適切なレート制限を設定してください。
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="bggApiKey">BGG APIキー（オプション）</Label>
                    <Input
                      id="bggApiKey"
                      type="password"
                      placeholder="未設定（パブリックAPIを使用）"
                      value={bggSettings.apiKey}
                      onChange={(e) => setBggSettings({...bggSettings, apiKey: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rateLimit">レート制限（ミリ秒）</Label>
                    <Input
                      id="rateLimit"
                      type="number"
                      value={bggSettings.rateLimit}
                      onChange={(e) => setBggSettings({...bggSettings, rateLimit: Number(e.target.value)})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="cacheDuration">キャッシュ持続時間（秒）</Label>
                    <Input
                      id="cacheDuration"
                      type="number"
                      value={bggSettings.cacheDuration}
                      onChange={(e) => setBggSettings({...bggSettings, cacheDuration: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="syncInterval">自動同期間隔（時間）</Label>
                    <Input
                      id="syncInterval"
                      type="number"
                      value={bggSettings.syncInterval}
                      onChange={(e) => setBggSettings({...bggSettings, syncInterval: Number(e.target.value)})}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>自動同期を有効化</Label>
                    <p className="text-sm text-gray-500">定期的にBGGから新しい情報を取得します</p>
                  </div>
                  <Switch
                    checked={bggSettings.autoSync}
                    onCheckedChange={(checked) => setBggSettings({...bggSettings, autoSync: checked})}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Settings */}
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="h-5 w-5" />
                  <span>メール送信設定</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    メール設定は慎重に行ってください。間違った設定は通知メールの送信を妨げます。
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost">SMTPホスト</Label>
                    <Input
                      id="smtpHost"
                      placeholder="smtp.gmail.com"
                      value={emailSettings.smtpHost}
                      onChange={(e) => setEmailSettings({...emailSettings, smtpHost: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">SMTPポート</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      value={emailSettings.smtpPort}
                      onChange={(e) => setEmailSettings({...emailSettings, smtpPort: Number(e.target.value)})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="smtpUser">SMTPユーザー名</Label>
                    <Input
                      id="smtpUser"
                      value={emailSettings.smtpUser}
                      onChange={(e) => setEmailSettings({...emailSettings, smtpUser: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPassword">SMTPパスワード</Label>
                    <Input
                      id="smtpPassword"
                      type="password"
                      value={emailSettings.smtpPassword}
                      onChange={(e) => setEmailSettings({...emailSettings, smtpPassword: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fromEmail">送信元メールアドレス</Label>
                    <Input
                      id="fromEmail"
                      type="email"
                      value={emailSettings.fromEmail}
                      onChange={(e) => setEmailSettings({...emailSettings, fromEmail: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fromName">送信者名</Label>
                    <Input
                      id="fromName"
                      value={emailSettings.fromName}
                      onChange={(e) => setEmailSettings({...emailSettings, fromName: e.target.value})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>セキュリティ設定</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    セキュリティ設定の詳細機能は今後実装予定です。
                  </AlertDescription>
                </Alert>
                
                <div className="mt-6 space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">実装予定の機能</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• レート制限設定</li>
                      <li>• IP制限・ブロック機能</li>
                      <li>• セッション管理</li>
                      <li>• 2要素認証設定</li>
                      <li>• パスワードポリシー</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Maintenance Settings */}
          <TabsContent value="maintenance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Server className="h-5 w-5" />
                  <span>システム管理</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <h4 className="font-medium text-red-600">メンテナンスモード</h4>
                    <p className="text-sm text-gray-500">
                      サイトを一時的に非公開にし、管理者のみアクセス可能にします
                    </p>
                  </div>
                  <Switch
                    checked={siteSettings.maintenanceMode}
                    onCheckedChange={(checked) => setSiteSettings({...siteSettings, maintenanceMode: checked})}
                  />
                </div>
                
                {siteSettings.maintenanceMode && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      メンテナンスモードが有効です。一般ユーザーはサイトにアクセスできません。
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-4">
                  <h4 className="font-medium">システム情報</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-gray-50 rounded">
                      <div className="font-medium text-gray-600">Next.js</div>
                      <div>Version 14.0</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <div className="font-medium text-gray-600">Supabase</div>
                      <div>Connected</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <div className="font-medium text-gray-600">デプロイ環境</div>
                      <div>Netlify</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <div className="font-medium text-gray-600">Node.js</div>
                      <div>Version 18+</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}

function AdminSettingsPageSkeleton() {
  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex justify-between">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded"></div>
        </div>
        
        <div className="space-y-6">
          <div className="h-10 bg-gray-200 rounded w-full"></div>
          <div className="bg-white rounded-lg border p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-10 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default function AdminSettingsPageWrapper() {
  return <AdminSettingsPage />
}