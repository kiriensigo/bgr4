'use client'

interface StatisticItemProps {
  name: string
  percentage: number
  reviewCount: number
  bggWeight: number
  priority: 'highlight' | 'normal' | 'hidden'
  showDetails?: boolean
}

export default function StatisticItem({
  name,
  percentage,
  reviewCount,
  bggWeight,
  priority,
  showDetails = false
}: StatisticItemProps) {
  const isHighlight = priority === 'highlight'
  
  return (
    <div 
      className={`
        inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
        ${isHighlight 
          ? 'bg-blue-500 text-white shadow-md hover:bg-blue-600' 
          : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
        }
      `}
    >
      {name}
    </div>
  )
}