"use client";

import { Box, CardMedia } from "@mui/material";
import Link from "next/link";
import Image from "next/image";

interface GameImageCardProps {
  imageUrl: string;
  gameName: string;
  gameId: string;
  useNextImage?: boolean;
  aspectRatio?: string;
}

/**
 * ゲーム画像を表示するコンポーネント
 * 
 * @param imageUrl - ゲーム画像のURL
 * @param gameName - ゲーム名（alt属性に使用）
 * @param gameId - ゲームID（リンク先に使用）
 * @param useNextImage - Next.jsのImageコンポーネントを使用するかどうか
 * @param aspectRatio - アスペクト比（デフォルトは1:1）
 */
export default function GameImageCard({
  imageUrl,
  gameName,
  gameId,
  useNextImage = false,
  aspectRatio = "1",
}: GameImageCardProps) {
  const fallbackImageUrl = "/images/no-image.png";
  const linkHref = `/games/${gameId}`;
  const finalImageUrl = imageUrl || fallbackImageUrl;

  return (
    <Link href={linkHref} style={{ textDecoration: "none" }}>
      {useNextImage ? (
        <Box
          sx={{
            position: "relative",
            width: "100%",
            paddingTop: aspectRatio === "1" ? "100%" : "56.25%", // 1:1 or 16:9
            overflow: "hidden",
            borderRadius: 1,
          }}
        >
          <Image
            src={finalImageUrl}
            alt={gameName}
            fill
            sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
            priority
            style={{
              objectFit: "contain",
              backgroundColor: "rgb(245, 245, 245)",
            }}
          />
        </Box>
      ) : (
        <CardMedia
          component="img"
          image={finalImageUrl}
          alt={gameName}
          sx={{
            aspectRatio: aspectRatio,
            objectFit: "contain",
            bgcolor: "grey.100",
          }}
        />
      )}
    </Link>
  );
} 