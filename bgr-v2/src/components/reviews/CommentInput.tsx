"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface CommentInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  icon?: React.ReactNode;
  required?: boolean;
  className?: string;
}

const CommentInput: React.FC<CommentInputProps> = ({
  label,
  value,
  onChange,
  placeholder = "このゲームの感想を自由に書いてください...",
  maxLength = 150,
  icon,
  required = false,
  className
}) => {
  const [isFocused, setIsFocused] = useState(false);
  
  const characterCount = value.length;
  const isNearLimit = characterCount > maxLength * 0.8;
  const isOverLimit = characterCount > maxLength;

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    // 文字数制限を超える場合は制限する
    if (newValue.length <= maxLength) {
      onChange(newValue);
    }
  }, [onChange, maxLength]);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  return (
    <div className={cn("comment-input-container mb-8", className)}>
      {/* ラベル・文字数表示 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon && <span className="text-lg">{icon}</span>}
          <label className="font-semibold text-gray-700 text-sm">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        </div>
        <div className={cn(
          "text-sm font-medium transition-colors",
          isOverLimit ? "text-red-500" : 
          isNearLimit ? "text-orange-500" : 
          "text-gray-500"
        )}>
          {characterCount}/{maxLength}
        </div>
      </div>

      {/* テキストエリア */}
      <div className="relative">
        <textarea
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          rows={4}
          className={cn(
            "w-full px-4 py-3 border-2 rounded-lg resize-none",
            "transition-all duration-200",
            "text-sm leading-relaxed",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50",
            // Border colors
            isFocused ? "border-blue-500" :
            isOverLimit ? "border-red-300" :
            value ? "border-gray-400" : "border-gray-300",
            // Background colors
            isFocused ? "bg-blue-50/30" : "bg-white",
            // Placeholder
            "placeholder:text-gray-400"
          )}
        />

        {/* 文字数プログレスバー */}
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                isOverLimit ? "bg-red-500" :
                isNearLimit ? "bg-orange-500" :
                "bg-blue-500"
              )}
              style={{ 
                width: `${Math.min((characterCount / maxLength) * 100, 100)}%` 
              }}
            />
          </div>
        </div>
      </div>

      {/* ヘルプテキスト・エラーメッセージ */}
      <div className="mt-2">
        {isOverLimit ? (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <span>⚠️</span>
            文字数が上限を超えています
          </p>
        ) : isNearLimit ? (
          <p className="text-xs text-orange-500">
            文字数が上限に近づいています
          </p>
        ) : (
          <p className="text-xs text-gray-500">
            {required ? "必須項目です" : "任意項目です"}・Xシェア時にも表示されます
          </p>
        )}
      </div>

      {/* ショートカットヒント */}
      {isFocused && (
        <div className="mt-2 p-2 bg-gray-50 rounded border text-xs text-gray-600">
          💡 ヒント: ゲームの良かった点、改善点、どんな人におすすめかなどを書くと参考になります
        </div>
      )}
    </div>
  );
};

export default CommentInput;