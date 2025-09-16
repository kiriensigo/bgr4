import { Metadata } from 'next'
import GameRegistrationForm from '@/components/games/GameRegistrationForm'

export const metadata: Metadata = {
  title: 'ゲーム登録 - BGR',
  description: '新しいボードゲームを登録してレビューを始めよう',
}

export default async function GameRegisterPage() {
  // 一時的に認証チェックを無効化（モックアップテスト用）
  const mockUser = {
    id: 'mock-user',
    email: 'mock@example.com',
    is_admin: true,
    reviews_count: 5,
    username: 'MockUser',
    full_name: 'Mock User',
    avatar_url: null,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              ゲーム登録
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              新しいボードゲームをデータベースに追加しましょう。
              BGGから自動取得するか、手動で詳細情報を入力できます。
            </p>
          </div>

          {/* 権限バッジ */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              {mockUser.is_admin ? (
                <>
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  管理者権限
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  経験者権限 ({mockUser.reviews_count || 0}件のレビュー投稿済み)
                </>
              )}
            </div>
          </div>

          {/* 登録フォーム */}
          <GameRegistrationForm />

          {/* 注意事項 */}
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="font-medium text-yellow-800 mb-2">
              ⚠️ 登録時の注意事項
            </h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 既に登録済みのゲームは重複登録できません</li>
              <li>• BGGに登録されているゲームは、できるだけBGG連携での登録をお願いします</li>
              <li>• 手動登録は主に日本語ゲームなど、BGGに未登録のゲーム用です</li>
              <li>• 不適切な内容や虚偽の情報は削除される場合があります</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}