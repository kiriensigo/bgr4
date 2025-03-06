"use client";

import { Card, CardActionArea, Box } from "@mui/material";
import GameImageCard from "./GameImageCard";
import GameInfoCard from "./GameInfoCard";
import ReviewContentCard from "./ReviewContentCard";
import OverallScoreDisplay from "./OverallScoreDisplay";
import Link from "next/link";

interface Game {
  id?: string;
  bgg_id?: string;
  name: string;
  japanese_name?: string;
  image_url?: string;
  min_players?: number;
  max_players?: number;
  play_time?: number;
  average_score?: number | null;
}

interface Review {
  id: number;
  overall_score: number | string;
  short_comment: string;
  created_at: string;
  likes_count: number;
  liked_by_current_user: boolean;
  categories?: string[];
  mechanics?: string[];
  user: {
    id: number;
    name: string;
    image?: string;
  };
}

interface ReviewCardProps {
  review: Review;
  game: Game;
  showGameInfo?: boolean;
  showReviewContent?: boolean;
  showOverallScore?: boolean;
  useNextImage?: boolean;
  maxCommentLines?: number;
  elevation?: number;
  showLikeButton?: boolean;
  reviewsCount?: number;
  overallScoreVariant?: "default" | "compact" | "large";
}

/**
 * レビューカードコンポーネント
 *
 * @param review - レビュー情報
 * @param game - ゲーム情報
 * @param showGameInfo - ゲーム情報を表示するかどうか
 * @param showReviewContent - レビュー内容を表示するかどうか
 * @param showOverallScore - 総合得点を表示するかどうか
 * @param useNextImage - Next.jsのImageコンポーネントを使用するかどうか
 * @param maxCommentLines - コメントの最大行数
 * @param elevation - カードの影の強さ
 * @param showLikeButton - いいねボタンを表示するかどうか
 * @param reviewsCount - レビュー数
 * @param overallScoreVariant - 総合得点の表示バリエーション
 */
export default function ReviewCard({
  review,
  game,
  showGameInfo = true,
  showReviewContent = true,
  showOverallScore = false,
  useNextImage = false,
  maxCommentLines = 2,
  elevation = 1,
  showLikeButton = true,
  reviewsCount = 0,
  overallScoreVariant = "compact",
}: ReviewCardProps) {
  const gameId = game.bgg_id || game.id || "";
  const categories = review.categories || [];
  const score =
    typeof review.overall_score === "string"
      ? parseFloat(review.overall_score)
      : review.overall_score;

  // ゲームの平均点を取得（nullまたはundefinedの場合は0を使用）
  const averageScore =
    game.average_score !== null && game.average_score !== undefined
      ? game.average_score
      : 0;

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: 4,
        },
        position: "relative",
      }}
      elevation={elevation}
    >
      {/* 総合得点を画像の上に表示（オプション） */}
      {showOverallScore && (
        <Box
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 1,
            bgcolor: "rgba(255, 255, 255, 0.9)",
            borderRadius: 1,
            p: 0.5,
            boxShadow: 1,
          }}
        >
          <OverallScoreDisplay
            score={averageScore}
            reviewsCount={reviewsCount}
            variant={overallScoreVariant}
          />
        </Box>
      )}

      <GameImageCard
        imageUrl={game.image_url || ""}
        gameName={game.name}
        gameId={gameId}
        useNextImage={useNextImage}
      />

      {showGameInfo && (
        <GameInfoCard
          game={game}
          tags={categories}
          showRating={false}
          reviewsCount={reviewsCount}
          useOverallScoreDisplay={true}
        />
      )}

      {showReviewContent && (
        <ReviewContentCard
          review={review}
          showLikeButton={showLikeButton}
          maxCommentLines={maxCommentLines}
        />
      )}
    </Card>
  );
}
