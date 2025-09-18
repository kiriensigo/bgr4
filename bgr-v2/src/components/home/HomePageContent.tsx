import { Suspense } from 'react'
import { HeroSection } from './HeroSection'
import PopularGamesServer from './PopularGamesServer'
import RecentReviewsServer from './RecentReviewsServer'

export function HomePageContent() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <Suspense fallback={<section className="py-16"><div className="container mx-auto px-4"><div className="h-8 w-40 bg-gray-200 rounded mb-4 animate-pulse" /><div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{[...Array(8)].map((_,i)=>(<div key={i} className="h-72 bg-gray-100 rounded animate-pulse" />))}</div></div></section>}>
        {/* Streams after initial HTML to improve LCP */}
        <PopularGamesServer />
      </Suspense>
      <Suspense fallback={<section className="py-16 bg-gray-50"><div className="container mx-auto px-4"><div className="h-8 w-40 bg-gray-200 rounded mb-4 animate-pulse" /><div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{[...Array(6)].map((_,i)=>(<div key={i} className="h-52 bg-gray-100 rounded animate-pulse" />))}</div></div></section>}>
        <RecentReviewsServer />
      </Suspense>
    </div>
  )
}
