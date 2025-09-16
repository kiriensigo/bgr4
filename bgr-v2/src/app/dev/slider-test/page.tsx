import { EnhancedReviewForm } from '@/components/reviews/EnhancedReviewForm'

export const dynamic = 'force-dynamic'

export default function SliderTestPage() {
  // Dev-only page to exercise sliders without auth
  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-2xl font-bold mb-6">Slider Test (Dev)</h1>
      <EnhancedReviewForm
        mode="create"
        gameId={30549}
        gameName="Pandemic"
      />
    </div>
  )
}

