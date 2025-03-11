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
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import GroupIcon from "@mui/icons-material/Group";
import LikeButton from "@/components/LikeButton";
import RateReviewIcon from "@mui/icons-material/RateReview";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";
import { usePathname } from "next/navigation";
import GameRating from "@/components/GameRating";
import OverallScoreDisplay from "@/components/OverallScoreDisplay";
import ReviewScoreDisplay from "@/components/ReviewScoreDisplay";
import GameInfo from "@/components/GameInfo";
import GameTags from "@/components/GameTags";
import { getGame } from "@/lib/api";

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
  categories: string[];
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
    reviews_count?: number;
    japanese_image_url?: string;
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

// ゲーム画像コンポーネント
const GameImage = ({
  imageUrl,
  gameName,
}: {
  imageUrl: string;
  gameName: string;
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // 画像URLが無効な場合は最初からエラー状態にする
  useEffect(() => {
    if (!imageUrl || imageUrl === "null" || imageUrl === "undefined") {
      setImageLoading(false);
      setImageError(true);
    }
  }, [imageUrl]);

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        paddingTop: "100%", // アスペクト比1:1
        backgroundColor: "grey.100",
      }}
    >
      {imageUrl &&
      !imageError &&
      imageUrl !== "null" &&
      imageUrl !== "undefined" ? (
        <Image
          src={imageUrl}
          alt={gameName}
          fill
          sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
          style={{
            objectFit: "contain",
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

            // エラー処理
            const target = e.target as HTMLImageElement;
            target.onerror = null; // 無限ループを防ぐ
            target.style.display = "none"; // 画像を非表示に
          }}
        />
      ) : null}

      {/* 画像読み込み中またはエラー時の表示 */}
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
            padding: 2, // パディングを追加
          }}
        >
          {imageLoading && !imageError ? (
            <CircularProgress size={30} />
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center", // テキストを中央揃えに
                width: "100%",
                height: "100%",
              }}
            >
              <ImageNotSupportedIcon
                sx={{ fontSize: 40, color: "text.secondary", mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary" align="center">
                画像なし
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

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

        // デバッグ用：最初のレビューのゲーム情報をログに出力
        if (data.length > 0) {
          console.log("First review game data:", data[0].game);
        }

        // ゲームのjapanese_image_urlが存在しない場合、ゲーム詳細を取得して補完
        const processedData = await Promise.all(
          data.map(async (review: Review) => {
            // ゲーム画像URLがない場合、ゲーム詳細を取得
            if (!review.game.japanese_image_url && review.game.bgg_id) {
              try {
                // ゲーム詳細を取得
                const gameDetails = await getGame(
                  review.game.bgg_id,
                  getAuthHeaders()
                );
                // japanese_image_urlを補完
                review.game.japanese_image_url = gameDetails.japanese_image_url;
                console.log(
                  `Updated game ${review.game.name} with japanese_image_url:`,
                  gameDetails.japanese_image_url
                );
              } catch (error) {
                console.error(
                  `Failed to fetch details for game ${review.game.name}:`,
                  error
                );
              }
            }
            return review;
          })
        );

        if (append) {
          setReviews((prev) => [...prev, ...processedData]);
        } else {
          setReviews(processedData);
          // 最初のページのデータをキャッシュ
          if (pageNum === 1) {
            reviewsCache.data = processedData;
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
                    <GameImage
                      imageUrl={
                        review.game.japanese_image_url || review.game.image_url
                      }
                      gameName={review.game.japanese_name || review.game.name}
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

                      {/* ゲームの平均点と投票数を表示 */}
                      {review.game.average_score > 0 && (
                        <Box sx={{ mb: 1 }}>
                          <OverallScoreDisplay
                            score={review.game.average_score}
                            reviewsCount={review.game.reviews_count || 0}
                            variant="compact"
                          />
                        </Box>
                      )}

                      <GameInfo
                        minPlayers={review.game.min_players}
                        maxPlayers={review.game.max_players}
                        playTime={review.game.play_time}
                      />

                      <GameTags
                        categories={(review.categories || []).slice(0, 3)}
                      />
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
                      <ReviewScoreDisplay
                        score={review.overall_score}
                        userName={review.user.name}
                        variant="default"
                      />
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
