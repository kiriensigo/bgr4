import React from "react";
import { Box, CardMedia } from "@mui/material";
import { styled } from "@mui/material/styles";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";
import type { Game } from "@/types/game";

const StyledCardMedia = styled(CardMedia)(() => ({
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

const PlaceholderContainer = styled(Box)(({ theme }) => ({
  height: 200,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: theme.palette.grey[100],
  color: theme.palette.grey[500],
  borderRadius: "8px 8px 0 0",
}));

interface GameImageProps {
  game: Game;
  height?: number;
  className?: string;
}

export function GameImage({ game, height = 200, className }: GameImageProps) {
  // 実際の画像URLがあるかチェック（no-image.pngやplaceholderは除く）
  const hasRealImage = game.image_url || game.thumbnail_url;
  const imageUrl = hasRealImage ? game.image_url || game.thumbnail_url : null;

  return (
    <ImageContainer className={className}>
      {hasRealImage ? (
        // 実際の画像がある場合のみimg要素を使用
        <StyledCardMedia
          component="img"
          height={height}
          image={imageUrl!}
          alt={game.japanese_name || game.name || "ゲーム画像"}
          sx={{ height }}
          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
            // エラー時はプレースホルダーに置き換える
            e.currentTarget.src = "/images/no-image.png";
          }}
        />
      ) : (
        // 画像がない場合は直接プレースホルダーを表示（ネットワークリクエストなし）
        <PlaceholderContainer sx={{ height }}>
          <ImageNotSupportedIcon sx={{ fontSize: 40, mb: 1 }} />
          <Box sx={{ fontSize: "0.75rem", textAlign: "center" }}>画像なし</Box>
        </PlaceholderContainer>
      )}
    </ImageContainer>
  );
}

export default GameImage;
