"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Rating,
  CardActionArea,
  CardMedia,
} from "@mui/material";
import Link from "next/link";
import RateReviewIcon from "@mui/icons-material/RateReview";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";

interface Review {
  id: number;
  overall_score: number | string;
  short_comment: string;
  created_at: string;
  likes_count: number;
  user: {
    id: number;
    name: string;
  };
  game: {
    id: number;
    bgg_id: string;
    name: string;
    japanese_name?: string;
    image_url?: string;
    min_players?: number;
    max_players?: number;
    play_time?: number;
    average_score?: number;
  };
}

// レビューカード用コンポーネント
const ReviewGameCard = ({ review }: { review: Review }) => {
  const score = Number(review.overall_score);
  const hasImage = review.game.image_url && !review.game.image_url.includes("no-image.png");

  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* ゲーム画像部分 */}
      <CardActionArea
        component={Link}
        href={`/games/${review.game.bgg_id || review.game.id}`}
      >
        {hasImage ? (
          <CardMedia
            component="img"
            height="160"
            image={review.game.image_url}
            alt={review.game.japanese_name || review.game.name}
            sx={{
              objectFit: "cover",
              transition: "transform 0.3s ease-in-out",
              "&:hover": {
                transform: "scale(1.05)",
              },
            }}
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              e.currentTarget.src = "/images/no-image.png";
            }}
          />
        ) : (
          <Box
            sx={{
              height: 160,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "grey.100",
              color: "grey.500",
            }}
          >
            <ImageNotSupportedIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="caption">画像なし</Typography>
          </Box>
        )}
      </CardActionArea>

      {/* ゲーム情報部分 */}
      <CardActionArea
        component={Link}
        href={`/games/${review.game.bgg_id || review.game.id}`}
        sx={{ flexGrow: 1 }}
      >
        <Box sx={{ p: 2, minHeight: 80 }}>
          <Typography variant="h6" sx={{ 
            mb: 1,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            lineHeight: 1.3,
          }}>
            {review.game.japanese_name || review.game.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {review.game.min_players && review.game.max_players && 
              `${review.game.min_players}-${review.game.max_players}人`}
            {review.game.play_time && ` | ${review.game.play_time}分`}
          </Typography>
        </Box>
      </CardActionArea>
      
      {/* レビュー情報部分 */}
      <CardContent sx={{ pt: 1, pb: 2, borderTop: "1px solid #e0e0e0" }}>
        {/* 評価点数 */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Rating
            value={score / 2}
            precision={0.5}
            size="small"
            readOnly
          />
          <Typography variant="h6" color="primary" fontWeight="bold">
            {score.toFixed(1)}点
          </Typography>
        </Box>
        
        {/* 一言コメント */}
        {review.short_comment && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              mb: 1,
              lineHeight: 1.4,
            }}
          >
            {review.short_comment}
          </Typography>
        )}
        
        {/* レビュー投稿者 */}
        <Typography variant="caption" color="text.secondary">
          by {review.user.name}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/reviews/all?page=1&per_page=24`
        );
        if (!res.ok) throw new Error("レビューの取得に失敗しました");
        const data = await res.json();
        setReviews(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "エラーが発生しました");
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
        <RateReviewIcon sx={{ mr: 1, fontSize: "2rem", color: "primary.main" }} />
        <Typography variant="h4" component="h1">
          みんなのレビュー
        </Typography>
      </Box>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <Grid container spacing={3}>
          {reviews.map((review) => (
            <Grid item key={review.id} xs={12} sm={6} md={4} lg={3}>
              <ReviewGameCard review={review} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
