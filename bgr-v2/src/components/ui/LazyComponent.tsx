import { lazy, Suspense } from 'react'

// 重いコンポーネントの遅延読み込み用のファクトリー
export function withLazyLoading<P extends object>(
  importFn: () => Promise<{ default: React.ComponentType<P> }>,
  fallback: React.ReactNode = <div className="animate-pulse bg-gray-200 h-32 rounded" />
) {
  const LazyComponent = lazy(importFn)
  
  return function LazyWrapper(props: P) {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    )
  }
}

// 一般的なローディングUI
export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  )
}

export function CardSkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <LoadingSkeleton className="h-4 w-3/4" />
      <LoadingSkeleton className="h-4 w-1/2" />
      <LoadingSkeleton className="h-32 w-full" />
      <LoadingSkeleton className="h-4 w-1/4" />
    </div>
  )
}

export function GameCardSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <LoadingSkeleton className="h-48 w-full" />
      <LoadingSkeleton className="h-6 w-3/4" />
      <LoadingSkeleton className="h-4 w-1/2" />
      <div className="flex space-x-2">
        <LoadingSkeleton className="h-4 w-16" />
        <LoadingSkeleton className="h-4 w-16" />
      </div>
    </div>
  )
}