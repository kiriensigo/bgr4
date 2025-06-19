"use client";

import { useEffect, useState } from "react";
import {
  Typography,
  Container,
  Box,
  CircularProgress,
  Skeleton,
} from "@mui/material";
import { getGames } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import GameGrid from "@/components/GameGrid";
import type { Game } from "@/lib/api";
import { shuffleArray } from "@/lib/utils";

// キャッシュキー
const CACHE_KEY = "home_page_data";
const CACHE_EXPIRY = 5 * 60 * 1000; // 5分

export default function Home() {
  const [recentReviewGames, setRecentReviewGames] = useState<Game[]>([]);
  const [newlyRegisteredGames, setNewlyRegisteredGames] = useState<Game[]>([]);
  const [mostReviewedGames, setMostReviewedGames] = useState<Game[]>([]);
  const [randomGames, setRandomGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sectionsLoaded, setSectionsLoaded] = useState({
    recent: false,
    new: false,
    popular: false,
    random: false,
  });

  useEffect(() => {
    // キャッシュからデータを取得
    const checkCache = () => {
      if (typeof window === "undefined") return null;

      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          // キャッシュが有効期限内かチェック
          if (Date.now() - timestamp < CACHE_EXPIRY) {
            return data;
          }
        }
      } catch (e) {
        console.error("キャッシュの読み込みに失敗しました:", e);
      }
      return null;
    };

    const cachedData = checkCache();
    if (cachedData) {
      // キャッシュからデータを設定
      setRecentReviewGames(cachedData.recentReviewGames || []);
      setNewlyRegisteredGames(cachedData.newlyRegisteredGames || []);
      setMostReviewedGames(cachedData.mostReviewedGames || []);
      setRandomGames(cachedData.randomGames || []);
      setSectionsLoaded({
        recent: true,
        new: true,
        popular: true,
        random: true,
      });
      setLoading(false);
      return;
    }

    // 各セクションのデータを並列で取得
    const fetchGames = async () => {
      setLoading(true);

      // 並列でデータを取得
      const fetchRecentReviews = getGames(1, 8, "review_date")
        .then((response) => {
          setRecentReviewGames(response.games);
          setSectionsLoaded((prev) => ({ ...prev, recent: true }));
          return response.games;
        })
        .catch((err) => {
          console.error("レビュー新着ゲームの取得に失敗しました:", err);
          return [];
        });

      const fetchNewlyRegistered = getGames(1, 8, "created_at")
        .then((response) => {
          setNewlyRegisteredGames(response.games);
          setSectionsLoaded((prev) => ({ ...prev, new: true }));
          return response.games;
        })
        .catch((err) => {
          console.error("新規登録ゲームの取得に失敗しました:", err);
          return [];
        });

      const fetchMostReviewed = getGames(1, 8, "reviews_count")
        .then((response) => {
          setMostReviewedGames(response.games);
          setSectionsLoaded((prev) => ({ ...prev, popular: true }));
          return response.games;
        })
        .catch((err) => {
          console.error("レビュー投稿数の多いゲームの取得に失敗しました:", err);
          return [];
        });

      const fetchRandom = getGames(1, 16, "created_at")
        .then((response) => {
          const shuffledGames = shuffleArray(response.games).slice(0, 8);
          setRandomGames(shuffledGames);
          setSectionsLoaded((prev) => ({ ...prev, random: true }));
          return shuffledGames;
        })
        .catch((err) => {
          console.error("ランダムゲームの取得に失敗しました:", err);
          return [];
        });

      try {
        // すべてのリクエストを並列で実行
        const [recent, newGames, popular, random] = await Promise.all([
          fetchRecentReviews,
          fetchNewlyRegistered,
          fetchMostReviewed,
          fetchRandom,
        ]);

        // キャッシュにデータを保存
        try {
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              data: {
                recentReviewGames: recent,
                newlyRegisteredGames: newGames,
                mostReviewedGames: popular,
                randomGames: random,
              },
              timestamp: Date.now(),
            })
          );
        } catch (e) {
          console.error("キャッシュの保存に失敗しました:", e);
        }

        setLoading(false);
      } catch (err) {
        console.error("ゲームの取得に失敗しました:", err);
        setError("ゲームの取得に失敗しました");
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  if (loading) {
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
        <Typography color="error" align="center" sx={{ py: 8 }}>
          {error}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        ボードゲームレビュー
      </Typography>

      {/* レビュー新着ゲーム */}
      <GameGrid
        title="レビュー新着ゲーム"
        games={recentReviewGames}
        loading={!sectionsLoaded.recent}
      />

      {/* 新規登録ゲーム */}
      <GameGrid
        title="新規登録ゲーム"
        games={newlyRegisteredGames}
        loading={!sectionsLoaded.new}
      />

      {/* レビュー投稿数 */}
      <GameGrid
        title="人気のゲーム"
        games={mostReviewedGames}
        loading={!sectionsLoaded.popular}
      />

      {/* ランダム */}
      <GameGrid
        title="おすすめ"
        games={randomGames}
        loading={!sectionsLoaded.random}
      />
    </Container>
  );
}
