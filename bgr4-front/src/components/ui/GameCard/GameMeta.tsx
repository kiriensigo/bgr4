import React from "react";
import { Box, Typography, Chip, Stack } from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import GroupIcon from "@mui/icons-material/Group";
import StarIcon from "@mui/icons-material/Star";
import type { Game } from "@/types/game";

interface GameMetaProps {
  game: Game;
  showRating?: boolean;
  showPlayerCount?: boolean;
  showPlayTime?: boolean;
}

export function GameMeta({
  game,
  showRating = true,
  showPlayerCount = true,
  showPlayTime = true,
}: GameMetaProps) {
  // プレイ人数の表示フォーマット
  const formatPlayerCount = () => {
    if (game.min_players && game.max_players) {
      if (game.min_players === game.max_players) {
        return `${game.min_players}人`;
      }
      return `${game.min_players}-${game.max_players}人`;
    }
    return null;
  };

  // プレイ時間の表示フォーマット
  const formatPlayTime = () => {
    if (
      game.min_play_time &&
      game.play_time &&
      game.min_play_time !== game.play_time
    ) {
      return `${game.min_play_time}〜${game.play_time}分`;
    } else if (game.play_time) {
      return `${game.play_time}分`;
    }
    return null;
  };

  // 総合得点の表示判定
  const hasAverageScore = game.average_score && game.average_score > 0;

  return (
    <Box sx={{ p: 2 }}>
      {/* ゲーム名 */}
      <Typography
        variant="h6"
        component="h3"
        sx={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          mb: 1,
          minHeight: "2.4em",
          lineHeight: 1.2,
        }}
      >
        {game.japanese_name || game.name}
      </Typography>

      {/* 評価とメタ情報 */}
      <Stack
        direction="row"
        spacing={1}
        sx={{ mb: 1, flexWrap: "wrap", gap: 0.5 }}
      >
        {/* 総合得点 */}
        {showRating && hasAverageScore && (
          <Chip
            icon={<StarIcon />}
            label={`${Number(game.average_score).toFixed(1)}`}
            size="small"
            variant="filled"
            color="primary"
            sx={{ fontWeight: "bold" }}
          />
        )}

        {/* プレイ人数 */}
        {showPlayerCount && formatPlayerCount() && (
          <Chip
            icon={<GroupIcon />}
            label={formatPlayerCount()}
            size="small"
            variant="outlined"
          />
        )}

        {/* プレイ時間 */}
        {showPlayTime && formatPlayTime() && (
          <Chip
            icon={<AccessTimeIcon />}
            label={formatPlayTime()}
            size="small"
            variant="outlined"
          />
        )}
      </Stack>
    </Box>
  );
}

export default GameMeta;
