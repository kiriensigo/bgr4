"use client";

import { Box, CardMedia } from "@mui/material";
import Link from "next/link";
import Image from "next/image";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";

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
  const linkHref = `/games/${gameId}`;

  // 実際の画像URLがあるかチェック（空文字、null、undefinedの場合は画像なしとして扱う）
  const hasRealImage = imageUrl && imageUrl.trim() !== "";

  // プレースホルダーコンポーネント
  const PlaceholderImage = () => (
    <Box
      sx={{
        width: "100%",
        aspectRatio: aspectRatio,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "grey.100",
        color: "grey.500",
        borderRadius: 1,
      }}
    >
      <ImageNotSupportedIcon sx={{ fontSize: 40, mb: 1 }} />
      <Box sx={{ fontSize: "0.75rem", textAlign: "center" }}>画像なし</Box>
    </Box>
  );

  return (
    <Link href={linkHref} style={{ textDecoration: "none" }}>
      {!hasRealImage ? (
        // 画像がない場合は直接プレースホルダーを表示（ネットワークリクエストなし）
        <PlaceholderImage />
      ) : useNextImage ? (
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
            src={imageUrl}
            alt={gameName}
            fill
            sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
            priority
            style={{
              objectFit: "contain",
              backgroundColor: "rgb(245, 245, 245)",
            }}
            onError={() => {
              // エラー時は何もしない（プレースホルダーは親コンポーネントで処理）
              console.warn(`Failed to load image: ${imageUrl}`);
            }}
          />
        </Box>
      ) : (
        <CardMedia
          component="img"
          image={imageUrl}
          alt={gameName}
          sx={{
            aspectRatio: aspectRatio,
            objectFit: "contain",
            bgcolor: "grey.100",
          }}
          onError={() => {
            console.warn(`Failed to load image: ${imageUrl}`);
          }}
        />
      )}
    </Link>
  );
}
