"use client";

import {
  Box,
  Typography,
  Button,
  Card,
  CardMedia,
  CardContent,
  CardActions,
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

interface MyReviewCardProps {
  game: Game;
  review: Review;
  linkHref: string;
  reviewHref: string;
  imageUrl: string | null | undefined;
  displayName: string;
  enableSharing?: boolean;
  onReviewUpdated?: () => void;
}

const MyReviewCard = ({
  game,
  review,
  linkHref,
  reviewHref,
  imageUrl,
  displayName,
  enableSharing = true,
}: MyReviewCardProps) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const handleOpenShareDialog = () => setShowShareDialog(true);
  const handleCloseShareDialog = () => setShowShareDialog(false);

  return (
    <>
      <Card sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Title */}
        <CardContent sx={{ pb: 1 }}>
          <Typography variant="h6" component="h2" noWrap title={displayName}>
            {displayName}
          </Typography>
        </CardContent>

        {/* Image */}
        <Link href={linkHref} style={{ textDecoration: "none" }}>
          <CardMedia
            sx={{
              position: "relative",
              width: "100%",
              paddingTop: "56.25%",
              backgroundColor: "grey.100",
            }}
          >
            {imageUrl && !imageError ? (
              <Image
                src={imageUrl}
                alt={displayName}
                fill
                sizes="(max-width: 600px) 100vw, 250px"
                style={{ objectFit: "cover" }}
                onLoad={() => setImageLoading(false)}
                onError={() => setImageError(true)}
                priority
              />
            ) : (
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
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
          </CardMedia>
        </Link>

        <CardContent
          sx={{ flexGrow: 1, display: "flex", flexDirection: "column", pt: 2 }}
        >
          {/* Score and Rating */}
          <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
            <Typography
              variant="h5"
              sx={{ mr: 1, fontWeight: "bold", color: "primary.main" }}
            >
              {Number(review.overall_score).toFixed(1)}
            </Typography>
            <Rating
              name="read-only"
              value={Number(review.overall_score)}
              precision={0.5}
              readOnly
            />
          </Box>

          {/* Review Date */}
          <Typography
            variant="caption"
            color="text.secondary"
            component="p"
            sx={{ mb: 0 }}
          >
            レビュー投稿日: {formatDate(review.created_at)}
          </Typography>

          {/* Comment */}
          <Typography
            variant="body2"
            sx={{
              mt: 1,
              whiteSpace: "pre-wrap",
              flexGrow: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 3, // Adjust the number of lines shown
              WebkitBoxOrient: "vertical",
            }}
            title={review.comment}
          >
            {review.comment}
          </Typography>
        </CardContent>

        {/* Actions */}
        <CardActions sx={{ justifyContent: "flex-end", p: 1 }}>
          <Button
            size="small"
            startIcon={<ShareIcon />}
            onClick={handleOpenShareDialog}
          >
            シェア
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<EditIcon />}
            href={reviewHref}
          >
            編集
          </Button>
        </CardActions>
      </Card>

      <ShareToTwitterButton
        open={showShareDialog}
        onClose={handleCloseShareDialog}
        gameName={displayName}
        rating={Number(review.overall_score)}
        reviewUrl={
          typeof window !== "undefined"
            ? `${window.location.origin}/games/${game.id}`
            : ""
        }
      />
    </>
  );
};

export default MyReviewCard;
