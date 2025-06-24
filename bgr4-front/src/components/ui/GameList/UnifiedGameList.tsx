import React from 'react';
import { Grid, Container, Typography, CircularProgress, Box } from '@mui/material';
import { GameCard } from '@/components/GameCard';
import type { Game } from '@/types/game';

interface UnifiedGameListProps {
  games: Game[];
  isLoading?: boolean;
  error?: Error | null;
  emptyMessage?: string;
  gridProps?: any;
}

export function UnifiedGameList({
  games,
  isLoading = false,
  error = null,
  emptyMessage = 'ゲームが見つかりませんでした',
  gridProps = {}
}: UnifiedGameListProps) {
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography color="error" variant="h6">
          エラーが発生しました: {error.message}
        </Typography>
      </Box>
    );
  }

  if (!games || games.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography variant="h6" color="textSecondary">
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Grid container spacing={3} {...gridProps}>
        {games.map((game) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={game.id}>
            <GameCard game={game} />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default UnifiedGameList;
