"use client";

import { useState, useEffect } from "react";
import { Box, Typography, Paper, Rating, Grid } from "@mui/material";
import { formatDate } from "@/lib/utils";
import LikeButton from "./LikeButton";
import Link from "next/link";
import SearchPagination from "./SearchPagination";

interface Review {
  id: number;
  user?: {
    id?: number;
    name?: string;
    image?: string;
  };
  overall_score: number | string;
  short_comment: string;
  created_at: string;
  likes_count: number;
  liked_by_current_user: boolean;
}

interface ReviewListProps {
  reviews: Review[];
  initialPageSize?: number;
}

const formatScore = (score: number | string | null | undefined): string => {
  if (score === null || score === undefined) return "未評価";
  const numScore = typeof score === "string" ? parseFloat(score) : score;
  return Number.isNaN(numScore) ? "未評価" : numScore.toFixed(1);
};

// ページサイズのオプション（最大100件まで）
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];

export default function ReviewList({
  reviews,
  initialPageSize = 10,
}: ReviewListProps) {
  // レビューが配列でない場合は空の配列として扱う
  const validReviews = Array.isArray(reviews) ? reviews : [];

  // ページネーション用のステート
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // 有効なレビューのみをフィルタリング
  const filteredReviews = validReviews.filter((review) => {
    return review && review.user && review.user.id && review.user.name;
  });

  // 表示するレビューをページネーション
  const totalReviews = filteredReviews.length;
  const totalPages = Math.ceil(totalReviews / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalReviews);
  const currentPageReviews = filteredReviews.slice(startIndex, endIndex);

  // ページが変わったときの処理
  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    newPage: number
  ) => {
    setCurrentPage(newPage);
    // ページトップにスクロール
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ページサイズが変わったときの処理
  const handlePageSizeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newPageSize: number | null
  ) => {
    if (newPageSize === null) return;
    setPageSize(newPageSize);
    setCurrentPage(1); // ページサイズが変わったら1ページ目に戻る
  };

  // ページ数が変わったときにcurrentPageを調整
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages, pageSize]);

  // レビューが存在しない場合
  if (!filteredReviews || filteredReviews.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: "center", bgcolor: "grey.50" }}>
        <Typography variant="body1" color="text.secondary">
          まだレビューがありません。最初のレビューを書いてみませんか？
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* 常にページネーションを表示（ページが1つでも必要なときに） */}
      {totalReviews > 0 && (
        <SearchPagination
          count={totalPages}
          page={currentPage}
          onChange={handlePageChange}
          size="small"
          totalItems={totalReviews}
          currentPageStart={startIndex + 1}
          currentPageEnd={endIndex}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          onPageSizeChange={handlePageSizeChange}
          showPageSizeSelector={true}
          showIfSinglePage={true} // 1ページでも常に表示
          showFirstButton
          showLastButton
        />
      )}

      <Grid container spacing={1} sx={{ mt: 1 }}>
        {currentPageReviews.map((review) => {
          const numScore =
            typeof review.overall_score === "string"
              ? parseFloat(review.overall_score)
              : review.overall_score;

          return (
            <Grid item xs={12} key={review.id}>
              <Paper
                sx={{
                  p: 1.5,
                  "&:hover": {
                    bgcolor: "grey.50",
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 0.5,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Link
                      href={`/users/${review.user?.id}`}
                      style={{ textDecoration: "none" }}
                    >
                      <Typography
                        variant="subtitle2"
                        color="primary"
                        sx={{
                          cursor: "pointer",
                          "&:hover": {
                            textDecoration: "underline",
                          },
                        }}
                      >
                        {review.user?.name}
                      </Typography>
                    </Link>
                    <Typography variant="body2">
                      {formatScore(review.overall_score)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Rating
                      value={numScore / 2}
                      precision={0.5}
                      readOnly
                      size="small"
                    />
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  {review.short_comment}
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <LikeButton
                    reviewId={review.id}
                    initialLikesCount={review.likes_count}
                    initialLikedByUser={review.liked_by_current_user}
                  />
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* 常に下部のページネーションも表示 */}
      {totalReviews > 0 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <SearchPagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            size="small"
            showPageSizeSelector={false}
            showIfSinglePage={true} // 1ページでも常に表示
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Box>
  );
}
