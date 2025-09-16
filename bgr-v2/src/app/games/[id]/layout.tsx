import { Suspense } from 'react'

interface GameLayoutProps {
  children: React.ReactNode
  details: React.ReactNode
  reviews: React.ReactNode
  params: Promise<{ id: string }>
}

export default function GameLayout({ 
  children, 
  details, 
  reviews, 
  params: _ 
}: GameLayoutProps) {
  // Params are used by Next.js routing internally
  return (
    <div className="min-h-screen bg-gray-50">
      {/* メインコンテンツ */}
      <div className="container mx-auto px-4 pt-4 pb-0">
        {children}
        
        {/* 段階的読み込みセクション */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-0">
          {/* ゲーム詳細 (左側 2/3) */}
          <div className="lg:col-span-2">
            <Suspense fallback={
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                  </div>
                </div>
              </div>
            }>
              {details}
            </Suspense>
          </div>

          {/* レビュー一覧 (右側 1/3) */}
          <div>
            <Suspense fallback={
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="p-3 border rounded">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            }>
              {reviews}
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
