import React from "react";
import { Card, CardActionArea, CardContent } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import { GameImage } from "./GameImage";
import { GameMeta } from "./GameMeta";
import type { Game } from "../../../types/game";

const StyledCard = styled(Card)(({ theme }) => ({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  transition: "all 0.3s ease-in-out",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: theme.shadows[8],
  },
}));

const StyledCardContent = styled(CardContent)({
  padding: 0,
  "&:last-child": {
    paddingBottom: 0,
  },
});

interface UnifiedGameCardProps {
  game: Game;
  onClick?: (game: Game) => void;
  showRating?: boolean;
  showPlayerCount?: boolean;
  showPlayTime?: boolean;
  imageHeight?: number;
}

export function UnifiedGameCard({
  game,
  onClick,
  showRating = true,
  showPlayerCount = true,
  showPlayTime = true,
  imageHeight = 200,
}: UnifiedGameCardProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick(game);
    } else {
      // BGG IDを使用してゲーム詳細ページへのリンクを生成
      // バックエンドのコントローラーがbgg_idをURLパラメーターとして期待している
      const gameId = game.bgg_id || game.id;
      router.push(`/games/${gameId}`);
    }
  };

  return (
    <StyledCard>
      <CardActionArea onClick={handleClick} sx={{ height: "100%" }}>
        <StyledCardContent>
          <GameImage game={game} height={imageHeight} />
          <GameMeta
            game={game}
            showRating={showRating}
            showPlayerCount={showPlayerCount}
            showPlayTime={showPlayTime}
          />
        </StyledCardContent>
      </CardActionArea>
    </StyledCard>
  );
}

export default UnifiedGameCard;
