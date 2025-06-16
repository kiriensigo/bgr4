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
} from "@mui/material";
import Image from "next/image";
import {
  getGameBasicInfo,
  getGameStatistics,
  getGameReviews,
  getRelatedGames,
  type Game,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import GroupIcon from "@mui/icons-material/Group";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import StarIcon from "@mui/icons-material/Star";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";

interface ProgressiveGameLoaderProps {
  gameId: string;
  onGameLoaded?: (game: Game) => void;
  onError?: (error: string) => void;
}

interface LoadingStates {
  basicInfo: boolean;
  reviews: boolean;
  statistics: boolean;
  relatedGames: boolean;
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

export default function ProgressiveGameLoader({
  gameId,
  onGameLoaded,
  onError,
}: ProgressiveGameLoaderProps) {
  const { user, getAuthHeaders } = useAuth();

  // 段階的読み込みの状態管理
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    basicInfo: true,
    reviews: true,
    statistics: true,
    relatedGames: true,
  });

  // データの状態
  const [game, setGame] = useState<Game | null>(null);
  const [gameStatistics, setGameStatistics] = useState<any>(null);
  const [gameReviews, setGameReviews] = useState<any[]>([]);
  const [relatedGames, setRelatedGames] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // 段階的読み込みの実装
  const loadGameData = useCallback(async () => {
    if (!gameId) return;

    const headers = user ? getAuthHeaders() : {};

    try {
      // ステップ1: 基本情報を取得（最優先）
      console.log("Progressive Loading Step 1: Fetching basic game info...");
      setLoadingStates((prev) => ({ ...prev, basicInfo: true }));

      const basicInfo = await getGameBasicInfo(gameId, headers);
      setGame(basicInfo);
      setLoadingStates((prev) => ({ ...prev, basicInfo: false }));

      // 基本情報が読み込まれたことを親コンポーネントに通知
      if (onGameLoaded) {
        onGameLoaded(basicInfo);
      }

      // ステップ2-4: 残りの情報を並行して取得
      const promises = [
        // 統計情報
        getGameStatistics(gameId, headers)
          .then((stats) => {
            setGameStatistics(stats);
            setLoadingStates((prev) => ({ ...prev, statistics: false }));
          })
          .catch((error) => {
            console.error("Failed to fetch statistics:", error);
            setLoadingStates((prev) => ({ ...prev, statistics: false }));
          }),

        // レビュー
        getGameReviews(gameId, 1, 5, headers)
          .then((reviewData) => {
            setGameReviews(reviewData.reviews);
            setLoadingStates((prev) => ({ ...prev, reviews: false }));
          })
          .catch((error) => {
            console.error("Failed to fetch reviews:", error);
            setLoadingStates((prev) => ({ ...prev, reviews: false }));
          }),

        // 関連ゲーム
        getRelatedGames(gameId, headers)
          .then((related) => {
            setRelatedGames(related);
            setLoadingStates((prev) => ({ ...prev, relatedGames: false }));
          })
          .catch((error) => {
            console.error("Failed to fetch related games:", error);
            setLoadingStates((prev) => ({ ...prev, relatedGames: false }));
          }),
      ];

      await Promise.all(promises);
      console.log("Progressive loading completed");
    } catch (error) {
      console.error("Error in progressive loading:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "ゲーム情報の取得に失敗しました。";
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
      setLoadingStates({
        basicInfo: false,
        reviews: false,
        statistics: false,
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

  if (!game && loadingStates.basicInfo) {
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
            <Skeleton variant="text" sx={{ fontSize: "1rem", mb: 1 }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (!game) return null;

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* ゲーム画像 */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2 }}>
            {game.image_url && (
              <Image
                src={game.image_url}
                alt={game.name}
                width={300}
                height={300}
                style={{ width: "100%", height: "auto" }}
              />
            )}
          </Paper>
        </Grid>

        {/* 基本情報 */}
        <Grid item xs={12} md={8}>
          <Typography variant="h4" component="h1" gutterBottom>
            {game.japanese_name || game.name}
          </Typography>

          {game.japanese_name && (
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {game.name}
            </Typography>
          )}

          {/* 基本スペック */}
          <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
            <Chip
              icon={<GroupIcon />}
              label={`${game.min_players}-${game.max_players}人`}
              variant="outlined"
            />
            <Chip
              icon={<AccessTimeIcon />}
              label={`${game.play_time}分`}
              variant="outlined"
            />
            {gameStatistics?.average_overall_score && (
              <Chip
                icon={<StarIcon />}
                label={formatScore(gameStatistics.average_overall_score)}
                variant="outlined"
              />
            )}
          </Box>

          {/* 説明文 */}
          <Typography variant="body1" paragraph>
            {game.japanese_description || game.description}
          </Typography>

          {/* 発行者・デザイナー情報 */}
          <Box sx={{ mb: 2 }}>
            {game.publisher && (
              <Typography variant="body2" color="text.secondary">
                発行者: {game.japanese_publisher || game.publisher}
              </Typography>
            )}
            {game.designer && (
              <Typography variant="body2" color="text.secondary">
                デザイナー: {game.designer}
              </Typography>
            )}
          </Box>
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
            ) : gameStatistics ? (
              <Grid container spacing={2}>
                {gameStatistics.average_rule_complexity && (
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      ルール複雑度
                    </Typography>
                    <Rating
                      value={getNumericValue(
                        gameStatistics.average_rule_complexity
                      )}
                      readOnly
                      precision={0.1}
                      max={5}
                    />
                  </Grid>
                )}
                {gameStatistics.average_luck_factor && (
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      運要素
                    </Typography>
                    <Rating
                      value={getNumericValue(
                        gameStatistics.average_luck_factor
                      )}
                      readOnly
                      precision={0.1}
                      max={5}
                    />
                  </Grid>
                )}
                {gameStatistics.average_interaction && (
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      プレイヤー間交流
                    </Typography>
                    <Rating
                      value={getNumericValue(
                        gameStatistics.average_interaction
                      )}
                      readOnly
                      precision={0.1}
                      max={5}
                    />
                  </Grid>
                )}
                {gameStatistics.average_downtime && (
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      待ち時間
                    </Typography>
                    <Rating
                      value={getNumericValue(gameStatistics.average_downtime)}
                      readOnly
                      precision={0.1}
                      max={5}
                    />
                  </Grid>
                )}
              </Grid>
            ) : (
              <Typography variant="body2" color="text.secondary">
                統計情報がありません
              </Typography>
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
            ) : gameReviews.length > 0 ? (
              <Box>
                {gameReviews.slice(0, 3).map((review, index) => (
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
                    {index < gameReviews.slice(0, 3).length - 1 && (
                      <Divider sx={{ mt: 2 }} />
                    )}
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                レビューがありません
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* 関連ゲームセクション */}
        {(loadingStates.relatedGames ||
          (relatedGames &&
            (relatedGames.expansions?.length > 0 ||
              relatedGames.similar_games?.length > 0))) && (
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
                <Box>
                  {relatedGames?.expansions?.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        拡張版
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        {relatedGames.expansions.map(
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

                  {relatedGames?.similar_games?.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        類似ゲーム
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        {relatedGames.similar_games
                          .slice(0, 5)
                          .map((similarGame: any, index: number) => (
                            <Chip
                              key={similarGame.id || index}
                              label={
                                similarGame.japanese_name || similarGame.name
                              }
                              size="small"
                              variant="outlined"
                            />
                          ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
