"use client";

import {
  Box,
  Paper,
  Typography,
  Button,
  CardMedia,
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";
import GroupIcon from "@mui/icons-material/Group";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EditIcon from "@mui/icons-material/Edit";
import ShareIcon from "@mui/icons-material/Share";
import OverallScoreDisplay from "../OverallScoreDisplay";
import GameRating from "../GameRating";
import ShareToTwitterButton from "../ShareToTwitterButton";
import type { Game } from "@/types/api";

interface ListGameCardProps {
  game: Game;
  linkHref: string;
  imageUrl: string | null | undefined;
  displayName: string;
  hasRating: boolean;
  rating: number | undefined | null;
  reviewsCount: number;
  players: string;
  playTime: string;
  minPlayTime: number | undefined | null;
  maxPlayTime: number | undefined | null;
  useOverallScoreDisplay?: boolean;
  overallScoreVariant?: "default" | "compact" | "large";
  showOverallScoreOverlay?: boolean;
  reviewHref: string;
  enableSharing?: boolean;
}

const ListGameCard = ({
  game,
  linkHref,
  imageUrl,
  displayName,
  hasRating,
  rating,
  reviewsCount,
  players,
  playTime,
  useOverallScoreDisplay,
  overallScoreVariant,
  showOverallScoreOverlay,
  reviewHref,
  enableSharing,
}: ListGameCardProps) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const handleOpenShareDialog = () => {
    setShowShareDialog(true);
  };

  const handleCloseShareDialog = () => {
    setShowShareDialog(false);
  };

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
                    console.error(`画像の読み込みに失敗しました: ${imageUrl}`);
                    setImageLoading(false);
                    setImageError(true);
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.style.display = "none";
                  }}
                />
              ) : null}

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
          </Box>
        </Box>
      </Paper>
    </>
  );
};

export default ListGameCard;
