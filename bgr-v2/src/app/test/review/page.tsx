import { Suspense } from "react";
import ReviewFormClient from "@/components/reviews/ReviewFormClient";

// Mock game data for testing - Gloomhaven with time range
const mockGame = {
  id: 1,
  name: "グルームヘイヴン",
  imageUrl: "/placeholder-game.jpg",
  yearPublished: 2017,
  minPlayers: 1,
  maxPlayers: 4,
  playing_time: 120,
  min_playing_time: 60,
  max_playing_time: 120,
  categories: ["アドベンチャー", "ファンタジー"],
  mechanics: ["協力", "RPG要素", "カードドリブン"]
};

export default function TestReviewPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
              <div className="w-full h-full flex items-center justify-center text-gray-500 text-2xl">
                🎲
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                レビューフォーム テスト
              </h1>
              <p className="text-gray-600 text-sm">
                {mockGame.yearPublished}年・{mockGame.minPlayers}-{mockGame.maxPlayers}人・
                {mockGame.min_playing_time}分～{mockGame.max_playing_time}分・
                {mockGame.categories?.join("・")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h2 className="font-bold text-yellow-800 mb-2">⚠️ テスト環境</h2>
          <p className="text-yellow-700 text-sm">
            これはレビューシステムv2のテストページです。実際のデータは投稿されません。
          </p>
        </div>

        <Suspense fallback={
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        }>
          <ReviewFormClient game={mockGame} />
        </Suspense>
      </div>
    </div>
  );
}

export const metadata = {
  title: "レビューフォーム テスト | BGR",
  description: "レビューシステムv2のテストページ",
};