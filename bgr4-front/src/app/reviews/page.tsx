"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Grid,
  Button,
  CircularProgress,
  CardActionArea,
} from "@mui/material";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import RateReviewIcon from "@mui/icons-material/RateReview";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getGame, getAllReviews } from "@/lib/api";
import LikeButton from "@/components/LikeButton";
import SearchPagination from "@/components/SearchPagination";

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
const reviewsCache: {
  data: any[];
  timestamp: number;
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
} = {
  data: [],
  timestamp: 0,
  page: 0,
  pageSize: 0,
  totalPages: 0,
  totalItems: 0,
};
// キャッシュの有効期限（15分に延長）
const CACHE_EXPIRY = 15 * 60 * 1000;

// アプリケーション全体での総レコード数キャッシュ
let globalTotalItems = 0;
let globalTotalItemsTimestamp = 0;

// ページサイズのオプション（ゲーム一覧と同じ）
const PAGE_SIZE_OPTIONS = [12, 24, 36, 48, 72];
// 最大取得数 (制限なし)
const MAX_PAGE_SIZE = 1000;
// 最大ページ数 (制限なし)
const MAX_SAFE_PAGES = 1000;

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URLからパラメータを取得
  const initialPage = parseInt(searchParams.get("page") || "1");
  const initialPageSize = parseInt(searchParams.get("pageSize") || "24");

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // URLを更新する関数
  const updateUrl = useCallback(
    (newPage: number, newPageSize: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", newPage.toString());
      params.set("pageSize", newPageSize.toString());
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  // レビューを取得する関数
  const fetchReviews = useCallback(
    async (pageNum: number, pageSizeNum: number) => {
      try {
        // APIリクエストの前にロード状態にする（ただしキャッシュ使用時は除く）
        const now = Date.now();
        let useCache = false;

        // キャッシュをチェック
        if (
          reviewsCache.data.length > 0 &&
          now - reviewsCache.timestamp < CACHE_EXPIRY &&
          reviewsCache.page === pageNum &&
          reviewsCache.pageSize === pageSizeNum
        ) {
          console.log("Using cached reviews data");
          setReviews(reviewsCache.data);
          setTotalPages(reviewsCache.totalPages);
          setTotalItems(reviewsCache.totalItems);
          useCache = true;

          // キャッシュデータを使用時はすぐにロード状態を解除
          if (loading) {
            setLoading(false);
          }

          return;
        }

        // キャッシュが使用できない場合のみロード状態に設定
        if (!useCache) {
          setLoading(true);
        }

        console.log(
          `Fetching reviews for page ${pageNum}, pageSize ${pageSizeNum}`
        );

        // 修正されたgetAllReviews関数を使用
        const data = await getAllReviews(pageNum, pageSizeNum, {
          cache: "force-cache",
        });

        console.log(`Received ${data.reviews.length} reviews`);
        console.log(
          `Total items: ${data.totalItems}, total pages: ${data.totalPages}`
        );

        // 総数情報を直接設定
        const actualTotalItems = data.totalItems;
        const actualTotalPages = data.totalPages;

        // APIから返された総数情報を設定
        setTotalItems(actualTotalItems);
        setTotalPages(actualTotalPages);

        // グローバルキャッシュを更新
        globalTotalItems = actualTotalItems;
        globalTotalItemsTimestamp = now;

        // レビューアイテムの処理効率化: 並列で一度に画像情報のチェックを行う
        const processedData = await Promise.all(
          data.reviews.map(async (review: Review) => {
            // 必要な場合のみゲーム詳細を取得（条件を厳格に）
            if (
              review.game &&
              review.game.bgg_id &&
              !review.game.japanese_image_url &&
              !review.game.image_url
            ) {
              try {
                const cachedKey = `game_${review.game.bgg_id}`;
                // セッションストレージから既に取得済みのデータを確認
                const cachedGame = sessionStorage.getItem(cachedKey);

                if (cachedGame) {
                  // キャッシュデータを使用
                  const gameData = JSON.parse(cachedGame);
                  review.game.japanese_image_url = gameData.japanese_image_url;
                  review.game.image_url = gameData.image_url;
                } else {
                  // キャッシュがない場合だけAPIを呼び出し
                  const gameDetails = await getGame(
                    review.game.bgg_id,
                    getAuthHeaders()
                  );

                  // 取得したデータをキャッシュに保存
                  if (gameDetails) {
                    review.game.japanese_image_url =
                      gameDetails.japanese_image_url;
                    review.game.image_url = gameDetails.image_url;

                    // セッションストレージにキャッシュ
                    try {
                      sessionStorage.setItem(
                        cachedKey,
                        JSON.stringify({
                          japanese_image_url: gameDetails.japanese_image_url,
                          image_url: gameDetails.image_url,
                        })
                      );
                    } catch (e) {
                      console.warn("Session storage error:", e);
                    }
                  }
                }
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

        setReviews(processedData);
        setError(null); // エラーをクリア

        // データをキャッシュ
        reviewsCache.data = processedData;
        reviewsCache.timestamp = now;
        reviewsCache.page = pageNum;
        reviewsCache.pageSize = pageSizeNum;
        reviewsCache.totalPages = actualTotalPages;
        reviewsCache.totalItems = actualTotalItems;
      } catch (error) {
        console.error("Error fetching reviews:", error);
        setError(
          error instanceof Error ? error.message : "エラーが発生しました"
        );
      } finally {
        setLoading(false);
      }
    },
    [getAuthHeaders]
  );

  // ページネーションのハンドラー
  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setCurrentPage(value);
    updateUrl(value, pageSize);
    // ページトップにスクロール
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ページサイズ変更のハンドラー
  const handlePageSizeChange = (
    event: React.MouseEvent<HTMLElement>,
    newPageSize: number | null
  ) => {
    if (newPageSize === null) return;

    console.log(`Page size changed to ${newPageSize}`);

    // キャッシュをクリア
    reviewsCache.data = [];
    reviewsCache.timestamp = 0;
    reviewsCache.page = 0;
    reviewsCache.pageSize = 0;
    reviewsCache.totalPages = 0;
    reviewsCache.totalItems = 0;

    // グローバルキャッシュの総アイテム数は維持し、ページサイズに基づいて総ページ数を再計算
    if (globalTotalItems > 0) {
      const newTotalPages = Math.ceil(globalTotalItems / newPageSize);
      console.log(
        `Recalculating pages with cached count: ${globalTotalItems} items, new size: ${newPageSize}, pages: ${newTotalPages}`
      );

      setTotalItems(globalTotalItems);
      setTotalPages(newTotalPages);
    } else {
      // グローバルキャッシュがない場合は一旦リセット（取得時に再設定）
      setTotalItems(0);
      setTotalPages(0);
    }

    setPageSize(newPageSize);
    setCurrentPage(1); // ページサイズが変わったら1ページ目に戻る
    updateUrl(1, newPageSize);
  };

  // URLパラメータが変更されたときにステートを更新
  useEffect(() => {
    const urlPage = parseInt(searchParams.get("page") || "1");
    const urlPageSize = parseInt(searchParams.get("pageSize") || "24");

    // 現在のステートと異なる場合のみ更新
    if (urlPage !== currentPage || urlPageSize !== pageSize) {
      // ページサイズが変わった場合は総ページ数を再計算
      if (urlPageSize !== pageSize && globalTotalItems > 0) {
        const recalculatedTotalPages = Math.ceil(
          globalTotalItems / urlPageSize
        );
        console.log(
          `URL changed - recalculating total pages: ${recalculatedTotalPages} with size ${urlPageSize}`
        );
        setTotalPages(recalculatedTotalPages);
      }

      setCurrentPage(urlPage);
      setPageSize(urlPageSize);
    }
  }, [searchParams, currentPage, pageSize, globalTotalItems]);

  // データの取得 - memo化されたfetchReviewsと依存関係を明確に
  useEffect(() => {
    fetchReviews(currentPage, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize]);

  // 現在表示しているアイテムの範囲を計算（totalItemsが変更された場合も再計算）
  const startItem = totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem =
    totalItems > 0 ? Math.min(currentPage * pageSize, totalItems) : 0;

  // コンポーネントマウント時に総レコード数を取得 - getAllReviewsを使用する方法に修正
  useEffect(() => {
    // 総レコード数が未設定でキャッシュも無効な場合のみ実行
    const now = Date.now();
    const cacheExpired = now - globalTotalItemsTimestamp > CACHE_EXPIRY;

    if (
      totalItems <= 0 &&
      (globalTotalItems <= 0 || cacheExpired) &&
      !loading
    ) {
      // 最大のページサイズでAPIから総数を取得（効率化のため）
      const fetchCount = async () => {
        try {
          console.log("Fetching total count on mount...");
          const size = PAGE_SIZE_OPTIONS[PAGE_SIZE_OPTIONS.length - 1];
          const data = await getAllReviews(1, size);

          if (data.totalItems > 0) {
            console.log(`Total reviews from API: ${data.totalItems}`);

            // 上限なしでAPIから返された総数を使用
            const totalCount = data.totalItems;

            // グローバルキャッシュを更新
            globalTotalItems = totalCount;
            globalTotalItemsTimestamp = now;

            // 現在のページサイズに基づいてページ数を計算
            const calculatedPages = Math.ceil(totalCount / pageSize);
            console.log(
              `Setting totalItems: ${totalCount}, totalPages: ${calculatedPages}`
            );

            setTotalItems(totalCount);
            setTotalPages(calculatedPages);
          }
        } catch (error) {
          console.error("Error fetching total count:", error);
        }
      };

      fetchCount();
    } else if (globalTotalItems > 0 && !cacheExpired && totalItems <= 0) {
      // キャッシュされた総数を使用
      console.log(`Using cached global total: ${globalTotalItems}`);

      // 現在のページサイズに基づいてページ数を計算（上限なし）
      const calculatedPages = Math.ceil(globalTotalItems / pageSize);
      console.log(
        `Using cached count: ${globalTotalItems}, pages: ${calculatedPages}`
      );

      setTotalItems(globalTotalItems);
      setTotalPages(calculatedPages);
    }
  }, [loading, totalItems, pageSize]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          最近のレビュー
        </Typography>
        <Grid container spacing={3}>
          {[...Array(pageSize > 12 ? 12 : pageSize)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card sx={{ height: "100%" }}>
                <Box
                  sx={{
                    width: "100%",
                    paddingTop: "75%",
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
          {/* ゲーム一覧と同じページネーションを使用 */}
          <SearchPagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            size="medium"
            totalItems={undefined}
            currentPageStart={startItem}
            currentPageEnd={endItem}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageSizeChange={handlePageSizeChange}
            showPageSizeSelector={true}
            showIfSinglePage={true}
            showFirstButton
            showLastButton
          />

          {/* ゲームカード一覧 */}
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
                    href={`/games/${review.game.id}`}
                    style={{ textDecoration: "none" }}
                  >
                    <CardActionArea>
                      <Box sx={{ position: "relative", pt: "75%" }}>
                        <Image
                          src={
                            review.game.japanese_image_url ||
                            review.game.image_url ||
                            "/images/no-image.png"
                          }
                          alt={review.game.japanese_name || review.game.name}
                          fill
                          style={{ objectFit: "contain" }}
                        />
                      </Box>
                      <CardContent sx={{ pt: 1, pb: 1 }}>
                        <Typography variant="subtitle1" component="div" noWrap>
                          {review.game.japanese_name || review.game.name}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Link>
                  <CardContent sx={{ pt: 0, pb: 1, flexGrow: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <Link
                        href={`/users/${review.user.id}`}
                        style={{ textDecoration: "none" }}
                      >
                        <Typography variant="body2" color="primary">
                          {review.user.name}
                        </Typography>
                      </Link>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ ml: 1 }}
                      >
                        評価:{" "}
                        {typeof review.overall_score === "number"
                          ? review.overall_score.toFixed(1)
                          : review.overall_score}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      {review.short_comment}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {new Date(review.created_at).toLocaleDateString(
                          "ja-JP"
                        )}
                      </Typography>
                      <LikeButton
                        reviewId={review.id}
                        initialLikesCount={review.likes_count}
                        initialLikedByUser={review.liked_by_current_user}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* 下部ページネーション - 常に表示 */}
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <SearchPagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              size="medium"
              totalItems={undefined}
              currentPageStart={startItem}
              currentPageEnd={endItem}
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
              showPageSizeSelector={false}
              showIfSinglePage={true}
              showFirstButton
              showLastButton
            />
          </Box>
        </>
      )}
    </Container>
  );
}
