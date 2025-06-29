"use client";

import React from "react";
import { Box, Grid, Typography, Skeleton } from "@mui/material";
import GameCard from "./GameCard";
import { Game } from "../lib/api";

interface GameGridProps {
  title: string;
  games?: Game[];
  loading: boolean;
}

export default function GameGrid({ title, games, loading }: GameGridProps) {
  const renderSkeletons = () => {
    return Array.from(new Array(8)).map((_, index) => (
      <Grid item key={index} xs={6} sm={4} md={3} lg={3} xl={2}>
        <Skeleton
          variant="rectangular"
          width="100%"
          sx={{ paddingTop: "150%" }}
        />
      </Grid>
    ));
  };

  return (
    <Box sx={{ mb: 6 }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 2 }}>
        {title}
      </Typography>
      <Grid container spacing={2}>
        {loading ? (
          renderSkeletons()
        ) : games && games.length > 0 ? (
          games.map((game) => (
            <Grid
              item
              key={game.id || game.bgg_id}
              xs={6}
              sm={4}
              md={3}
              lg={3}
              xl={2}
            >
              <GameCard game={game} type="game" variant="carousel" />
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Typography variant="body1" color="text.secondary" align="center">
              表示するゲームがありません
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
