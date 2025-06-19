"use client";

import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardMedia,
  IconButton,
  Tooltip,
} from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import EditIcon from "@mui/icons-material/Edit";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";
import { useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import Rating from "@mui/material/Rating";
import ShareToTwitterButton from "../ShareToTwitterButton";
import ShareIcon from "@mui/icons-material/Share";
import type { Game, Review } from "@/types/api";

interface ReviewGameCardProps {
  game: Game;
  review: Review;
  linkHref: string;
  reviewHref: string;
  imageUrl: string | null | undefined;
  displayName: string;
  enableSharing?: boolean;
  onReviewUpdated?: () => void;
}

const ReviewGameCard = ({
  game,
  review,
  linkHref,
  reviewHref,
  imageUrl,
  displayName,
  enableSharing = true,
  onReviewUpdated,
}: ReviewGameCardProps) => {
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
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
        }}
      >
        <Box sx={{ width: { xs: "100%", sm: 150 }, flexShrink: 0 }}>
          <Link href={linkHref}>
            <Box
              sx={{
                position: "relative",
                width: "100%",
                paddingTop: "100%",
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
                  sizes="(max-width: 600px) 100vw, 150px"
                  style={{ objectFit: "cover" }}
                  onLoad={() => setImageLoading(false)}
                  onError={() => {
                    setImageLoading(false);
                    setImageError(true);
                  }}
                  priority
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
                    <ImageNotSupportedIcon
                      sx={{ fontSize: 40, color: "text.secondary" }}
                    />
                  )}
                </Box>
              )}
            </Box>
          </Link>
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Link href={linkHref}>
            <Typography variant="h5" component="h2" gutterBottom>
              {displayName}
            </Typography>
          </Link>
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <Rating
              name="read-only"
              value={review.overall_score}
              readOnly
              precision={0.5}
            />
            <Typography variant="h6" sx={{ ml: 1 }}>
              {review.overall_score.toFixed(1)}
            </Typography>
          </Box>
          <Typography variant="body1" paragraph sx={{ whiteSpace: "pre-wrap" }}>
            {review.comment}
          </Typography>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mt: "auto",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              レビュー投稿日: {formatDate(review.created_at)}
            </Typography>
            <Box>
              {enableSharing && (
                <Tooltip title="Share">
                  <IconButton onClick={handleOpenShareDialog}>
                    <ShareIcon />
                  </IconButton>
                </Tooltip>
              )}
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                href={reviewHref}
                LinkComponent={Link}
              >
                レビューを編集
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>
      {enableSharing && (
        <ShareToTwitterButton
          open={showShareDialog}
          onClose={handleCloseShareDialog}
          gameName={displayName}
          rating={review.overall_score}
          reviewUrl={
            typeof window !== "undefined"
              ? `${window.location.origin}/games/${game.id}`
              : ""
          }
        />
      )}
    </>
  );
};

export default ReviewGameCard;
