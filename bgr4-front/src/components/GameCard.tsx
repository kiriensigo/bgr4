"use client";

import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  IconButton,
  Tooltip,
} from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import EditIcon from "@mui/icons-material/Edit";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";
import GameRating from "./GameRating";
import OverallScoreDisplay from "./OverallScoreDisplay";
import { useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import GroupIcon from "@mui/icons-material/Group";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import Rating from "@mui/material/Rating";
import ShareToTwitterButton from "./ShareToTwitterButton";
import ShareIcon from "@mui/icons-material/Share";

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
  site_recommended_players?: any[];
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
  variant?: "default" | "carousel" | "grid" | "search" | "review";
  enableSharing?: boolean;
}

export default function GameCard({
  game,
  review,
  type,
  useOverallScoreDisplay = false,
  overallScoreVariant = "compact",
  showOverallScoreOverlay = false,
  onReviewUpdated,
  variant = "default",
  enableSharing = true,
}: GameCardProps) {
  // 画像読み込み状態を管理するステート
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  // 日本語版の画像があればそれを優先、なければ通常の画像を使用
  const imageUrl = game.japanese_image_url || game.image_url || game.thumbnail;
  // 日本語名があればそれを優先、なければ通常の名前を使用
  const displayName = game.japanese_name || game.name;
  const rating =
    type === "review"
      ? review?.overall_score
      : game.average_score || game.averageRating;
  const minPlayers = game.minPlayers || game.min_players || "?";
  const maxPlayers = game.maxPlayers || game.max_players || "?";
  const players = `${minPlayers}〜${maxPlayers}人`;

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

  // シェアダイアログを開く
  const handleOpenShareDialog = () => {
    setShowShareDialog(true);
  };

  // シェアダイアログを閉じる
  const handleCloseShareDialog = () => {
    setShowShareDialog(false);
  };

  // カルーセル表示の場合
  if (variant === "carousel" || variant === "grid" || variant === "search") {
    return (
      <Card
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: 4,
          },
        }}
      >
        <CardActionArea component={Link} href={linkHref} sx={{ flexGrow: 1 }}>
          <Box
            sx={{
              position: "relative",
              width: "100%",
              paddingTop: "100%",
              overflow: "hidden",
              backgroundColor: "grey.100",
            }}
          >
            {imageUrl && !imageError ? (
              <Image
                src={imageUrl}
                alt={displayName}
                fill
                sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
                priority={false}
                loading="lazy"
                style={{
                  objectFit: "contain",
                  objectPosition: "center",
                }}
                onLoad={() => {
                  setImageLoading(false);
                  setImageError(false);
                }}
                onError={(e) => {
                  console.warn(
                    `画像の読み込みに失敗、プレースホルダーを使用: ${imageUrl}`
                  );
                  setImageLoading(false);
                  setImageError(true);
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = "/placeholder-game.svg";
                  target.style.display = "block";
                }}
              />
            ) : null}

            {/* 画像読み込み中またはエラー時の表示 */}
            {(imageLoading || imageError) && (
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "grey.100",
                }}
              >
                {imageLoading && !imageError ? (
                  <CircularProgress size={30} />
                ) : (
                  <>
                    <ImageNotSupportedIcon
                      sx={{ fontSize: 40, color: "text.secondary", mb: 1 }}
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      align="center"
                    >
                      画像なし
                    </Typography>
                  </>
                )}
              </Box>
            )}

            {/* 評価オーバーレイ */}
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
          </Box>

          <CardContent>
            <Typography
              gutterBottom
              variant="h6"
              component="h2"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 1,
                WebkitBoxOrient: "vertical",
              }}
            >
              {displayName}
            </Typography>

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

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                mb: 1,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <GroupIcon sx={{ mr: 0.5, fontSize: "small" }} />
                <Typography variant="body2" color="text.secondary">
                  {players}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <AccessTimeIcon sx={{ mr: 0.5, fontSize: "small" }} />
                <Typography variant="body2" color="text.secondary">
                  {playTime}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </CardActionArea>
      </Card>
    );
  }

  // レビュー表示の場合
  if (variant === "review") {
    return (
      <>
        <Card
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            borderRadius: 2,
            overflow: "hidden",
            transition:
              "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
            "&:hover": {
              transform: "translateY(-4px)",
              boxShadow: 4,
            },
            position: "relative",
          }}
        >
          <CardActionArea component={Link} href={linkHref} sx={{ flexGrow: 0 }}>
            <Box
              sx={{
                position: "relative",
                width: "100%",
                paddingTop: "100%",
                overflow: "hidden",
                backgroundColor: "grey.100",
              }}
            >
              {imageUrl && !imageError ? (
                <Image
                  src={imageUrl}
                  alt={displayName}
                  fill
                  sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
                  priority={false}
                  loading="lazy"
                  style={{
                    objectFit: "contain",
                    objectPosition: "center",
                  }}
                  onLoad={() => {
                    setImageLoading(false);
                    setImageError(false);
                  }}
                  onError={(e) => {
                    console.warn(
                      `画像の読み込みに失敗、プレースホルダーを使用: ${imageUrl}`
                    );
                    setImageLoading(false);
                    setImageError(true);
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = "/placeholder-game.svg";
                    target.style.display = "block";
                  }}
                />
              ) : null}

              {/* 画像読み込み中またはエラー時の表示 */}
              {(imageLoading || imageError) && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "grey.100",
                  }}
                >
                  {imageLoading && !imageError ? (
                    <CircularProgress size={30} />
                  ) : (
                    <>
                      <ImageNotSupportedIcon
                        sx={{ fontSize: 40, color: "text.secondary", mb: 1 }}
                      />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        align="center"
                      >
                        画像なし
                      </Typography>
                    </>
                  )}
                </Box>
              )}

              {/* 評価オーバーレイ */}
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
            </Box>

            <CardContent>
              <Typography
                gutterBottom
                variant="h6"
                component="h2"
                sx={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {displayName}
              </Typography>

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

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  mb: 1,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <GroupIcon sx={{ mr: 0.5, fontSize: "small" }} />
                  <Typography variant="body2" color="text.secondary">
                    {players}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <AccessTimeIcon sx={{ mr: 0.5, fontSize: "small" }} />
                  <Typography variant="body2" color="text.secondary">
                    {playTime}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </CardActionArea>

          {/* レビュー情報 */}
          {review && (
            <CardContent sx={{ pt: 0, flexGrow: 1 }}>
              <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: "divider" }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Rating
                      value={
                        typeof review.overall_score === "number"
                          ? review.overall_score / 2
                          : 0
                      }
                      precision={0.5}
                      size="small"
                      readOnly
                    />
                    <Typography variant="body2" color="text.secondary">
                      {typeof review.overall_score === "number"
                        ? review.overall_score.toFixed(1)
                        : "0.0"}
                    </Typography>
                  </Box>

                  {typeof review.likes_count === "number" && (
                    <Typography variant="body2" color="text.secondary">
                      いいね: {review.likes_count}
                    </Typography>
                  )}
                </Box>

                {review.short_comment && (
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
            </CardContent>
          )}

          {/* レビュー用の共有ボタンなど */}
          {type === "review" && review && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                px: 2,
                py: 1,
                borderTop: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {review.created_at && formatDate(review.created_at)}
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                {enableSharing && (
                  <Tooltip title="レビューをシェア">
                    <IconButton size="small" onClick={handleOpenShareDialog}>
                      <ShareIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {onReviewUpdated && (
                  <Tooltip title="レビューを編集">
                    <IconButton
                      size="small"
                      component={Link}
                      href={`/games/${game.id}/review`}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>
          )}
        </Card>

        {/* シェアダイアログ */}
        {showShareDialog && review && (
          <Box
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: "rgba(0, 0, 0, 0.7)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999,
            }}
            onClick={handleCloseShareDialog}
          >
            <Paper
              sx={{
                p: 3,
                maxWidth: 400,
                width: "90%",
                textAlign: "center",
                borderRadius: 2,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Typography variant="h6" gutterBottom>
                レビューをシェア
              </Typography>
              <Box sx={{ my: 2 }}>
                <ShareToTwitterButton
                  gameName={displayName}
                  gameId={game.id || ""}
                  score={review.overall_score || 0}
                  comment={review.short_comment || ""}
                  variant="outlined"
                  fullWidth
                />
              </Box>
              <Button
                variant="text"
                onClick={handleCloseShareDialog}
                sx={{ mt: 1 }}
              >
                閉じる
              </Button>
            </Paper>
          </Box>
        )}
      </>
    );
  }

  // 従来のデザイン（デフォルト）
  return (
    <>
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
                backgroundColor: "grey.100",
              }}
            >
              {imageUrl && !imageError ? (
                <Image
                  src={imageUrl}
                  alt={displayName}
                  fill
                  sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
                  priority={false}
                  loading="lazy"
                  style={{
                    objectFit: "cover",
                    objectPosition: "center",
                  }}
                  onLoad={() => {
                    setImageLoading(false);
                    setImageError(false);
                  }}
                  onError={(e) => {
                    // 画像の読み込みに失敗した場合の処理
                    console.error(`画像の読み込みに失敗しました: ${imageUrl}`);
                    setImageLoading(false);
                    setImageError(true);

                    // エラー処理
                    const target = e.target as HTMLImageElement;
                    target.onerror = null; // 無限ループを防ぐ
                    target.style.display = "none"; // 画像を非表示に
                  }}
                />
              ) : null}

              {/* 画像読み込み中またはエラー時の表示 */}
              {(imageLoading || imageError) && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "grey.100",
                  }}
                >
                  {imageLoading && !imageError ? (
                    <CircularProgress size={30} />
                  ) : (
                    <>
                      <ImageNotSupportedIcon
                        sx={{ fontSize: 40, color: "text.secondary", mb: 1 }}
                      />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        align="center"
                      >
                        画像なし
                      </Typography>
                    </>
                  )}
                </Box>
              )}
            </Box>
          </Link>
          <Box sx={{ flexGrow: 1 }}>
            <Link href={linkHref}>
              <Typography
                variant="h6"
                component="h2"
                gutterBottom
                sx={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {displayName}
              </Typography>
            </Link>

            {/* 従来デザインでのレビュー情報 */}
            {type === "review" && review && (
              <>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mt: 1,
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    投稿日: {review.created_at && formatDate(review.created_at)}
                  </Typography>

                  {enableSharing && (
                    <Tooltip title="レビューをシェア">
                      <IconButton size="small" onClick={handleOpenShareDialog}>
                        <ShareIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>

                {typeof review.likes_count === "number" && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    いいね: {review.likes_count}
                  </Typography>
                )}

                <Box sx={{ display: "flex", gap: 1, mt: 1, mb: 2 }}>
                  {onReviewUpdated && (
                    <Link href={reviewHref} style={{ textDecoration: "none" }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<EditIcon />}
                      >
                        レビューを修正
                      </Button>
                    </Link>
                  )}
                </Box>
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

      {/* シェアダイアログ */}
      {showShareDialog && review && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
          onClick={handleCloseShareDialog}
        >
          <Paper
            sx={{
              p: 3,
              maxWidth: 400,
              width: "90%",
              textAlign: "center",
              borderRadius: 2,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Typography variant="h6" gutterBottom>
              レビューをシェア
            </Typography>
            <Box sx={{ my: 2 }}>
              <ShareToTwitterButton
                gameName={displayName}
                gameId={game.id || ""}
                score={review.overall_score || 0}
                comment={review.short_comment || ""}
                variant="outlined"
                fullWidth
              />
            </Box>
            <Button
              variant="text"
              onClick={handleCloseShareDialog}
              sx={{ mt: 1 }}
            >
              閉じる
            </Button>
          </Paper>
        </Box>
      )}
    </>
  );
}
