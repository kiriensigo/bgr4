import BGGRegistrationForm from '@/components/games/BGGRegistrationForm'

export default function BGGRegisterTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              BGG ゲーム登録テスト
            </h1>
            <p className="text-gray-600">
              BoardGameGeekからゲーム情報を取得して登録します
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <BGGRegistrationForm />
          </div>
        </div>
      </div>
    </div>
  )
}