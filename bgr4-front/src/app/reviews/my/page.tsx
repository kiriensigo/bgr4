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
  image_url: string;
}

interface Review {
  id: number;
  user: {
    name: string;
  };
  game: Game;
  overall_score: number;
  short_comment: string;
  created_at: string;
  likes_count: number;
}

export default function MyReviewsPage() {
  const { user, isLoading: authLoading, getAuthHeaders } = useAuth();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 総いいね数を計算
  const totalLikes = reviews.reduce(
    (sum, review) => sum + review.likes_count,
    0
  );

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

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
        setReviews(data);
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setError("レビューの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchMyReviews();
    }
  }, [user, authLoading, router, getAuthHeaders]);

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
            <Grid item xs={12} sm={6} md={4} key={review.id}>
              <GameCard game={review.game} review={review} type="review" />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
