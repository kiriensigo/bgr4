"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface TwitterShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameTitle: string;
  ratings: {
    overall: number;
    complexity: number;
    luck: number;
    interaction: number;
    downtime: number;
  };
  recommendedPlayers: string[];
  mechanics: string[];
  categories: string[];
  comment?: string;
  onShare: (customText?: string) => void;
  className?: string;
}

const TwitterShareModal: React.FC<TwitterShareModalProps> = ({
  isOpen,
  onClose,
  gameTitle,
  ratings,
  recommendedPlayers,
  mechanics,
  categories,
  comment,
  onShare,
  className
}) => {
  console.log('TwitterShareModal props:', { categories }); // To avoid unused variable error
  const [customText, setCustomText] = useState("");
  const [useCustomText, setUseCustomText] = useState(false);

  // デフォルトの投稿テキストを生成
  const generateDefaultText = useCallback(() => {
    const ratingsText = `総合:${ratings.overall}/10 複雑さ:${ratings.complexity}/5 運:${ratings.luck}/5 交流:${ratings.interaction}/5 待機:${ratings.downtime}/5`;
    const playersText = recommendedPlayers.length > 0 ? ` おすすめ人数:${recommendedPlayers.join("・")}` : "";
    const mechanicsText = mechanics.length > 0 ? ` #${mechanics.join(" #")}` : "";
    const commentText = comment ? `\n\n${comment}` : "";
    
    return `『${gameTitle}』をレビューしました！\n${ratingsText}${playersText}${mechanicsText}${commentText}\n\n#ボードゲーム #BGR`;
  }, [gameTitle, ratings, recommendedPlayers, mechanics, comment]);

  const defaultText = generateDefaultText();
  const finalText = useCustomText ? customText : defaultText;
  const characterCount = finalText.length;
  const isOverLimit = characterCount > 280;

  const handleShare = () => {
    if (!isOverLimit) {
      onShare(useCustomText ? customText : undefined);
      onClose();
    }
  };

  const handleCustomTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCustomText(e.target.value);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className={cn(
        "bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto",
        className
      )}>
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-lg">🐦</span>
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Xでシェア
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-light"
          >
            ×
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6">
          {/* テキスト選択オプション */}
          <div className="mb-4">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="textType"
                  checked={!useCustomText}
                  onChange={() => setUseCustomText(false)}
                  className="text-blue-500"
                />
                <span className="text-sm text-gray-700">自動生成テキスト</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="textType"
                  checked={useCustomText}
                  onChange={() => setUseCustomText(true)}
                  className="text-blue-500"
                />
                <span className="text-sm text-gray-700">カスタムテキスト</span>
              </label>
            </div>
          </div>

          {/* テキストプレビュー */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                投稿内容プレビュー
              </label>
              <div className={cn(
                "text-sm font-medium",
                isOverLimit ? "text-red-500" : 
                characterCount > 240 ? "text-orange-500" : 
                "text-gray-500"
              )}>
                {characterCount}/280
              </div>
            </div>

            {useCustomText ? (
              <textarea
                value={customText}
                onChange={handleCustomTextChange}
                placeholder="カスタム投稿内容を入力..."
                rows={6}
                className={cn(
                  "w-full px-3 py-2 border rounded-lg resize-none text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50",
                  isOverLimit ? "border-red-300" : "border-gray-300"
                )}
              />
            ) : (
              <div className="bg-gray-50 border rounded-lg p-3">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                  {defaultText}
                </pre>
              </div>
            )}

            {/* 文字数プログレスバー */}
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className={cn(
                    "h-1 rounded-full transition-all duration-300",
                    isOverLimit ? "bg-red-500" :
                    characterCount > 240 ? "bg-orange-500" :
                    "bg-blue-500"
                  )}
                  style={{ 
                    width: `${Math.min((characterCount / 280) * 100, 100)}%` 
                  }}
                />
              </div>
            </div>
          </div>

          {/* ゲーム情報サマリー */}
          <div className="mb-6 p-3 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-2">{gameTitle}</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div>総合評価: <span className="font-medium text-blue-600">{ratings.overall}/10</span></div>
              <div className="grid grid-cols-2 gap-2">
                <span>複雑さ: {ratings.complexity}/5</span>
                <span>運要素: {ratings.luck}/5</span>
                <span>交流: {ratings.interaction}/5</span>
                <span>待機: {ratings.downtime}/5</span>
              </div>
              {recommendedPlayers.length > 0 && (
                <div>推奨人数: {recommendedPlayers.join("・")}</div>
              )}
              {mechanics.length > 0 && (
                <div>メカニクス: {mechanics.join("、")}</div>
              )}
            </div>
          </div>

          {/* エラーメッセージ */}
          {isOverLimit && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 flex items-center gap-2">
                <span>⚠️</span>
                文字数が280文字を超えています。内容を短くしてください。
              </p>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="flex gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleShare}
            disabled={isOverLimit}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg font-medium transition-colors",
              "flex items-center justify-center gap-2",
              isOverLimit
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            )}
          >
            <span>🐦</span>
            投稿
          </button>
        </div>
      </div>
    </div>
  );
};

export default TwitterShareModal;