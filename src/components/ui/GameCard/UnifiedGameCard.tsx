"use client";

import React from "react";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Paper,
  Typography,
  Button,
  IconButton,
  Tooltip,
} from "@mui/material";
import Link from "next/link";
import EditIcon from "@mui/icons-material/Edit";
import ShareIcon from "@mui/icons-material/Share";
import { GameImage } from "./GameImage";
import { GameRating } from "./GameRating";
import { GameMeta } from "./GameMeta";
import { designTokens, gameCardTokens } from "@/theme/tokens";
import {
  getGameDisplayName,
  getGameImageUrl,
  getGameRating,
  getGameLinkUrl,
  getGameReviewUrl,
} from "@/lib/gameUtils";
import type { Game, Review } from "@/types/api";

export interface UnifiedGameCardProps {
  /** ゲームデータ */
  game: Game;
  /** レビューデータ（review typeの場合） */
  review?: Review;
  /** カードの種類 */
  variant?: "list" | "grid" | "compact" | "featured" | "review";
  /** カードタイプ */
  type?: "game" | "review";
  /** 共有機能有効化 */
  enableSharing?: boolean;
  /** レビュー更新時のコールバック */
  onReviewUpdated?: () => void;
  /** カスタムスタイル */
  sx?: Record<string, any>;
}

/**
 * 統一されたゲームカードコンポーネント
 *
 * 機能:
 * - 複数のバリアント（list, grid, compact, featured, review）
 * - 統一されたデザインシステム
 * - 再利用可能なサブコンポーネント
 * - TypeScript型安全性
 */
export const UnifiedGameCard: React.FC<UnifiedGameCardProps> = ({
  game,
  review,
  variant = "list",
  type = "game",
  enableSharing = true,
  onReviewUpdated,
  sx = {},
}) => {
  // データ準備
  const displayName = getGameDisplayName(game);
  const imageUrl = getGameImageUrl(game);
  const { score, hasRating, reviewsCount } = getGameRating(game);
  const gameLink = getGameLinkUrl(game);
  const reviewLink = getGameReviewUrl(game);

  // レビュー表示の場合のスコア
  const displayScore =
    type === "review" && review ? review.overall_score : score;

  // バリアント別のスタイル設定
  const isCompactVariant = ["grid", "compact"].includes(variant);
  const isFeaturedVariant = variant === "featured";
  const isReviewVariant = variant === "review" || type === "review";

  // カードコンテナの選択
  const CardContainer = isCompactVariant ? Card : Paper;

  // 共通スタイル
  const cardStyle = {
    height: "100%",
    display: "flex",
    flexDirection: isCompactVariant ? "column" : "row",
    position: "relative",
    transition: designTokens.transitions.base,
    "&:hover": {
      transform: isCompactVariant ? "translateY(-2px)" : "none",
      boxShadow: isCompactVariant
        ? designTokens.shadows.md
        : designTokens.shadows.sm,
    },
    ...sx,
  };

  // リストバリアント（横並び）
  if (variant === "list") {
    return (
      <Paper sx={cardStyle}>
        <Box sx={{ p: 2, display: "flex", gap: 2, width: "100%" }}>
          {/* 画像 */}
          <Link href={gameLink}>
            <GameImage
              imageUrl={imageUrl}
              gameName={displayName}
              size="small"
              aspectRatio="square"
            />
          </Link>

          {/* コンテンツ */}
          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <Link href={gameLink}>
              <Typography
                variant="h6"
                component="h2"
                sx={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: "vertical",
                  "&:hover": {
                    color: designTokens.colors.primary[700],
                  },
                }}
              >
                {displayName}
              </Typography>
            </Link>

            {/* メタ情報（評価、プレイ人数、時間を含む） */}
            <GameMeta
              game={{ ...game, average_score: displayScore }}
              size="small"
            />

            {/* アクション */}
            <Box sx={{ mt: "auto", display: "flex", gap: 1 }}>
              <Button
                component={Link}
                href={reviewLink}
                variant="outlined"
                size="small"
                startIcon={<EditIcon />}
              >
                レビュー
              </Button>
              {enableSharing && (
                <IconButton size="small">
                  <ShareIcon />
                </IconButton>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>
    );
  }

  // グリッド・コンパクトバリアント（縦並び）
  if (isCompactVariant) {
    return (
      <Card sx={cardStyle}>
        <CardActionArea
          component={Link}
          href={gameLink}
          sx={{
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
            alignItems: "stretch",
          }}
        >
          {/* タイトル */}
          <CardContent sx={{ p: 1, pb: 0.5 }}>
            <Typography
              variant="subtitle1"
              component="h2"
              align="center"
              fontWeight="bold"
              sx={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {displayName}
            </Typography>
          </CardContent>

          {/* 画像 */}
          <Box
            sx={{
              px: 1,
              flexGrow: 1,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <GameImage
              imageUrl={imageUrl}
              gameName={displayName}
              size={variant === "compact" ? "medium" : "large"}
              aspectRatio="card"
              sx={{ maxWidth: "100%" }}
            />
          </Box>

          {/* フッター */}
          <CardContent sx={{ p: 1, pt: 0.5 }}>
            {/* メタ情報（評価、プレイ人数、時間を含む） */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              <GameMeta
                game={{ ...game, average_score: displayScore }}
                size="small"
              />
            </Box>
          </CardContent>
        </CardActionArea>
      </Card>
    );
  }

  // フィーチャードバリアント
  if (isFeaturedVariant) {
    return (
      <Card sx={{ ...cardStyle, maxWidth: 400 }}>
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {/* 画像エリア */}
          <Link href={gameLink}>
            <Box sx={{ position: "relative" }}>
              <GameImage
                imageUrl={imageUrl}
                gameName={displayName}
                size="large"
                aspectRatio="video"
                sx={{ width: "100%", height: 200 }}
              />

              {/* オーバーレイ評価 */}
              {hasRating && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    bgcolor: designTokens.colors.background.overlay,
                    borderRadius: designTokens.borders.radius.md,
                    p: 0.5,
                    boxShadow: designTokens.shadows.sm,
                  }}
                >
                  <GameRating
                    score={displayScore}
                    reviewsCount={reviewsCount}
                    size="small"
                    variant="score-only"
                  />
                </Box>
              )}
            </Box>
          </Link>

          {/* コンテンツ */}
          <CardContent
            sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
          >
            <Link href={gameLink}>
              <Typography
                variant="h5"
                component="h2"
                gutterBottom
                sx={{
                  "&:hover": {
                    color: designTokens.colors.primary[700],
                  },
                }}
              >
                {displayName}
              </Typography>
            </Link>

            <GameMeta game={game} size="medium" sx={{ mb: 2 }} />

            <Box
              sx={{
                mt: "auto",
                display: "flex",
                gap: 1,
                justifyContent: "space-between",
              }}
            >
              <Button
                component={Link}
                href={reviewLink}
                variant="contained"
                startIcon={<EditIcon />}
              >
                レビューする
              </Button>
              {enableSharing && (
                <IconButton>
                  <ShareIcon />
                </IconButton>
              )}
            </Box>
          </CardContent>
        </Box>
      </Card>
    );
  }

  // レビューバリアント
  if (isReviewVariant && review) {
    return (
      <Card sx={cardStyle}>
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {/* ヘッダー */}
          <CardContent sx={{ pb: 1 }}>
            <Typography variant="h6" component="h2" noWrap title={displayName}>
              {displayName}
            </Typography>
          </CardContent>

          {/* 画像 */}
          <Link href={gameLink}>
            <GameImage
              imageUrl={imageUrl}
              gameName={displayName}
              size="medium"
              aspectRatio="video"
              sx={{ width: "100%", height: 150 }}
            />
          </Link>

          {/* レビュー情報 */}
          <CardContent sx={{ flexGrow: 1 }}>
            <GameRating
              score={review.overall_score}
              size="medium"
              variant="full"
              showReviewCount={false}
            />

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              投稿日: {new Date(review.created_at).toLocaleDateString("ja-JP")}
            </Typography>

            <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
              <Button
                component={Link}
                href={reviewLink}
                variant="outlined"
                size="small"
                startIcon={<EditIcon />}
              >
                編集
              </Button>
              {enableSharing && (
                <IconButton size="small">
                  <ShareIcon />
                </IconButton>
              )}
            </Box>
          </CardContent>
        </Box>
      </Card>
    );
  }

  // デフォルトはリストバリアント
  return null;
};
