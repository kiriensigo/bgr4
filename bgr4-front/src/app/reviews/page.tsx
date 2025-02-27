"use client";

import { useEffect, useState, useCallback } from "react";
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
  Divider,
  Button,
  CircularProgress,
} from "@mui/material";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import GroupIcon from "@mui/icons-material/Group";
import LikeButton from "@/components/LikeButton";
import RateReviewIcon from "@mui/icons-material/RateReview";
import { usePathname } from "next/navigation";

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
  likes_count: number;
  liked_by_current_user: boolean;
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

// キャッシュ用のオブジェクト
const reviewsCache: { data: any[]; timestamp: number; page: number } = {
  data: [],
  timestamp: 0,
  page: 0,
};
// キャッシュの有効期限（5分）
const CACHE_EXPIRY = 5 * 60 * 1000;

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function ReviewsPage() {
  const { getAuthHeaders } = useAuth();
  const pathname = usePathname();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const PER_PAGE = 12;

  const fetchReviews = useCallback(
    async (pageNum: number, append: boolean = false) => {
      try {
        setLoadingMore(append);
        if (!append) setLoading(true);

        // 最初のページでキャッシュをチェック
        const now = Date.now();
        if (
          pageNum === 1 &&
          !append &&
          reviewsCache.data.length > 0 &&
          now - reviewsCache.timestamp < CACHE_EXPIRY
        ) {
          console.log("Using cached reviews data");
          setReviews(reviewsCache.data);
          setLoading(false);
          setLoadingMore(false);
          return;
        }

        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
          }/api/v1/reviews/all?page=${pageNum}&per_page=${PER_PAGE}`,
          {
            headers: {
              ...getAuthHeaders(),
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("レビューの取得に失敗しました");
        }

        const data = await response.json();

        if (append) {
          setReviews((prev) => [...prev, ...data]);
        } else {
          setReviews(data);
          // 最初のページのデータをキャッシュ
          if (pageNum === 1) {
            reviewsCache.data = data;
            reviewsCache.timestamp = now;
            reviewsCache.page = 1;
          }
        }

        // レビューが1ページ分未満なら、これ以上データがないと判断
        setHasMore(data.length === PER_PAGE);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "エラーが発生しました"
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [getAuthHeaders]
  );

  useEffect(() => {
    fetchReviews(1);
  }, [fetchReviews]);

  // 無限スクロールの実装
  useEffect(() => {
    const handleScroll = () => {
      if (loading || loadingMore || !hasMore) return;

      const scrollPosition = window.innerHeight + window.scrollY;
      const threshold = document.documentElement.scrollHeight - 1000; // 下から1000pxの位置で次を読み込む

      if (scrollPosition > threshold) {
        setPage((prev) => {
          const nextPage = prev + 1;
          fetchReviews(nextPage, true);
          return nextPage;
        });
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, loadingMore, hasMore, fetchReviews]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          最近のレビュー
        </Typography>
        <Grid container spacing={3}>
          {[...Array(6)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card sx={{ height: "100%" }}>
                <Box
                  sx={{
                    width: "100%",
                    paddingTop: "100%",
                    bgcolor: "grey.200",
                    animation: "pulse 1.5s infinite",
                    position: "relative",
                  }}
                />
                <CardContent>
                  <Box
                    sx={{
                      height: 24,
                      width: "80%",
                      bgcolor: "grey.200",
                      mb: 2,
                      animation: "pulse 1.5s infinite",
                    }}
                  />
                  <Box
                    sx={{
                      height: 20,
                      width: "60%",
                      bgcolor: "grey.200",
                      animation: "pulse 1.5s infinite",
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          最近のレビュー
        </Typography>
        <Box
          sx={{
            textAlign: "center",
            py: 8,
            backgroundColor: "error.light",
            borderRadius: 2,
            color: "error.contrastText",
          }}
        >
          <Typography variant="h6" gutterBottom>
            {error}
          </Typography>
          <Button
            variant="contained"
            onClick={() => window.location.reload()}
            sx={{ mt: 2, bgcolor: "error.dark" }}
          >
            再読み込み
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        最近のレビュー
      </Typography>

      {reviews.length === 0 && !loading ? (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
            backgroundColor: "grey.100",
            borderRadius: 2,
          }}
        >
          <RateReviewIcon
            sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
          />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            まだレビューがありません
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            最初のレビューを投稿してみましょう！
          </Typography>
          <Button
            variant="contained"
            component={Link}
            href="/games"
            sx={{ mt: 2 }}
          >
            ゲームを探す
          </Button>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {reviews.map((review) => (
              <Grid item xs={12} sm={6} md={4} key={review.id}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    transition:
                      "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardActionArea
                    component={Link}
                    href={`/games/${review.game.bgg_id}`}
                    sx={{ flexGrow: 1 }}
                  >
                    <CardMedia
                      component="img"
                      image={review.game.image_url || "/images/no-image.png"}
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

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
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

                      <Box
                        sx={{
                          display: "flex",
                          gap: 0.5,
                          flexWrap: "wrap",
                          mt: 1,
                        }}
                      >
                        {review.tags.slice(0, 3).map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </CardActionArea>

                  <CardContent sx={{ pt: 0 }}>
                    <Divider sx={{ my: 1 }} />

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <Rating
                          value={Number(review.overall_score)}
                          precision={0.5}
                          size="small"
                          readOnly
                        />
                        <Typography variant="body2" color="text.secondary">
                          {Number(review.overall_score).toFixed(1)}
                        </Typography>
                      </Box>
                      <LikeButton
                        reviewId={review.id}
                        initialLikesCount={review.likes_count}
                        initialLikedByUser={review.liked_by_current_user}
                      />
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
                        mb: 1,
                      }}
                    >
                      {review.short_comment}
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Avatar
                        src={review.user.image}
                        alt={review.user.name}
                        sx={{ width: 24, height: 24 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        <Link
                          href={`/users/${review.user.id}`}
                          style={{ textDecoration: "none", color: "inherit" }}
                        >
                          <span
                            style={{ cursor: "pointer" }}
                            className="hover-underline"
                          >
                            {review.user.name}
                          </span>
                        </Link>
                        {" ・ "}
                        {new Date(review.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {loadingMore && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          )}
        </>
      )}
    </Container>
  );
}
