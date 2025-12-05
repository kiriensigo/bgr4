import { Suspense } from 'react'
import { Metadata } from 'next'
import { HomePageContent } from '@/components/home/HomePageContent'
import { WebsiteJsonLd } from '@/components/seo/JsonLd'

export const metadata: Metadata = {
  title: 'BGR - Board Game Review | ボードゲームレビューサイト',
  description:
    'ボードゲームのレビューと評価を集めるコミュニティ。詳細な評価指標やBGG連携で、あなたに合うボードゲームが見つかります。',
  keywords: [
    'ボードゲーム',
    'レビュー',
    'BGG',
    'Board Game Geek',
    'アナログゲーム',
    'テーブルゲーム',
    'ボドゲ',
  ],
  openGraph: {
    title: 'BGR - Board Game Review',
    description: 'ボードゲームのレビューと評価を集めるコミュニティサイト',
    type: 'website',
    locale: 'ja_JP',
    siteName: 'BGR - Board Game Review',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BGR - Board Game Review',
    description: 'ボードゲームのレビューと評価を集めるコミュニティサイト',
  },
  robots: {
    index: true,
    follow: true,
  },
}

function HomePageSkeleton() {
  return (
    <div className="min-h-screen">
      {/* Hero Skeleton */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="text-center space-y-6">
            <div className="h-16 bg-gray-200 rounded-lg max-w-2xl mx-auto animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded max-w-xl mx-auto animate-pulse"></div>
            <div className="h-12 bg-gray-200 rounded max-w-md mx-auto animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="container mx-auto px-4 py-16">
        <div className="space-y-16">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function URLCleaner() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            const url = new URL(window.location.href);
            const hasOAuthError = url.searchParams.has('error') || 
                                 url.searchParams.has('error_code') || 
                                 url.searchParams.has('error_description');
            
            if (hasOAuthError) {
              url.searchParams.delete('error');
              url.searchParams.delete('error_code');
              url.searchParams.delete('error_description');
              window.history.replaceState({}, '', url.pathname + url.search);
              window.location.href = '/login?error=oauth_failed';
            }
          })();
        `,
      }}
    />
  )
}

export default function HomePage() {
  return (
    <>
      <WebsiteJsonLd />
      <URLCleaner />
      <Suspense fallback={<HomePageSkeleton />}>
        <HomePageContent />
      </Suspense>
    </>
  )
}
