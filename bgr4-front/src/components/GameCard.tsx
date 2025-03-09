"use client";

import { Box, Paper, Typography, Button } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import EditIcon from "@mui/icons-material/Edit";
import GameRating from "./GameRating";
import OverallScoreDisplay from "./OverallScoreDisplay";

interface Game {
  id?: string;
  bgg_id?: string;
  name: string;
  japanese_name?: string;
  image_url?: string;
  japanese_image_url?: string;
  thumbnail?: string;
  averageRating?: number;
  average_score?: number | null;
  minPlayers?: number;
  maxPlayers?: number;
  min_players?: number;
  max_players?: number;
  playingTime?: number;
  play_time?: number;
  min_play_time?: number;
  reviews_count?: number;
}

interface Review {
  user?: {
    name: string;
  };
  overall_score?: number;
  short_comment?: string;
  created_at?: string;
  likes_count?: number;
  id?: number;
}

interface GameCardProps {
  game: Game;
  review?: Review;
  type: "game" | "review";
  useOverallScoreDisplay?: boolean;
  overallScoreVariant?: "default" | "compact" | "large";
  showOverallScoreOverlay?: boolean;
  onReviewUpdated?: () => void;
}

export default function GameCard({
  game,
  review,
  type,
  useOverallScoreDisplay = false,
  overallScoreVariant = "compact",
  showOverallScoreOverlay = false,
  onReviewUpdated,
}: GameCardProps) {
  // 日本語版の画像があればそれを優先、なければ通常の画像を使用
  const imageUrl =
    game.japanese_image_url ||
    game.image_url ||
    game.thumbnail ||
    "/images/no-image.png";
  // 日本語名があればそれを優先、なければ通常の名前を使用
  const displayName = game.japanese_name || game.name;
  const rating =
    type === "review"
      ? review?.overall_score
      : game.average_score || game.averageRating;
  const players = `${game.minPlayers || game.min_players || "?"}〜${
    game.maxPlayers || game.max_players || "?"
  }人`;

  // プレイ時間を範囲で表示
  let playTime = "";
  const minPlayTime = game.min_play_time;
  const maxPlayTime = game.play_time || game.playingTime;

  if (minPlayTime && maxPlayTime && minPlayTime !== maxPlayTime) {
    playTime = `${minPlayTime}〜${maxPlayTime}分`;
  } else if (maxPlayTime) {
    playTime = `${maxPlayTime}分`;
  } else {
    playTime = "?分";
  }

  const linkHref = `/games/${game.bgg_id || game.id}`;
  const reviewHref = `/games/${game.bgg_id || game.id}/review`;
  const reviewsCount = game.reviews_count || 0;

  // ゲームの平均点を取得（nullまたはundefinedの場合は表示しない）
  const hasRating = rating !== null && rating !== undefined && rating > 0;

  // デバッグ情報を出力（開発環境でのみ）
  if (process.env.NODE_ENV === "development") {
    console.log(`GameCard for ${displayName}:`, {
      average_score: game.average_score,
      averageRating: game.averageRating,
      rating,
      hasRating,
      reviewsCount,
    });
  }

  return (
    <Paper
      sx={{
        p: 2,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {showOverallScoreOverlay && hasRating && (
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
            score={rating as number}
            reviewsCount={reviewsCount}
            variant={overallScoreVariant}
          />
        </Box>
      )}

      <Box>
        <Link href={linkHref}>
          <Box
            sx={{
              position: "relative",
              width: "100%",
              paddingTop: "100%",
              mb: 2,
              overflow: "hidden",
              borderRadius: 1,
            }}
          >
            {imageUrl && (
              <Image
                src={imageUrl}
                alt={displayName}
                fill
                sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
                priority={type === "game"}
                style={{
                  objectFit: "cover",
                  objectPosition: "center",
                }}
              />
            )}
          </Box>
        </Link>
        <Box sx={{ flexGrow: 1 }}>
          <Link href={linkHref}>
            <Typography variant="h6" component="h2" gutterBottom noWrap>
              {displayName}
            </Typography>
          </Link>

          {type === "review" && review && (
            <>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                投稿日: {review.created_at && formatDate(review.created_at)}
              </Typography>
              {typeof review.likes_count === "number" && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  いいね: {review.likes_count}
                </Typography>
              )}
              <Link href={reviewHref} style={{ textDecoration: "none" }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EditIcon />}
                  sx={{ mt: 1, mb: 2 }}
                >
                  レビューを修正
                </Button>
              </Link>
            </>
          )}

          {hasRating && (
            <Box sx={{ mb: 1 }}>
              {useOverallScoreDisplay ? (
                <OverallScoreDisplay
                  score={rating as number}
                  reviewsCount={reviewsCount}
                  variant={overallScoreVariant}
                />
              ) : (
                <GameRating
                  score={rating}
                  reviewsCount={reviewsCount}
                  size="small"
                />
              )}
            </Box>
          )}

          {type === "game" && (
            <>
              <Typography variant="body2" color="text.secondary">
                プレイ人数: {players}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                プレイ時間: {playTime}
              </Typography>
            </>
          )}

          {type === "review" && review?.short_comment && (
            <Typography
              variant="body2"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
              }}
            >
              {review.short_comment}
            </Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );
}
