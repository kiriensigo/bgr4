import { notFound } from 'next/navigation'
import { ManualGameRegistrationForm } from '@/components/games/ManualGameRegistrationForm'
import { createServerSupabaseClient } from '@/lib/supabase'
import { createManualGame } from '@/app/actions/game-actions'

export default async function ManualGameRegisterPage() {
  const supabase = await createServerSupabaseClient()
  
  // 認証確認
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    notFound()
  }

  // 管理者権限確認
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">ゲーム手動登録</h1>
        <p className="text-muted-foreground">
          BGGにないゲーム（日本の同人ゲーム等）を手動で登録できます
        </p>
      </div>

      <ManualGameRegistrationForm 
        onSubmit={async (data) => {
          try {
            // 型差異を吸収（サーバー側の受け取りスキーマとUI側の型が異なるため）
            await createManualGame(data as any)
          } catch (error) {
            // エラーは ManualGameRegistrationForm 内で処理される
            console.error('Manual game creation failed:', error)
          }
        }}
      />
    </div>
  )
}

export const metadata = {
  title: 'ゲーム手動登録 | BGR Admin',
  description: 'BGGにないゲームを手動で登録'
}
