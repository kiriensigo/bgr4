import { RecentReviews } from './RecentReviews'
import { registerServices, getReviewUseCase } from '@/application/container'
import { PresentationAdapter } from '@/app/api/adapters/PresentationAdapter'

export default async function RecentReviewsServer() {
  try {
    await registerServices()
    const reviewUseCase = await getReviewUseCase()
    const reviews = await reviewUseCase.getRecentReviews(6)
    const transformed = reviews.map((r: any) => PresentationAdapter.reviewToResponse(r))
    return <RecentReviews reviews={transformed} />
  } catch (e) {
    console.warn('RecentReviewsServer failed, returning empty list')
    return <RecentReviews reviews={[]} />
  }
}
