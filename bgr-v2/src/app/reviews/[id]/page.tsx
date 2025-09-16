import { Suspense } from 'react'
import { Metadata } from 'next'
// import { notFound } from 'next/navigation'
import ReviewDetailContent from './ReviewDetailContent'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  
  try {
    const response = await fetch(`${process.env['NEXT_PUBLIC_APP_URL']}/api/reviews/${id}`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      return {
        title: 'レビューが見つかりません | BGR',
        description: '指定されたレビューは見つかりませんでした。'
      }
    }

    const result = await response.json()
    
    if (!result.success || !result.data) {
      return {
        title: 'レビューが見つかりません | BGR',
        description: '指定されたレビューは見つかりませんでした。'
      }
    }

    const review = result.data
    
    return {
      title: `${review.title} - ${review.games?.name || 'ゲーム'} | BGR`,
      description: review.content 
        ? `${review.content.substring(0, 150)}${review.content.length > 150 ? '...' : ''}`
        : `${review.games?.name || 'ゲーム'}のレビュー - ${review.title}`,
      openGraph: {
        title: `${review.title} - ${review.games?.name || 'ゲーム'}`,
        description: review.content?.substring(0, 200) || review.title,
        type: 'article',
        images: review.games?.imageUrl ? [{
          url: review.games.imageUrl,
          width: 500,
          height: 500,
          alt: review.games.name
        }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${review.title} - ${review.games?.name || 'ゲーム'}`,
        description: review.content?.substring(0, 200) || review.title,
      }
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'レビュー | BGR',
      description: 'ボードゲームレビューサイト BGR'
    }
  }
}

export default function ReviewDetailPage({ params }: PageProps) {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        </div>
      </div>
    }>
      <ReviewDetailContent params={params} />
    </Suspense>
  )
}

// interface DetailedReview {
//   id: string
//   title: string
//   content: string
//   rating: number
//   overallScore?: number
//   complexityScore?: number
//   luckScore?: number
//   interactionScore?: number
//   downtimeScore?: number
//   pros?: string[]
//   cons?: string[]
//   categories?: string[]
//   mechanics?: string[]
//   recommendedPlayerCounts?: number[]
//   isPublished: boolean
//   createdAt: string
//   updatedAt?: string
//   profiles: {
//     id: string
//     username: string
//     fullName?: string
//     avatarUrl?: string
//   }
//   games: {
//     id: number
//     name: string
//     nameJp?: string
//     imageUrl?: string
//     thumbnailUrl?: string
//   }
//   likesCount?: number
//   likes?: number
//   comments?: number
//   userHasLiked?: boolean
//   userHasBookmarked?: boolean
// }