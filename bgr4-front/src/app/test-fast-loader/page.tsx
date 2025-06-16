"use client";

import { useState } from "react";
import { Container, Typography, Box, Paper, Button } from "@mui/material";
import FastGameLoader from "@/components/FastGameLoader";
import { Game } from "@/lib/api";

export default function TestFastLoaderPage() {
  const [gameId, setGameId] = useState("1077158561237663745"); // Ark Nova
  const [loadedGame, setLoadedGame] = useState<Partial<Game> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGameLoaded = (game: Partial<Game>) => {
    console.log("Game loaded:", game);
    setLoadedGame(game);
    setError(null);
  };

  const handleError = (errorMessage: string) => {
    console.error("Error loading game:", errorMessage);
    setError(errorMessage);
    setLoadedGame(null);
  };

  const testGameIds = [
    { id: "1077158561237663745", name: "Ark Nova" },
    { id: "1077158558854545409", name: "Pandemic Legacy: Season 1" },
    { id: "1077158555837759489", name: "Brass: Birmingham" },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        FastGameLoader テストページ
      </Typography>

      <Paper elevation={2} sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          テスト用ゲームID
        </Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          {testGameIds.map((game) => (
            <Button
              key={game.id}
              variant={gameId === game.id ? "contained" : "outlined"}
              onClick={() => {
                setGameId(game.id);
                setLoadedGame(null);
                setError(null);
              }}
            >
              {game.name}
            </Button>
          ))}
        </Box>
      </Paper>

      {error && (
        <Paper elevation={2} sx={{ p: 2, mb: 4, bgcolor: "error.light" }}>
          <Typography variant="h6" color="error.contrastText">
            エラー
          </Typography>
          <Typography color="error.contrastText">{error}</Typography>
        </Paper>
      )}

      {loadedGame && (
        <Paper elevation={2} sx={{ p: 2, mb: 4, bgcolor: "success.light" }}>
          <Typography variant="h6" color="success.contrastText">
            読み込み完了
          </Typography>
          <Typography color="success.contrastText">
            ゲーム名: {loadedGame.japanese_name || loadedGame.name}
          </Typography>
          <Typography color="success.contrastText">
            BGG ID: {loadedGame.bgg_id}
          </Typography>
        </Paper>
      )}

      <Typography variant="h5" gutterBottom>
        現在のテスト: {testGameIds.find((g) => g.id === gameId)?.name}
      </Typography>

      <FastGameLoader
        key={gameId} // gameIdが変わったときにコンポーネントを再マウント
        gameId={gameId}
        onGameLoaded={handleGameLoaded}
        onError={handleError}
      />
    </Container>
  );
}
