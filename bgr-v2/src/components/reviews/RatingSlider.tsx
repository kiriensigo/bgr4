"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

interface RatingSliderProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  icon?: React.ReactNode;
  color?: 'primary' | 'success' | 'warning';
  className?: string;
}

const RatingSlider: React.FC<RatingSliderProps> = ({
  label,
  min,
  max,
  step,
  value,
  onChange,
  icon,
  color = 'primary',
  className
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const percentage = ((value - min) / (max - min)) * 100;

  // 位置から値を計算
  const calculateValueFromPosition = useCallback((clientX: number) => {
    if (!sliderRef.current) return value;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const rawValue = min + (max - min) * percentage;
    return Math.round(rawValue / step) * step;
  }, [min, max, step, value]);

  // マウスムーブハンドラー
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const newValue = calculateValueFromPosition(e.clientX);
    onChange(newValue);
  }, [isDragging, calculateValueFromPosition, onChange]);

  // マウスアップハンドラー
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = 'default';
  }, []);

  // タッチムーブハンドラー
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;
    const newValue = calculateValueFromPosition(touch.clientX);
    onChange(newValue);
  }, [isDragging, calculateValueFromPosition, onChange]);

  // タッチエンドハンドラー
  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // ドラッグ中のイベントリスナー管理
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
    return () => {}; // eslint-disable-line @typescript-eslint/no-empty-function
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // ドラッグ開始（マウス）
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    document.body.style.cursor = 'grabbing';
    const newValue = calculateValueFromPosition(e.clientX);
    onChange(newValue);
  };

  // ドラッグ開始（タッチ）
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const touch = e.touches[0];
    if (!touch) return;
    const newValue = calculateValueFromPosition(touch.clientX);
    onChange(newValue);
  };

  const colorClasses = {
    primary: {
      track: 'bg-blue-100',
      fill: 'bg-blue-500',
      thumb: 'bg-blue-500 border-blue-600 shadow-blue-200',
      text: 'text-blue-600'
    },
    success: {
      track: 'bg-green-100',
      fill: 'bg-green-500',
      thumb: 'bg-green-500 border-green-600 shadow-green-200',
      text: 'text-green-600'
    },
    warning: {
      track: 'bg-orange-100',
      fill: 'bg-orange-500',
      thumb: 'bg-orange-500 border-orange-600 shadow-orange-200',
      text: 'text-orange-600'
    }
  };

  const colors = colorClasses[color];

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    onChange(newValue);
  };

  return (
    <div className={cn("slider-container mb-8", className)}>
      {/* ラベル・値表示 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon && <span className="text-lg">{icon}</span>}
          <label className="font-semibold text-gray-700 text-sm">
            {label}
          </label>
        </div>
        <div className={cn(
          "font-bold text-lg min-w-[60px] text-center",
          colors.text
        )}>
          {value.toFixed(step < 1 ? 1 : 0)}
        </div>
      </div>

      {/* スライダー */}
      <div 
        ref={sliderRef}
        className="relative"
        style={{ userSelect: 'none' }}
      >
        {/* トラック背景 */}
        <div className={cn(
          "h-3 rounded-full relative overflow-hidden",
          colors.track
        )}>
          {/* 塗りつぶし部分 */}
          <div 
            className={cn(
              "h-full rounded-full transition-all duration-200",
              colors.fill
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* ドラッグ可能な透明エリア */}
        <div
          className="absolute inset-0 w-full h-full cursor-pointer z-10"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        />
        
        {/* カスタムサム（ドラッグハンドル） */}
        <div 
          className={cn(
            "absolute top-1/2 w-6 h-6 -mt-3 -ml-3 rounded-full border-2",
            "transition-all duration-200 z-20 cursor-grab active:cursor-grabbing",
            colors.thumb,
            isDragging ? "scale-110 shadow-lg" : "shadow-md"
          )}
          style={{ left: `${percentage}%` }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        />
        
        {/* 隠されたHTML input range（値同期用） */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSliderChange}
          className="sr-only"
          tabIndex={-1}
        />

      </div>

      {/* 目盛り表示 */}
      <div className="flex justify-between mt-2 px-1">
        <span className="text-xs text-gray-500 font-medium">{min}</span>
        {max > min + 2 && (
          <span className="text-xs text-gray-500 font-medium">
            {((min + max) / 2).toFixed(step < 1 ? 1 : 0)}
          </span>
        )}
        <span className="text-xs text-gray-500 font-medium">{max}</span>
      </div>

      {/* 説明テキスト（総合得点用） */}
      {label === "総合得点" && (
        <div className="flex mt-1 px-1 relative">
          <span className="text-xs text-gray-400 absolute left-0">がっかり</span>
          <span className="text-xs text-gray-400 absolute left-1/2 transform -translate-x-1/2">普通</span>
          <span className="text-xs text-gray-400 absolute right-0">傑作</span>
        </div>
      )}

      {/* 説明テキスト（複雑さ用） */}
      {label.includes("複雑さ") && (
        <div className="flex justify-between mt-1 px-1">
          <span className="text-xs text-gray-400">簡単</span>
          <span className="text-xs text-gray-400">普通</span>
          <span className="text-xs text-gray-400">複雑</span>
        </div>
      )}
    </div>
  );
};

export default RatingSlider;