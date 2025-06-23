"use client";

import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  CircularProgress,
  Typography,
} from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";
import GroupIcon from "@mui/icons-material/Group";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import GameRating from "../GameRating";
import OverallScoreDisplay from "../OverallScoreDisplay";
import type { Game } from "@/types/api";

interface CompactGameCardProps {
  game: Game;
  linkHref: string;
  imageUrl: string | null | undefined;
  displayName: string;
  hasRating: boolean;
  rating: number | undefined | null;
  reviewsCount: number;
  players: string;
  playTime: string;
  useOverallScoreDisplay?: boolean;
  overallScoreVariant?: "default" | "compact" | "large";
  showOverallScoreOverlay?: boolean;
}

const CompactGameCard = ({
  game,
  linkHref,
  imageUrl,
  displayName,
  hasRating,
  rating,
  reviewsCount,
  players,
  playTime,
  useOverallScoreDisplay = false,
  overallScoreVariant = "compact",
  showOverallScoreOverlay = false,
}: CompactGameCardProps) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardActionArea
        component={Link}
        href={linkHref}
        sx={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
        }}
      >
        <CardContent sx={{ p: 0.5, width: "100%" }}>
          <Typography
            variant="h6"
            component="h2"
            align="center"
            fontWeight="bold"
            sx={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              minHeight: "auto",
              lineHeight: "1.5em",
              pb: 0.5,
            }}
          >
            {displayName}
          </Typography>
        </CardContent>

        <Box sx={{ width: "100%", position: "relative", paddingTop: "100%" }}>
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              backgroundColor: "grey.100",
            }}
          >
            {imageUrl && !imageError ? (
              <Image
                src={imageUrl}
                alt={displayName}
                fill
                sizes="(max-width: 600px) 50vw, (max-width: 900px) 33vw, 25vw"
                style={{ objectFit: "cover" }}
                onLoad={() => setImageLoading(false)}
                onError={() => setImageError(true)}
                loading="lazy"
              />
            ) : (
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {imageLoading ? (
                  <CircularProgress size={30} />
                ) : (
                  <ImageNotSupportedIcon
                    sx={{ fontSize: 40, color: "text.secondary" }}
                  />
                )}
              </Box>
            )}
          </Box>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <CardContent sx={{ p: 0.5, width: "100%" }}>
          {hasRating && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "32px",
                mb: 1,
              }}
            >
              {useOverallScoreDisplay ? (
                <OverallScoreDisplay
                  score={rating as number}
                  reviewsCount={reviewsCount}
                  variant={overallScoreVariant}
                />
              ) : (
                <>
                  <Typography
                    variant="h6"
                    component="span"
                    fontWeight="bold"
                    sx={{ mr: 1, lineHeight: 1, color: "primary.main" }}
                  >
                    {Number(rating).toFixed(1)}
                  </Typography>
                  <GameRating
                    score={rating}
                    reviewsCount={reviewsCount}
                    size="small"
                  />
                </>
              )}
            </Box>
          )}
          {!hasRating && <Box sx={{ height: "32px", mb: 1 }} />}

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
              color: "text.secondary",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <GroupIcon sx={{ fontSize: 16, mr: 0.5 }} />
              <Typography variant="body2">{players}</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <AccessTimeIcon sx={{ fontSize: 16, mr: 0.5 }} />
              <Typography variant="body2">{playTime}</Typography>
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default CompactGameCard;
