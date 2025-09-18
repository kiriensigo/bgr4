"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import RatingSlider from "./RatingSlider";
import ButtonGroup from "./ButtonGroup";
import CommentInput from "./CommentInput";
import TwitterShareModal from "./TwitterShareModal";
import { cn } from "@/lib/utils";

interface Game {
  id: number;
  name: string;
  imageUrl?: string;
  yearPublished?: number;
  minPlayers?: number;
  maxPlayers?: number;
  categories?: string[];
  mechanics?: string[];
}

interface ReviewFormClientProps {
  game: Game;
  className?: string;
}

interface ReviewData {
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
  comment: string;
}

const ReviewFormClient: React.FC<ReviewFormClientProps> = ({
  game,
  className
}) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTwitterModal, setShowTwitterModal] = useState(false);
  
  // Form state
  const [reviewData, setReviewData] = useState<ReviewData>({
    ratings: {
      overall: 7.5,
      complexity: 3,
      luck: 3,
      interaction: 3,
      downtime: 3
    },
    recommendedPlayers: [],
    mechanics: [],
    categories: [],
    comment: ""
  });

  // Options for button groups
  const playerOptions = [
    { value: "1", label: "1人", description: "ソロプレイ" },
    { value: "2", label: "2人", description: "ペア" },
    { value: "3", label: "3人" },
    { value: "4", label: "4人" },
    { value: "5", label: "5人" },
    { value: "6+", label: "6人以上", description: "大人数" }
  ];

  // メカニクス（手動登録フォームと統一）
  const mechanicsOptions = [
    { value: "エリア支配", label: "エリア支配" },
    { value: "オークション", label: "オークション" },
    { value: "賭け", label: "賭け" },
    { value: "協力", label: "協力" },
    { value: "デッキ/バッグビルド", label: "デッキ/バッグビルド" },
    { value: "ダイスロール", label: "ダイスロール" },
    { value: "ドラフト", label: "ドラフト" },
    { value: "エンジンビルド", label: "エンジンビルド" },
    { value: "正体隠匿", label: "正体隠匿" },
    { value: "モジュラーボード", label: "モジュラーボード" },
    { value: "ルート構築", label: "ルート構築" },
    { value: "バースト", label: "バースト" },
    { value: "セット収集", label: "セット収集" },
    { value: "同時手番", label: "同時手番" },
    { value: "タイル配置", label: "タイル配置" },
    { value: "プレイヤー別能力", label: "プレイヤー別能力" }
  ];

  // カテゴリー（手動登録フォームと統一）
  const categoryOptions = [
    { value: "演技", label: "演技" },
    { value: "動物", label: "動物" },
    { value: "ブラフ", label: "ブラフ" },
    { value: "カードゲーム", label: "カードゲーム" },
    { value: "子供向け", label: "子供向け" },
    { value: "推理", label: "推理" },
    { value: "レガシー・キャンペーン", label: "レガシー・キャンペーン" },
    { value: "記憶", label: "記憶" },
    { value: "交渉", label: "交渉" },
    { value: "紙ペン", label: "紙ペン" },
    { value: "パーティー", label: "パーティー" },
    { value: "パズル", label: "パズル" },
    { value: "ソロ向き", label: "ソロ向き" },
    { value: "ペア向き", label: "ペア向き" },
    { value: "多人数向き", label: "多人数向き" },
    { value: "トリテ", label: "トリテ" },
    { value: "ウォーゲーム", label: "ウォーゲーム" },
    { value: "ワードゲーム", label: "ワードゲーム" }
  ];

  // Event handlers
  const handleRatingChange = useCallback((key: keyof ReviewData['ratings']) => (value: number) => {
    setReviewData(prev => ({
      ...prev,
      ratings: {
        ...prev.ratings,
        [key]: value
      }
    }));
  }, []);

  const handlePlayersChange = useCallback((values: string[]) => {
    setReviewData(prev => ({
      ...prev,
      recommendedPlayers: values
    }));
  }, []);

  const handleMechanicsChange = useCallback((values: string[]) => {
    setReviewData(prev => ({
      ...prev,
      mechanics: values
    }));
  }, []);

  const handleCategoriesChange = useCallback((values: string[]) => {
    setReviewData(prev => ({
      ...prev,
      categories: values
    }));
  }, []);

  const handleCommentChange = useCallback((value: string) => {
    setReviewData(prev => ({
      ...prev,
      comment: value
    }));
  }, []);

  // Form validation
  const isFormValid = () => {
    return reviewData.ratings.overall >= 5 && reviewData.ratings.overall <= 10;
  };

  // Submit handlers
  const handleSubmit = async () => {
    if (!isFormValid()) return;
    
    setIsSubmitting(true);
    
    try {
      // Submit review to API
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: game.id,
          ...reviewData
        })
      });

      if (response.ok) {
        setShowTwitterModal(true);
      } else {
        // 409: 既存レビューへ遷移
        if (response.status === 409) {
          const err = await response.json().catch(() => ({} as any))
          const existingId = err.existingReviewId || err?.details?.existingReviewId
          const path = err.path || (existingId ? `/reviews/${existingId}` : null)
          if (path) {
            router.push(path)
            return
          }
        }
        throw new Error('Failed to submit review');
      }
    } catch (error) {
      console.error('Review submission error:', error);
      alert('レビューの投稿に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTwitterShare = (customText?: string) => {
    const text = customText || generateTwitterText();
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'width=550,height=420');
    
    // Redirect to game page after sharing
    router.push(`/games/${game.id}`);
  };

  const handleSkipShare = () => {
    setShowTwitterModal(false);
    router.push(`/games/${game.id}`);
  };

  const generateTwitterText = () => {
    const ratingsText = `総合:${reviewData.ratings.overall}/10 複雑さ:${reviewData.ratings.complexity}/5 運:${reviewData.ratings.luck}/5 交流:${reviewData.ratings.interaction}/5 待機:${reviewData.ratings.downtime}/5`;
    const playersText = reviewData.recommendedPlayers.length > 0 ? ` おすすめ人数:${reviewData.recommendedPlayers.join("・")}` : "";
    const mechanicsText = reviewData.mechanics.length > 0 ? ` #${reviewData.mechanics.join(" #")}` : "";
    const commentText = reviewData.comment ? `\n\n${reviewData.comment}` : "";
    
    return `『${game.name}』をレビューしました！\n${ratingsText}${playersText}${mechanicsText}${commentText}\n\n#ボードゲーム #BGR`;
  };

  return (
    <>
      <div className={cn("bg-white rounded-lg shadow-sm p-8", className)}>
        <div className="space-y-12">
          {/* Progress indicator */}
          <div className="flex items-center justify-between text-sm text-gray-500 mb-8">
            <span>レビュー投稿フォーム</span>
            <span>約2分で完了</span>
          </div>

          {/* Rating sliders */}
          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-6">
              📊 評価スライダー
            </h2>
            
            <RatingSlider
              label="総合得点"
              min={5}
              max={10}
              step={0.5}
              value={reviewData.ratings.overall}
              onChange={handleRatingChange('overall')}
              icon="⭐"
              color="primary"
            />

            <RatingSlider
              label="ルールの複雑さ"
              min={1}
              max={5}
              step={1}
              value={reviewData.ratings.complexity}
              onChange={handleRatingChange('complexity')}
              icon="📚"
              color="warning"
            />

            <RatingSlider
              label="運要素"
              min={1}
              max={5}
              step={1}
              value={reviewData.ratings.luck}
              onChange={handleRatingChange('luck')}
              icon="🎲"
              color="success"
            />

            <RatingSlider
              label="プレイヤー間の交流（インタラクション）"
              min={1}
              max={5}
              step={1}
              value={reviewData.ratings.interaction}
              onChange={handleRatingChange('interaction')}
              icon="👥"
              color="primary"
            />

            <RatingSlider
              label="待機時間・ダウンタイム"
              min={1}
              max={5}
              step={1}
              value={reviewData.ratings.downtime}
              onChange={handleRatingChange('downtime')}
              icon="⏱️"
              color="warning"
            />
          </section>

          {/* Button groups */}
          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-6">
              🎯 おすすめ設定
            </h2>

            <ButtonGroup
              label="おすすめプレイ人数"
              options={playerOptions}
              selectedValues={reviewData.recommendedPlayers}
              onChange={handlePlayersChange}
              icon="👥"
              color="primary"
            />

            <ButtonGroup
              label="メカニクス"
              options={mechanicsOptions}
              selectedValues={reviewData.mechanics}
              onChange={handleMechanicsChange}
              icon="🏷️"
              color="success"
            />

            <ButtonGroup
              label="カテゴリー"
              options={categoryOptions}
              selectedValues={reviewData.categories}
              onChange={handleCategoriesChange}
              icon="📁"
              color="warning"
            />
          </section>

          {/* Comment */}
          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-6">
              💭 コメント
            </h2>

            <CommentInput
              label="感想・コメント"
              value={reviewData.comment}
              onChange={handleCommentChange}
              maxLength={150}
              icon="✍️"
            />
          </section>

          {/* Submit button */}
          <section className="border-t pt-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                戻る
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isFormValid() || isSubmitting}
                className={cn(
                  "flex-1 px-6 py-3 rounded-lg font-medium transition-colors",
                  "flex items-center justify-center gap-2",
                  isFormValid() && !isSubmitting
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                )}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    投稿中...
                  </>
                ) : (
                  <>
                    📝 レビューを投稿
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Twitter share modal */}
      <TwitterShareModal
        isOpen={showTwitterModal}
        onClose={handleSkipShare}
        gameTitle={game.name}
        ratings={reviewData.ratings}
        recommendedPlayers={reviewData.recommendedPlayers}
        mechanics={reviewData.mechanics}
        categories={reviewData.categories}
        comment={reviewData.comment}
        onShare={handleTwitterShare}
      />
    </>
  );
};

export default ReviewFormClient;
