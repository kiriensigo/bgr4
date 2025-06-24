"use client";

import { useState } from "react";
import {
  Container,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Alert,
  CircularProgress,
  Divider,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  IconButton,
} from "@mui/material";
import Link from "next/link";
import SortIcon from "@mui/icons-material/Sort";
import RateReviewIcon from "@mui/icons-material/RateReview";
import ShareIcon from "@mui/icons-material/Share";

// 新しい統一システムのインポート
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { usePagination } from "@/hooks/state/usePagination";
import { UnifiedGameList } from "@/components/ui/GameList/UnifiedGameList";
import SearchPagination from "@/components/ui/SearchPagination";
import { GameImage } from "@/components/ui/GameCard/GameImage";
import LikeButton from "@/components/LikeButton";
import ShareToTwitterButton from "@/components/ShareToTwitterButton";
import { LAYOUT_CONFIG } from "@/styles/layout";
import { DESIGN_TOKENS } from "@/theme/tokens";
import { useAuth } from "@/contexts/AuthContext";

// 設定定数
const PAGE_SIZE_OPTIONS = [12, 24, 36, 48, 72];
const DEFAULT_PAGE_SIZE = 24;

const SORT_OPTIONS = [
  { value: "created_at_desc", label: "投稿日（新しい順）" },
  { value: "created_at_asc", label: "投稿日（古い順）" },
  { value: "overall_score_desc", label: "総合得点（高い順）" },
  { value: "overall_score_asc", label: "総合得点（低い順）" },
  { value: "likes_count_desc", label: "いいね数（多い順）" },
];

// レビュー型定義
interface Review {
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
}

// レビューカードコンポーネント
const ReviewCard = ({ review }: { review: Review }) => {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const { user } = useAuth();

  const imageUrl = review.game.japanese_image_url || review.game.image_url;
  const gameDisplayName = review.game.japanese_name || review.game.name;
  // BGG IDを優先的に使用、なければ内部IDを使用
  const gameId = review.game.bgg_id || review.game.id;

  return (
    <>
      <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <CardActionArea
          component={Link}
          href={`/games/${gameId}`}
          sx={{ flexGrow: 1 }}
        >
          <CardContent sx={{ p: 2 }}>
            {/* ゲーム画像 */}
            <Box sx={{ mb: 2 }}>
              <GameImage
                imageUrl={imageUrl}
                gameName={gameDisplayName}
                aspectRatio="1:1"
              />
            </Box>

            {/* ゲーム名 */}
            <Typography
              variant="h6"
              component="h3"
              noWrap
              sx={{
                fontWeight: DESIGN_TOKENS.typography.fontWeights.semibold,
                mb: 1,
              }}
            >
              {gameDisplayName}
            </Typography>

            {/* 総合得点 */}
            <Typography
              variant="h5"
              component="div"
              sx={{
                color: DESIGN_TOKENS.colors.primary.main,
                fontWeight: DESIGN_TOKENS.typography.fontWeights.bold,
                mb: 1,
              }}
            >
              {Number(review.overall_score).toFixed(1)}点
            </Typography>

            {/* レビューコメント */}
            {review.short_comment && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  mb: 1,
                }}
              >
                {review.short_comment}
              </Typography>
            )}

            {/* レビュー者とアクション */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mt: 2,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                by {review.user.name}
              </Typography>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LikeButton
                  reviewId={review.id}
                  initialLikesCount={review.likes_count}
                  initialIsLiked={review.liked_by_current_user}
                  size="small"
                />
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowShareDialog(true);
                  }}
                >
                  <ShareIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </CardContent>
        </CardActionArea>
      </Card>

      <ShareToTwitterButton
        open={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        gameTitle={gameDisplayName}
        reviewScore={Number(review.overall_score)}
        gameId={gameId}
      />
    </>
  );
};

export default function ReviewsPage() {
  const { user } = useAuth();
  const [sortBy, setSortBy] = useState(SORT_OPTIONS[0].value);

  // 統一ページネーション管理
  const { page, pageSize, setPage, setPageSize } = usePagination({
    defaultPageSize: DEFAULT_PAGE_SIZE,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    syncWithUrl: true,
  });

  // 統一レビューデータフェッチ
  const {
    data: response,
    loading,
    error,
  } = useApiQuery({
    key: ["reviews", page, pageSize, sortBy],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/reviews?page=${page}&per_page=${pageSize}&sort_by=${sortBy}`
      );
      if (!res.ok) throw new Error("レビューの取得に失敗しました");
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5分
    refetchOnWindowFocus: false,
  });

  const reviews = response?.reviews || [];
  const pagination = response?.pagination;

  // ソート変更ハンドラー
  const handleSortChange = (event: SelectChangeEvent) => {
    const newSortBy = event.target.value;
    setSortBy(newSortBy);
    setPage(1); // ソート変更時は1ページ目に戻る
  };

  return (
    <Container maxWidth="lg" sx={{ py: DESIGN_TOKENS.spacing.xl }}>
      {/* タイトル */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mb: DESIGN_TOKENS.spacing.lg,
        }}
      >
        <RateReviewIcon
          sx={{
            mr: 1,
            fontSize: "2rem",
            color: DESIGN_TOKENS.colors.primary.main,
          }}
        />
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: DESIGN_TOKENS.typography.fontWeights.bold,
            color: DESIGN_TOKENS.colors.text.primary,
          }}
        >
          みんなのレビュー
        </Typography>
      </Box>

      {/* ローディング状態 */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* エラー状態 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* レビューリスト表示 */}
      {!loading && !error && reviews && (
        <>
          {/* ソート機能 */}
          <Box
            sx={{
              mb: DESIGN_TOKENS.spacing.lg,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <FormControl sx={{ minWidth: 250 }}>
              <InputLabel id="sort-select-label">並び替え</InputLabel>
              <Select
                labelId="sort-select-label"
                id="sort-select"
                value={sortBy}
                label="並び替え"
                onChange={handleSortChange}
                startAdornment={
                  <SortIcon sx={{ mr: 1, color: "action.active" }} />
                }
              >
                {SORT_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* ページネーション（上） */}
          {pagination && (
            <SearchPagination
              count={pagination.total_pages}
              page={page}
              onChange={(_, value) => setPage(value)}
              size="medium"
              totalItems={pagination.total_count}
              currentPageStart={(page - 1) * pageSize + 1}
              currentPageEnd={Math.min(page * pageSize, pagination.total_count)}
              pageSize={pageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageSizeChange={(_, newSize) => newSize && setPageSize(newSize)}
              showIfSinglePage={true}
            />
          )}

          <Divider sx={{ mb: DESIGN_TOKENS.spacing.lg }} />

          {/* レビューグリッド */}
          <Grid container spacing={LAYOUT_CONFIG.gridSpacing}>
            {reviews.map((review: Review) => (
              <Grid item key={review.id} xs={12} sm={6} md={4} lg={3}>
                <ReviewCard review={review} />
              </Grid>
            ))}
          </Grid>

          {/* ページネーション（下） */}
          {pagination && pagination.total_pages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <SearchPagination
                count={pagination.total_pages}
                page={page}
                onChange={(_, value) => setPage(value)}
                size="large"
                totalItems={pagination.total_count}
                currentPageStart={(page - 1) * pageSize + 1}
                currentPageEnd={Math.min(
                  page * pageSize,
                  pagination.total_count
                )}
                pageSize={pageSize}
                onPageSizeChange={(_, newSize) =>
                  newSize && setPageSize(newSize)
                }
                showPageSizeSelector={false}
                showIfSinglePage={true}
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
}
