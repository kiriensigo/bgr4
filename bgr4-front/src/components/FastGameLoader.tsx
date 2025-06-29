"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Skeleton,
  Alert,
  Chip,
  Rating,
  Divider,
  Fade,
  Grow,
} from "@mui/material";
import Image from "next/image";
import {
  getGameImageAndTitle,
  getGameSpecs,
  getGameDescription,
  getGameStatistics,
  getGameReviews,
  getRelatedGames,
  type Game,
} from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import GroupIcon from "@mui/icons-material/Group";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import StarIcon from "@mui/icons-material/Star";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";

interface FastGameLoaderProps {
  gameId: string;
  onGameLoaded?: (game: Partial<Game>) => void;
  onError?: (error: string) => void;
}

interface LoadingStates {
  imageAndTitle: boolean;
  specs: boolean;
  description: boolean;
  statistics: boolean;
  reviews: boolean;
  relatedGames: boolean;
}

interface GameData {
  // 画像とタイトル
  id?: string | number;
  bgg_id?: string;
  name?: string;
  japanese_name?: string;
  image_url?: string;
  japanese_image_url?: string;

  // スペック情報
  min_players?: number;
  max_players?: number;
  play_time?: number;
  min_play_time?: number;
  weight?: number;
  publisher?: string;
  japanese_publisher?: string;
  designer?: string;
  release_date?: string;
  japanese_release_date?: string;
  categories?: string[];
  mechanics?: string[];
  in_wishlist?: boolean;

  // 説明文
  description?: string;
  japanese_description?: string;

  // 統計情報
  average_rule_complexity?: number;
  average_luck_factor?: number;
  average_interaction?: number;
  average_downtime?: number;
  average_overall_score?: number;
  reviews_count?: number;

  // レビュー
  reviews?: any[];

  // 関連ゲーム
  expansions?: Array<{ id: string; name: string }>;
  baseGame?: { id: string; name: string };
  similarGames?: Game[];
}

// 数値の安全な変換とフォーマット用ヘルパー関数
const formatScore = (score: number | string | null | undefined): string => {
  if (score === null || score === undefined) return "未評価";
  const numScore = typeof score === "string" ? parseFloat(score) : score;
  return isNaN(numScore) ? "未評価" : numScore.toFixed(1);
};

const getNumericValue = (value: any): number => {
  if (value === null || value === undefined) return 0;
  const numValue =
    typeof value === "number" ? value : parseFloat(value.toString());
  return isNaN(numValue) ? 0 : numValue;
};

export default function FastGameLoader({
  gameId,
  onGameLoaded,
  onError,
}: FastGameLoaderProps) {
  const { user, getAuthHeaders } = useAuth();

  // 段階的読み込みの状態管理
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    imageAndTitle: true,
    specs: true,
    description: true,
    statistics: true,
    reviews: true,
    relatedGames: true,
  });

  // データの状態
  const [gameData, setGameData] = useState<GameData>({});
  const [error, setError] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [, setImageError] = useState(false);

  // 段階的読み込みの実装
  const loadGameData = useCallback(async () => {
    if (!gameId) return;

    const headers = user ? getAuthHeaders() : {};

    try {
      // ステップ1: 画像とタイトルを最優先で取得（最高速）
      console.log("Fast Loading Step 1: Fetching image and title...");
      setLoadingStates((prev) => ({ ...prev, imageAndTitle: true }));

      const imageAndTitle = await getGameImageAndTitle(gameId, headers);
      setGameData((prev) => ({ ...prev, ...imageAndTitle }));
      setLoadingStates((prev) => ({ ...prev, imageAndTitle: false }));

      // 基本情報が読み込まれたことを親コンポーネントに通知
      if (onGameLoaded) {
        onGameLoaded(imageAndTitle);
      }

      // ステップ2: 基本スペック情報を取得（高速）
      console.log("Fast Loading Step 2: Fetching specs...");
      setLoadingStates((prev) => ({ ...prev, specs: true }));

      const specs = await getGameSpecs(gameId, headers);
      setGameData((prev) => ({ ...prev, ...specs }));
      setLoadingStates((prev) => ({ ...prev, specs: false }));

      // ステップ3-6: 残りの情報を並行して取得（中速・低速）
      const promises = [
        // 説明文
        getGameDescription(gameId, headers)
          .then((desc) => {
            setGameData((prev) => ({ ...prev, ...desc }));
            setLoadingStates((prev) => ({ ...prev, description: false }));
          })
          .catch((error) => {
            console.error("Failed to fetch description:", error);
            setLoadingStates((prev) => ({ ...prev, description: false }));
          }),

        // 統計情報
        getGameStatistics(gameId, headers)
          .then((stats) => {
            setGameData((prev) => ({ ...prev, ...stats }));
            setLoadingStates((prev) => ({ ...prev, statistics: false }));
          })
          .catch((error) => {
            console.error("Failed to fetch statistics:", error);
            setLoadingStates((prev) => ({ ...prev, statistics: false }));
          }),

        // レビュー
        getGameReviews(gameId, 1, 5, headers)
          .then((reviewData) => {
            setGameData((prev) => ({ ...prev, reviews: reviewData.reviews }));
            setLoadingStates((prev) => ({ ...prev, reviews: false }));
          })
          .catch((error) => {
            console.error("Failed to fetch reviews:", error);
            setLoadingStates((prev) => ({ ...prev, reviews: false }));
          }),

        // 関連ゲーム（最も低速）
        getRelatedGames(gameId, headers)
          .then((related) => {
            setGameData((prev) => ({ ...prev, ...related }));
            setLoadingStates((prev) => ({ ...prev, relatedGames: false }));
          })
          .catch((error) => {
            console.error("Failed to fetch related games:", error);
            setLoadingStates((prev) => ({ ...prev, relatedGames: false }));
          }),
      ];

      await Promise.all(promises);
      console.log("Fast progressive loading completed");
    } catch (error) {
      console.error("Error in fast progressive loading:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "ゲーム情報の取得に失敗しました。";
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
      setLoadingStates({
        imageAndTitle: false,
        specs: false,
        description: false,
        statistics: false,
        reviews: false,
        relatedGames: false,
      });
    }
  }, [gameId, user, getAuthHeaders, onGameLoaded, onError]);

  useEffect(() => {
    loadGameData();
  }, [loadGameData]);

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  // 画像とタイトルが読み込まれていない場合の初期スケルトン
  if (loadingStates.imageAndTitle) {
    return (
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" width="100%" height={300} />
          </Grid>
          <Grid item xs={12} md={8}>
            <Skeleton variant="text" sx={{ fontSize: "2rem", mb: 2 }} />
            <Skeleton variant="text" sx={{ fontSize: "1rem", mb: 1 }} />
            <Skeleton variant="text" sx={{ fontSize: "1rem", mb: 1 }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* ゲーム画像 - 最優先表示 */}
        <Grid item xs={12} md={4}>
          <Fade in={!loadingStates.imageAndTitle} timeout={500}>
            <Paper elevation={3} sx={{ p: 2 }}>
              {gameData.image_url ? (
                <Box sx={{ position: "relative", width: "100%", height: 300 }}>
                  <Image
                    src={gameData.image_url}
                    alt={gameData.name || "ゲーム画像"}
                    fill
                    style={{ objectFit: "contain" }}
                    onLoad={() => setImageLoading(false)}
                    onError={() => {
                      setImageError(true);
                      setImageLoading(false);
                    }}
                  />
                  {imageLoading && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      <CircularProgress />
                    </Box>
                  )}
                </Box>
              ) : (
                <Box
                  sx={{
                    height: 300,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "grey.100",
                  }}
                >
                  <ImageNotSupportedIcon
                    sx={{ fontSize: 60, color: "grey.400" }}
                  />
                </Box>
              )}
            </Paper>
          </Fade>
        </Grid>

        {/* タイトルと基本情報 */}
        <Grid item xs={12} md={8}>
          <Fade in={!loadingStates.imageAndTitle} timeout={700}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                {gameData.japanese_name || gameData.name}
              </Typography>

              {gameData.japanese_name && (
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {gameData.name}
                </Typography>
              )}
            </Box>
          </Fade>

          {/* 基本スペック - 2番目に表示 */}
          <Grow in={!loadingStates.specs} timeout={800}>
            <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
              {gameData.min_players && gameData.max_players && (
                <Chip
                  icon={<GroupIcon />}
                  label={`${gameData.min_players}-${gameData.max_players}人`}
                  variant="outlined"
                />
              )}
              {gameData.play_time && (
                <Chip
                  icon={<AccessTimeIcon />}
                  label={`${gameData.play_time}分`}
                  variant="outlined"
                />
              )}
              {gameData.average_overall_score && (
                <Chip
                  icon={<StarIcon />}
                  label={formatScore(gameData.average_overall_score)}
                  variant="outlined"
                />
              )}
            </Box>
          </Grow>

          {loadingStates.specs && (
            <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
              <Skeleton variant="rectangular" width={100} height={32} />
              <Skeleton variant="rectangular" width={80} height={32} />
              <Skeleton variant="rectangular" width={60} height={32} />
            </Box>
          )}

          {/* 発行者・デザイナー情報 */}
          <Grow in={!loadingStates.specs} timeout={1000}>
            <Box sx={{ mb: 2 }}>
              {gameData.publisher && (
                <Typography variant="body2" color="text.secondary">
                  発行者: {gameData.japanese_publisher || gameData.publisher}
                </Typography>
              )}
              {gameData.designer && (
                <Typography variant="body2" color="text.secondary">
                  デザイナー: {gameData.designer}
                </Typography>
              )}
            </Box>
          </Grow>

          {loadingStates.specs && (
            <Box sx={{ mb: 2 }}>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="50%" />
            </Box>
          )}
        </Grid>

        {/* 説明文セクション */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              ゲーム説明
            </Typography>
            {loadingStates.description ? (
              <Box>
                <Skeleton variant="text" />
                <Skeleton variant="text" />
                <Skeleton variant="text" width="80%" />
              </Box>
            ) : (
              <Fade in={!loadingStates.description} timeout={1200}>
                <Typography variant="body1" paragraph>
                  {gameData.japanese_description ||
                    gameData.description ||
                    "説明文がありません"}
                </Typography>
              </Fade>
            )}
          </Paper>
        </Grid>

        {/* 統計情報セクション */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              評価統計
            </Typography>
            {loadingStates.statistics ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2">統計情報を読み込み中...</Typography>
              </Box>
            ) : (
              <Fade in={!loadingStates.statistics} timeout={1400}>
                <Grid container spacing={2}>
                  {gameData.average_rule_complexity && (
                    <Grid item xs={6} md={3}>
                      <Typography variant="body2" color="text.secondary">
                        ルール複雑度
                      </Typography>
                      <Rating
                        value={getNumericValue(
                          gameData.average_rule_complexity
                        )}
                        readOnly
                        precision={0.1}
                        max={5}
                      />
                    </Grid>
                  )}
                  {gameData.average_luck_factor && (
                    <Grid item xs={6} md={3}>
                      <Typography variant="body2" color="text.secondary">
                        運要素
                      </Typography>
                      <Rating
                        value={getNumericValue(gameData.average_luck_factor)}
                        readOnly
                        precision={0.1}
                        max={5}
                      />
                    </Grid>
                  )}
                  {gameData.average_interaction && (
                    <Grid item xs={6} md={3}>
                      <Typography variant="body2" color="text.secondary">
                        プレイヤー間交流
                      </Typography>
                      <Rating
                        value={getNumericValue(gameData.average_interaction)}
                        readOnly
                        precision={0.1}
                        max={5}
                      />
                    </Grid>
                  )}
                  {gameData.average_downtime && (
                    <Grid item xs={6} md={3}>
                      <Typography variant="body2" color="text.secondary">
                        待ち時間
                      </Typography>
                      <Rating
                        value={getNumericValue(gameData.average_downtime)}
                        readOnly
                        precision={0.1}
                        max={5}
                      />
                    </Grid>
                  )}
                </Grid>
              </Fade>
            )}
          </Paper>
        </Grid>

        {/* レビューセクション */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              最新レビュー
            </Typography>
            {loadingStates.reviews ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2">レビューを読み込み中...</Typography>
              </Box>
            ) : gameData.reviews && gameData.reviews.length > 0 ? (
              <Fade in={!loadingStates.reviews} timeout={1600}>
                <Box>
                  {gameData.reviews.slice(0, 3).map((review, index) => (
                    <Box key={review.id || index} sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        {review.user?.name} -{" "}
                        {new Date(review.created_at).toLocaleDateString()}
                      </Typography>
                      <Rating
                        value={getNumericValue(review.overall_score)}
                        readOnly
                        size="small"
                      />
                      {review.short_comment && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {review.short_comment}
                        </Typography>
                      )}
                      {index < gameData.reviews!.slice(0, 3).length - 1 && (
                        <Divider sx={{ mt: 2 }} />
                      )}
                    </Box>
                  ))}
                </Box>
              </Fade>
            ) : (
              <Typography variant="body2" color="text.secondary">
                レビューがありません
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* 関連ゲームセクション */}
        {(loadingStates.relatedGames ||
          (gameData.expansions && gameData.expansions.length > 0) ||
          (gameData.similarGames && gameData.similarGames.length > 0)) && (
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                関連ゲーム
              </Typography>
              {loadingStates.relatedGames ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2">
                    関連ゲームを読み込み中...
                  </Typography>
                </Box>
              ) : (
                <Fade in={!loadingStates.relatedGames} timeout={1800}>
                  <Box>
                    {gameData.expansions && gameData.expansions.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          拡張版
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                          {gameData.expansions.map(
                            (expansion: any, index: number) => (
                              <Chip
                                key={expansion.id || index}
                                label={expansion.name}
                                size="small"
                                variant="outlined"
                              />
                            )
                          )}
                        </Box>
                      </Box>
                    )}

                    {gameData.similarGames &&
                      gameData.similarGames.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            類似ゲーム
                          </Typography>
                          <Box
                            sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}
                          >
                            {gameData.similarGames
                              .slice(0, 5)
                              .map((similarGame: any, index: number) => (
                                <Chip
                                  key={similarGame.id || index}
                                  label={
                                    similarGame.japanese_name ||
                                    similarGame.name
                                  }
                                  size="small"
                                  variant="outlined"
                                />
                              ))}
                          </Box>
                        </Box>
                      )}
                  </Box>
                </Fade>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
