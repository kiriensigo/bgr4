"use client";

import { Box, Typography, CardContent } from "@mui/material";
import Link from "next/link";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import GroupIcon from "@mui/icons-material/Group";
import GameRating from "./GameRating";
import OverallScoreDisplay from "./OverallScoreDisplay";

interface GameInfoCardProps {
  game: {
    id?: string;
    bgg_id?: string;
    name: string;
    japanese_name?: string;
    min_players?: number;
    max_players?: number;
    play_time?: number;
    min_play_time?: number;
    average_score?: number | null;
  };
  showRating?: boolean;
  useOverallScoreDisplay?: boolean;
  reviewsCount?: number;
}

/**
 * ゲーム情報を表示するコンポーネント
 *
 * @param game - ゲーム情報
 * @param categories - カテゴリー情報
 * @param showRating - 評価を表示するかどうか
 * @param useOverallScoreDisplay - 総合得点コンポーネントを使用するかどうか
 * @param reviewsCount - レビュー数
 * @param maxTagsToShow - 表示するタグの最大数
 */
export default function GameInfoCard({
  game,
  showRating = true,
  useOverallScoreDisplay = false,
  reviewsCount = 0,
}: GameInfoCardProps) {
  const gameId = game.bgg_id || game.id;
  const displayName = game.japanese_name || game.name;
  const linkHref = `/games/${gameId}`;

  // ゲームの平均点を取得（nullまたはundefinedの場合は表示しない）
  const hasAverageScore =
    game.average_score !== null &&
    game.average_score !== undefined &&
    game.average_score > 0;

  // プレイ時間を範囲で表示
  let playTime = "";
  if (
    game.min_play_time &&
    game.play_time &&
    game.min_play_time !== game.play_time
  ) {
    playTime = `${game.min_play_time}〜${game.play_time}分`;
  } else if (game.play_time) {
    playTime = `${game.play_time}分`;
  }

  return (
    <CardContent>
      <Link
        href={linkHref}
        style={{ textDecoration: "none", color: "inherit" }}
      >
        <Box
          sx={{
            height: "3.6em", // 2行分の高さを固定（h6サイズ用）
            display: "flex",
            alignItems: "flex-start",
            mb: 1,
          }}
        >
          <Typography
            variant="h6"
            component="h2"
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2, // 2行まで表示
              WebkitBoxOrient: "vertical",
              lineHeight: 1.2,
              width: "100%",
            }}
          >
            {displayName}
          </Typography>
        </Box>
      </Link>

      {showRating && hasAverageScore && (
        <Box sx={{ mb: 1 }}>
          {useOverallScoreDisplay ? (
            <OverallScoreDisplay
              score={game.average_score as number}
              reviewsCount={reviewsCount || 0}
              variant="compact"
            />
          ) : (
            <GameRating
              score={game.average_score}
              reviewsCount={reviewsCount}
              size="small"
            />
          )}
        </Box>
      )}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mt: 1,
        }}
      >
        {game.min_players && game.max_players && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            <GroupIcon />
            <Typography variant="body2">
              {game.min_players}-{game.max_players}人
            </Typography>
          </Box>
        )}

        {playTime && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            <AccessTimeIcon />
            <Typography variant="body2">{playTime}</Typography>
          </Box>
        )}
      </Box>
    </CardContent>
  );
}
