"use client";

import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Grid,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import GameCard from "@/components/GameCard";

interface Game {
  id: string;
  bgg_id: string;
  name: string;
  japanese_name?: string;
  image_url?: string;
  japanese_image_url?: string;
  reviews_count?: number;
}

interface Review {
  id: number;
  user: {
    id: number;
    name: string;
    image?: string;
  };
  game: Game;
  overall_score: number;
  rule_complexity?: number;
  luck_factor?: number;
  interaction?: number;
  downtime?: number;
  comment: string;
  created_at: string;
  likes_count: number;
  liked_by_current_user?: boolean;
}

export default function MyReviewsPage() {
  const { user, isLoading: authLoading, getAuthHeaders } = useAuth();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 総いいね数を計算
  const totalLikes = Array.isArray(reviews)
    ? reviews.reduce((sum, review) => sum + (review.likes_count || 0), 0)
    : 0;

  const fetchMyReviews = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/reviews/my`,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...getAuthHeaders(),
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("レビューの取得に失敗しました");
      }

      const data = await response.json();
      // 開発環境でのみコンソールログを出力
      if (process.env.NODE_ENV === "development") {
        console.log("API Response:", data);
        console.log("API Response Structure:", {
          hasReviews: !!data.reviews,
          reviewsIsArray: Array.isArray(data.reviews),
          reviewsLength: data.reviews?.length,
          firstReview: data.reviews?.[0],
        });
      }
      const reviewsData = data.reviews || [];
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setError("レビューの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      fetchMyReviews();
    }
  }, [user, authLoading, router, getAuthHeaders]);

  const handleReviewUpdated = () => {
    fetchMyReviews();
  };

  if (authLoading || loading) {
    return (
      <Container>
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ my: 4 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 2 }}>
        マイレビュー
      </Typography>

      <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="h6" component="p" color="primary">
          総いいね数: {totalLikes}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          ({reviews.length} 件のレビュー)
        </Typography>
      </Box>

      {reviews.length === 0 ? (
        <Alert severity="info" sx={{ my: 4 }}>
          まだレビューを投稿していません
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {reviews.map((review) => (
            <Grid item xs={12} sm={6} md={3} key={review.id}>
              <GameCard
                game={review.game}
                review={{
                  id: review.id,
                  overall_score: review.overall_score,
                  comment: review.comment,
                  created_at: review.created_at,
                  likes_count: review.likes_count,
                  user: review.user,
                }}
                type="review"
                onReviewUpdated={handleReviewUpdated}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
