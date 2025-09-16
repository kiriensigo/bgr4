import ReviewBasedSearchForm from '@/components/search/ReviewBasedSearchForm'

export default function SearchMockPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto">
        <div className="py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              レビューベース検索（モックアップ）
            </h1>
            <p className="text-gray-600">
              5軸評価とプレイ特性で、あなたにぴったりのボードゲームを見つけよう
            </p>
          </div>
          
          <ReviewBasedSearchForm />
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'レビューベース検索（モック） | BGR',
  description: '5軸評価（総合得点、ルール難度、運要素、相互作用、ダウンタイム）とプレイ特性でボードゲームを検索（モックアップ版）',
}