"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Rating,
  TextField,
  Button,
  Paper,
} from "@mui/material";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";

interface Game {
  id: string;
  bgg_id: string;
  name: string;
  image_url: string;
}

interface Review {
  id: number;
  game: Game;
  overall_score: number;
  short_comment: string;
}

export default function EditReviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading, getAuthHeaders } = useAuth();
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    overall_score: 0,
    short_comment: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    const fetchReview = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/reviews/my/${id}`,
          {
            headers: {
              ...getAuthHeaders(),
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("レビューの取得に失敗しました");
        }

        const data = await response.json();
        setReview(data);
        setFormData({
          overall_score: data.overall_score,
          short_comment: data.short_comment,
        });
      } catch (err) {
        console.error("Error fetching review:", err);
        setError("レビューの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchReview();
    }
  }, [id, user, authLoading, router, getAuthHeaders]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/reviews/my/${id}`,
        {
          method: "PUT",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        throw new Error("レビューの更新に失敗しました");
      }

      router.push("/reviews/my");
    } catch (err) {
      console.error("Error updating review:", err);
      setError("レビューの更新に失敗しました");
    } finally {
      setSubmitting(false);
    }
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

  if (!review) {
    return (
      <Container>
        <Alert severity="error" sx={{ my: 4 }}>
          レビューが見つかりませんでした
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        レビューを修正
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: "flex", gap: 3, mb: 4 }}>
          <Box sx={{ width: 200, position: "relative" }}>
            <Image
              src={review.game.image_url || "/images/no-image.png"}
              alt={review.game.name}
              width={200}
              height={200}
              style={{ objectFit: "contain" }}
            />
          </Box>
          <Box>
            <Typography variant="h5" gutterBottom>
              {review.game.name}
            </Typography>
          </Box>
        </Box>

        <form onSubmit={handleSubmit}>
          <Box sx={{ mb: 3 }}>
            <Typography component="legend" gutterBottom>
              総合評価
            </Typography>
            <Rating
              value={formData.overall_score}
              precision={0.5}
              onChange={(_, newValue) => {
                setFormData((prev) => ({
                  ...prev,
                  overall_score: newValue || 0,
                }));
              }}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="一言コメント"
              multiline
              rows={4}
              value={formData.short_comment}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  short_comment: e.target.value,
                }))
              }
            />
          </Box>

          <Box sx={{ display: "flex", gap: 2 }}>
            <Button variant="contained" type="submit" disabled={submitting}>
              更新する
            </Button>
            <Button
              variant="outlined"
              onClick={() => router.push("/reviews/my")}
              disabled={submitting}
            >
              キャンセル
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
}
