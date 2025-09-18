'use client'

import dynamic from 'next/dynamic'

const GameStatsComponentLazy = dynamic(() => import('./GameStatsComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full">
      <div className="h-8 w-40 bg-gray-200 rounded mb-4 animate-pulse" />
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-full bg-gray-200 animate-pulse" />
        ))}
      </div>
    </div>
  ),
})

export default function GameStatsClient({ gameId }: { gameId: number }) {
  return <GameStatsComponentLazy gameId={gameId} />
}

