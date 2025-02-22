"use client";

import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Box,
  Rating,
  Avatar,
  Chip,
  CardActionArea,
  Stack,
} from "@mui/material";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import GroupIcon from "@mui/icons-material/Group";

type Review = {
  id: number;
  overall_score: number | string;
  play_time: number;
  rule_complexity: number;
  luck_factor: number;
  interaction: number;
  downtime: number;
  short_comment: string;
  recommended_players: number[];
  mechanics: string[];
  tags: string[];
  custom_tags: string[];
  created_at: string;
  user: {
    id: number;
    name: string;
    image: string;
  };
  game: {
    id: number;
    bgg_id: string;
    name: string;
    japanese_name: string;
    image_url: string;
    min_players: number;
    max_players: number;
    play_time: number;
    average_score: number;
  };
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getAuthHeaders } = useAuth();

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`${API_URL}/api/v1/reviews/all`, {
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("レビューの取得に失敗しました");
        }

        const data = await response.json();
        setReviews(data);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "エラーが発生しました"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [getAuthHeaders]);

  if (loading) {
    return (
      <Container>
        <Typography>読み込み中...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        最近のレビュー
      </Typography>

      <Grid container spacing={3}>
        {reviews.map((review) => (
          <Grid item xs={12} sm={6} md={4} key={review.id}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Link
                href={`/games/${review.game.bgg_id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <CardActionArea>
                  <CardMedia
                    component="img"
                    image={review.game.image_url}
                    alt={review.game.name}
                    sx={{
                      aspectRatio: "1",
                      objectFit: "contain",
                      bgcolor: "grey.100",
                    }}
                  />
                  <CardContent>
                    <Typography
                      gutterBottom
                      variant="h6"
                      component="h2"
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        minHeight: "3.6em",
                      }}
                    >
                      {review.game.japanese_name || review.game.name}
                    </Typography>

                    <Stack spacing={1}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Rating
                          value={Number(review.overall_score)}
                          precision={0.5}
                          size="small"
                          readOnly
                        />
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ ml: 1 }}
                        >
                          {Number(review.overall_score).toFixed(1)}
                        </Typography>
                      </Box>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          minHeight: "3em",
                        }}
                      >
                        {review.short_comment}
                      </Typography>

                      <Box
                        sx={{
                          display: "flex",
                          gap: 2,
                          alignItems: "center",
                          color: "text.secondary",
                          "& .MuiSvgIcon-root": { fontSize: 16 },
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <GroupIcon />
                          <Typography variant="body2">
                            {review.game.min_players}-{review.game.max_players}
                            人
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <AccessTimeIcon />
                          <Typography variant="body2">
                            {review.game.play_time}分
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                        {review.tags.slice(0, 3).map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mt: 1,
                        }}
                      >
                        <Avatar
                          src={review.user.image}
                          alt={review.user.name}
                          sx={{ width: 24, height: 24 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {review.user.name} ・{" "}
                          {new Date(review.created_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Link>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
