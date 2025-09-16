'use client'

interface StatisticBarProps {
  percentage: number
  priority: 'highlight' | 'normal' | 'hidden'
  animated?: boolean
  height?: 'sm' | 'md' | 'lg'
  showPercentage?: boolean
}

export default function StatisticBar({
  percentage,
  priority,
  animated = false,
  height = 'md',
  showPercentage = false
}: StatisticBarProps) {
  const isHighlight = priority === 'highlight'
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100)
  
  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4'
  }
  
  const getBarColor = () => {
    if (isHighlight) {
      return 'bg-gradient-to-r from-blue-500 to-blue-600'
    }
    return 'bg-gray-400'
  }
  
  const getBackgroundColor = () => {
    if (isHighlight) {
      return 'bg-blue-100'
    }
    return 'bg-gray-200'
  }
  
  return (
    <div className="relative">
      {/* プログレスバーベース */}
      <div className={`
        w-full rounded-full overflow-hidden
        ${heightClasses[height]}
        ${getBackgroundColor()}
        ${isHighlight ? 'shadow-inner' : ''}
      `}>
        {/* プログレスバー本体 */}
        <div 
          className={`
            h-full rounded-full transition-all duration-700 ease-out
            ${getBarColor()}
            ${isHighlight ? 'shadow-sm' : ''}
            ${animated ? 'animate-pulse' : ''}
          `}
          style={{ 
            width: `${clampedPercentage}%`,
            transition: animated ? 'width 1s ease-out' : 'width 0.3s ease-out'
          }}
        >
          {/* ハイライト時のグロー効果 */}
          {isHighlight && (
            <div className="h-full w-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
          )}
        </div>
      </div>
      
      {/* パーセンテージ表示 */}
      {showPercentage && (
        <div className={`
          absolute right-0 top-0 -mt-6 text-xs font-semibold
          ${isHighlight ? 'text-blue-700' : 'text-gray-600'}
        `}>
          {clampedPercentage.toFixed(1)}%
        </div>
      )}
      
      {/* 70%ライン */}
      {clampedPercentage >= 70 && (
        <div 
          className="absolute top-0 h-full w-0.5 bg-blue-800 opacity-50"
          style={{ left: '70%' }}
          title="70%ライン - ハイライト表示基準"
        />
      )}
      
      {/* 30%ライン */}
      {clampedPercentage >= 30 && clampedPercentage < 70 && (
        <div 
          className="absolute top-0 h-full w-0.5 bg-gray-600 opacity-50"
          style={{ left: '30%' }}
          title="30%ライン - 表示基準"
        />
      )}
    </div>
  )
}