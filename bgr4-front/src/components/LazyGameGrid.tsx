import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import GameGrid from './GameGrid';
import { useInView } from '@/hooks/useInView';
import { getGames, Game } from '@/lib/api';

interface LazyGameGridProps {
  title: string;
  sortBy: string;
  page?: number;
  perPage?: number;
}

export default function LazyGameGrid({ 
  title, 
  sortBy, 
  page = 1, 
  perPage = 8 
}: LazyGameGridProps) {
  const { ref, hasBeenInView } = useInView();
  const [games, setGames] = useState<Game[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hasBeenInView && !games) {
      const fetchGames = async () => {
        setLoading(true);
        try {
          console.log(`Loading ${title}...`);
          const response = await getGames(page, perPage, sortBy);
          setGames(response.games);
          console.log(`Loaded ${title} with ${response.games.length} games`);
        } catch (error) {
          console.error(`Error fetching ${title}:`, error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchGames();
    }
  }, [hasBeenInView, games, title, sortBy, page, perPage]);

  return (
    <div ref={ref}>
      {hasBeenInView ? (
        <GameGrid
          title={title}
          games={games}
          loading={loading}
        />
      ) : (
        <Box 
          sx={{ 
            minHeight: '300px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: '2px dashed #ccc',
            borderRadius: 2,
            my: 2
          }}
        >
          <Typography color="text.secondary" variant="h6">
            📜 {title} - スクロールして読み込み
          </Typography>
        </Box>
      )}
    </div>
  );
}