import React from "react";
import { Box, Typography, Rating, Chip } from "@mui/material";
import { People, AccessTime } from "@mui/icons-material";
import type { Game } from "@/types/game";

interface GameMetaProps {
  game: Game;
  size?: "small" | "medium" | "large";
  showRating?: boolean;
  showPlayerCount?: boolean;
  showPlayTime?: boolean;
}

export function GameMeta({
  game,
  size = "medium",
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
      return `${game.min_players}－${game.max_players}人`;
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
      return `${game.min_play_time}分～${game.play_time}分`;
    } else if (game.play_time) {
      return `${game.play_time}分`;
    }
    return null;
  };

  // 総合得点の表示判定
  const hasAverageScore = game.average_score && game.average_score > 0;
  const rating = hasAverageScore ? Number(game.average_score) : 0;

  // 10点満点を5つ星に正確に変換
  // 10 = ★★★★★ (5.0), 8 = ★★★★☆ (4.0), 6 = ★★★☆☆ (3.0), 4 = ★★☆☆☆ (2.0), 2 = ★☆☆☆☆ (1.0), 0 = ☆☆☆☆☆ (0.0)
  // 1 = ★の半分 (0.5), 3 = ★と★の半分 (1.5), 5 = ★★と★の半分 (2.5), 7 = ★★★と★の半分 (3.5), 9 = ★★★★と★の半分 (4.5)
  const starRating = rating / 2;

  const playerCount = formatPlayerCount();
  const playTime = formatPlayTime();

  const textSize =
    size === "small" ? "body2" : size === "large" ? "h6" : "body1";
  const starSize = size === "small" ? "small" : "medium";
  const chipSize = size === "small" ? "small" : "medium";
  const iconSize = size === "small" ? "small" : "medium";

  return (
    <Box>
      {/* 評価: 7.8 ★★★★☆ */}
      {showRating && hasAverageScore && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
          <Chip
            label={rating.toFixed(1)}
            size={chipSize}
            sx={{
              fontWeight: "bold",
              bgcolor: "primary.main",
              color: "white",
              fontSize: size === "small" ? "0.75rem" : "0.875rem",
              minWidth: "auto",
              height: size === "small" ? 20 : 24,
            }}
          />
          <Rating
            value={starRating}
            precision={0.5} // 0.5刻みで正確な半星表示
            size={starSize}
            readOnly
            sx={{
              "& .MuiRating-iconEmpty": {
                color: "text.disabled",
              },
              "& .MuiRating-iconFilled": {
                color: "#ffd700", // ゴールドカラーで満星
              },
              "& .MuiRating-iconHover": {
                color: "#ffd700",
              },
            }}
          />
        </Box>
      )}

      {/* プレイ人数と時間: 👥１－２人　⏰６０分～１２０分 */}
      {(showPlayerCount || showPlayTime) && (playerCount || playTime) && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            minWidth: 0,
            position: "relative",
          }}
        >
          {/* 人数部分 - 左側固定 */}
          {showPlayerCount && playerCount && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                minWidth: 0,
                position: "absolute",
                left: 0,
              }}
            >
              <People
                fontSize={iconSize}
                color="action"
                sx={{
                  fontSize: size === "small" ? 14 : 18,
                  flexShrink: 0,
                }}
              />
              <Typography
                variant="body2"
                color="text.secondary"
                component="span"
                sx={{
                  whiteSpace: "nowrap",
                  fontSize: size === "small" ? "0.7rem" : "0.8rem",
                  lineHeight: 1.2,
                }}
              >
                {playerCount}
              </Typography>
            </Box>
          )}

          {/* 時間部分 - 中央から開始固定 */}
          {showPlayTime && playTime && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                minWidth: 0,
                position: "absolute",
                left: "70%",
                transform: "translateX(-50%)",
              }}
            >
              <AccessTime
                fontSize={iconSize}
                color="action"
                sx={{
                  fontSize: size === "small" ? 14 : 18,
                  flexShrink: 0,
                }}
              />
              <Typography
                variant="body2"
                color="text.secondary"
                component="span"
                sx={{
                  whiteSpace: "nowrap",
                  fontSize: size === "small" ? "0.7rem" : "0.8rem",
                  lineHeight: 1.2,
                }}
              >
                {playTime}
              </Typography>
            </Box>
          )}

          {/* スペーサー - 高さを確保 */}
          <Box
            sx={{ height: size === "small" ? "18px" : "22px", width: "100%" }}
          />
        </Box>
      )}
    </Box>
  );
}

export default GameMeta;
