"use client";

// import { useState } from "react";
import { cn } from "@/lib/utils";

interface ButtonGroupProps {
  label: string;
  options: Array<{
    value: string;
    label: string;
    description?: string;
  }>;
  selectedValues: string[];
  onChange: (values: string[]) => void;
  maxSelections?: number;
  multiSelect?: boolean;
  icon?: React.ReactNode;
  color?: 'primary' | 'success' | 'warning';
  className?: string;
}

const ButtonGroup: React.FC<ButtonGroupProps> = ({
  label,
  options,
  selectedValues,
  onChange,
  maxSelections,
  multiSelect = true,
  icon,
  color = 'primary',
  className
}) => {
  const colorClasses = {
    primary: {
      selected: 'bg-blue-500 border-blue-600 text-white shadow-md',
      unselected: 'bg-white border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-400',
      text: 'text-blue-600'
    },
    success: {
      selected: 'bg-green-500 border-green-600 text-white shadow-md',
      unselected: 'bg-white border-gray-300 text-gray-700 hover:bg-green-50 hover:border-green-400',
      text: 'text-green-600'
    },
    warning: {
      selected: 'bg-orange-500 border-orange-600 text-white shadow-md',
      unselected: 'bg-white border-gray-300 text-gray-700 hover:bg-orange-50 hover:border-orange-400',
      text: 'text-orange-600'
    }
  };

  const colors = colorClasses[color];

  const handleOptionClick = (value: string) => {
    if (!multiSelect) {
      // Single selection mode
      onChange(selectedValues.includes(value) ? [] : [value]);
      return;
    }

    // Multi-selection mode
    if (selectedValues.includes(value)) {
      // Remove if already selected
      onChange(selectedValues.filter(v => v !== value));
    } else {
      // Add if not selected and within max limit
      if (!maxSelections || selectedValues.length < maxSelections) {
        onChange([...selectedValues, value]);
      }
    }
  };

  const isSelected = (value: string) => selectedValues.includes(value);
  const isMaxReached = maxSelections && selectedValues.length >= maxSelections;

  return (
    <div className={cn("button-group-container mb-8", className)}>
      {/* ラベル表示 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon && <span className="text-lg">{icon}</span>}
          <label className="font-semibold text-gray-700 text-sm">
            {label}
          </label>
        </div>
        {multiSelect && maxSelections && (
          <div className={cn(
            "text-sm font-medium",
            colors.text
          )}>
            {selectedValues.length}/{maxSelections}
          </div>
        )}
      </div>

      {/* 選択済み表示（多選択時） */}
      {multiSelect && selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedValues.map((value) => {
            const option = options.find(opt => opt.value === value);
            return (
              <div
                key={value}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1",
                  colors.selected
                )}
              >
                <span>{option?.label}</span>
                <button
                  onClick={() => handleOptionClick(value)}
                  className="ml-1 hover:bg-black/10 rounded-full w-4 h-4 flex items-center justify-center"
                  aria-label={`${option?.label}を削除`}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ボタン一覧 */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
        {options.map((option) => {
          const selected = isSelected(option.value);
          const disabled = Boolean(!selected && isMaxReached);
          
          return (
            <button
              key={option.value}
              onClick={() => handleOptionClick(option.value)}
              disabled={disabled}
              className={cn(
                "px-3 py-2 rounded-md border transition-all duration-200",
                "font-medium text-xs text-center leading-tight",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "min-h-[2.5rem] flex items-center justify-center",
                selected ? colors.selected : colors.unselected
              )}
              title={option.description}
            >
              <span className="truncate">{option.label}</span>
            </button>
          );
        })}
      </div>

      {/* ヘルプテキスト */}
      <div className="mt-3">
        {multiSelect ? (
          <p className="text-xs text-gray-500">
            {maxSelections 
              ? `最大${maxSelections}個まで選択できます` 
              : "複数選択できます"
            }
          </p>
        ) : (
          <p className="text-xs text-gray-500">
            1つ選択してください
          </p>
        )}
      </div>
    </div>
  );
};

export default ButtonGroup;