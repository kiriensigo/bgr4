import React from "react";
import { Box, CardMedia } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { Game } from "@/types/game";

const StyledCardMedia = styled(CardMedia)(({ theme }) => ({
  height: 200,
  objectFit: "cover",
  transition: "transform 0.3s ease-in-out",
  "&:hover": {
    transform: "scale(1.05)",
  },
}));

const ImageContainer = styled(Box)({
  overflow: "hidden",
  borderRadius: "8px 8px 0 0",
});

interface GameImageProps {
  game: Game;
  height?: number;
  className?: string;
}

export function GameImage({ game, height = 200, className }: GameImageProps) {
  const imageUrl =
    game.image_url || game.thumbnail_url || "/images/no-image.png";

  return (
    <ImageContainer className={className}>
      <StyledCardMedia
        component="img"
        height={height}
        image={imageUrl}
        alt={game.japanese_name || game.name || "ゲーム画像"}
        sx={{ height }}
        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
          e.currentTarget.src = "/images/no-image.png";
        }}
      />
    </ImageContainer>
  );
}

export default GameImage;
