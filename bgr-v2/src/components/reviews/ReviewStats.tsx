"use client";

import { cn } from "@/lib/utils";

interface ReviewStatsProps {
  stats: {
    overall?: number;
    complexity?: number;
    luck?: number;
    interaction?: number;
    downtime?: number;
    reviewCount?: number;
  };
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
}

const ReviewStats: React.FC<ReviewStatsProps> = ({
  stats,
  size = 'sm',
  showLabels = false,
  className
}) => {
  const { overall, complexity, luck, interaction, downtime, reviewCount = 0 } = stats;

  if (reviewCount === 0 || !overall) {
    return null;
  }

  const sizeClasses = {
    sm: {
      container: "text-xs",
      bar: "h-1",
      text: "text-xs",
      gap: "gap-1"
    },
    md: {
      container: "text-sm",
      bar: "h-2",
      text: "text-sm",
      gap: "gap-2"
    },
    lg: {
      container: "text-base",
      bar: "h-3",
      text: "text-base",
      gap: "gap-3"
    }
  };

  const classes = sizeClasses[size];

  const formatRating = (value: number | undefined, max: number) => {
    console.log('formatRating called with max:', max); // To avoid unused parameter error
    if (!value) return "0.0";
    return (value).toFixed(1);
  };

  const getBarWidth = (value: number | undefined, max: number) => {
    if (!value) return 0;
    return (value / max) * 100;
  };

  const getBarColor = (value: number | undefined, max: number, type: 'overall' | 'other') => {
    if (!value) return "bg-gray-300";
    
    if (type === 'overall') {
      // 5-10スケール: 7.5が中央値
      const normalized = (value - 5) / 5; // 0-1に正規化
      if (normalized < 0.3) return "bg-red-400";
      if (normalized < 0.5) return "bg-orange-400";
      if (normalized < 0.7) return "bg-yellow-400";
      return "bg-green-400";
    } else {
      // 1-5スケール: 3が中央値
      const normalized = value / max;
      if (normalized < 0.4) return "bg-red-400";
      if (normalized < 0.6) return "bg-orange-400";
      if (normalized < 0.8) return "bg-yellow-400";
      return "bg-green-400";
    }
  };

  if (showLabels) {
    return (
      <div className={cn("review-stats", classes.container, classes.gap, className)}>
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">レビュー統計</span>
          <span className="text-gray-500">({reviewCount}件)</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span>総合:</span>
            <div className="flex items-center gap-2 flex-1 max-w-20">
              <div className="bg-gray-200 rounded-full flex-1 overflow-hidden">
                <div 
                  className={cn("h-2 rounded-full transition-all", getBarColor(overall, 10, 'overall'))}
                  style={{ width: `${getBarWidth(overall, 10)}%` }}
                />
              </div>
              <span className="font-medium min-w-8 text-right">
                {formatRating(overall, 10)}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className="flex items-center gap-1">
              <span>複雑:</span>
              <span>{formatRating(complexity, 5)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>運:</span>
              <span>{formatRating(luck, 5)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>交流:</span>
              <span>{formatRating(interaction, 5)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>待機:</span>
              <span>{formatRating(downtime, 5)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // コンパクト表示（カード用）
  return (
    <div className={cn("review-stats-compact", classes.container, className)}>
      <div className="flex items-center gap-2 mb-1">
        <div className="flex items-center gap-1">
          <span className="text-yellow-500">⭐</span>
          <span className="font-semibold">{formatRating(overall, 10)}</span>
          <span className="text-gray-500 text-xs">({reviewCount})</span>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-1">
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">複雑</div>
          <div className="bg-gray-200 rounded-full overflow-hidden h-1">
            <div 
              className={cn("h-full rounded-full transition-all", getBarColor(complexity, 5, 'other'))}
              style={{ width: `${getBarWidth(complexity, 5)}%` }}
            />
          </div>
          <div className="text-xs font-medium mt-1">{formatRating(complexity, 5)}</div>
        </div>
        
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">運</div>
          <div className="bg-gray-200 rounded-full overflow-hidden h-1">
            <div 
              className={cn("h-full rounded-full transition-all", getBarColor(luck, 5, 'other'))}
              style={{ width: `${getBarWidth(luck, 5)}%` }}
            />
          </div>
          <div className="text-xs font-medium mt-1">{formatRating(luck, 5)}</div>
        </div>
        
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">交流</div>
          <div className="bg-gray-200 rounded-full overflow-hidden h-1">
            <div 
              className={cn("h-full rounded-full transition-all", getBarColor(interaction, 5, 'other'))}
              style={{ width: `${getBarWidth(interaction, 5)}%` }}
            />
          </div>
          <div className="text-xs font-medium mt-1">{formatRating(interaction, 5)}</div>
        </div>
        
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">待機</div>
          <div className="bg-gray-200 rounded-full overflow-hidden h-1">
            <div 
              className={cn("h-full rounded-full transition-all", getBarColor(downtime, 5, 'other'))}
              style={{ width: `${getBarWidth(downtime, 5)}%` }}
            />
          </div>
          <div className="text-xs font-medium mt-1">{formatRating(downtime, 5)}</div>
        </div>
      </div>
    </div>
  );
};

export default ReviewStats;