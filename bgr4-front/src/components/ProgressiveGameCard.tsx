"use client";

import React, { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { getGame, Game } from "@/lib/api";
import GameCard from "./GameCard";

interface ProgressiveGameCardProps {
  gameId: string;
  initialGameData?: Partial<Game>;
}

export default function ProgressiveGameCard({
  gameId,
  initialGameData,
}: ProgressiveGameCardProps) {
  const [game, setGame] = useState<Game | null>(
    initialGameData ? (initialGameData as Game) : null
  );
  const [error, setError] = useState<string | null>(null);
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: "200px 0px",
  });

  useEffect(() => {
    const fetchGameData = async () => {
      if (inView && !game) {
        try {
          const fullGameData = await getGame(gameId);
          setGame(fullGameData);
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "ゲームデータの取得に失敗しました。"
          );
          console.error(`Failed to fetch game ${gameId}:`, err);
        }
      }
    };

    fetchGameData();
  }, [inView, game, gameId]);
  
  // エラーが発生した場合は何も表示しないか、エラーメッセージを表示する
  if (error) {
    return null;
  }

  // gameがまだない場合はスケルトンを表示
  if (!game) {
    return (
      <div ref={ref}>
        <GameCard type="game" />
      </div>
    );
  }

  return (
    <div ref={ref}>
      <GameCard
        game={game}
        type="game"
        variant="grid"
        useOverallScoreDisplay={true}
        showOverallScoreOverlay={true}
      />
    </div>
  );
}
