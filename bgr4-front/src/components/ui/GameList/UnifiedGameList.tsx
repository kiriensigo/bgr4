import React from "react";
import {
  Grid,
  Container,
  Typography,
  CircularProgress,
  Box,
  Card,
  CardContent,
  CardActionArea,
  Rating,
} from "@mui/material";
import Link from "next/link";
import type { Game } from "@/types/game";

interface UnifiedGameListProps {
  games: Game[];
  variant?: "grid" | "list";
  cardVariant?: "compact" | "full";
  useOverallScoreDisplay?: boolean;
  overallScoreVariant?: "compact" | "full";
  loading?: boolean;
  gridSpacing?: number;

  isLoading?: boolean;
  error?: Error | null;
  emptyMessage?: string;
  gridProps?: any;
}

export function UnifiedGameList({
  games,

  cardVariant = "compact",
  useOverallScoreDisplay = true,
  overallScoreVariant = "compact",
  loading = false,
  gridSpacing = 3,

  isLoading = false,
  error = null,
  emptyMessage = "ゲームが見つかりませんでした",
  gridProps = {},
}: UnifiedGameListProps) {
  const finalLoading = loading || isLoading;

  if (finalLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <Typography color="error" variant="h6">
          エラーが発生しました: {error.message}
        </Typography>
      </Box>
    );
  }

  if (!games || games.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <Typography variant="h6" color="textSecondary">
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  const gridSize =
    cardVariant === "compact"
      ? { xs: 12, sm: 6, md: 4, lg: 3 }
      : { xs: 12, sm: 6, md: 4 };

  return (
    <Container maxWidth="lg">
      <Grid container spacing={gridSpacing} {...gridProps}>
        {games.map((game) => (
          <Grid item {...gridSize} key={game.id}>
            <Card
              sx={{ height: "100%", display: "flex", flexDirection: "column" }}
            >
              <CardActionArea
                component={Link}
                href={`/games/${game.bgg_id || game.id}`}
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography
                    variant="h6"
                    component="h2"
                    gutterBottom
                    sx={{
                      fontSize: cardVariant === "compact" ? "1rem" : "1.25rem",
                      lineHeight: 1.2,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {game.japanese_name || game.name}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    {game.min_players &&
                      game.max_players &&
                      `${game.min_players}-${game.max_players}人`}
                    {game.play_time && ` | ${game.play_time}分`}
                  </Typography>

                  {useOverallScoreDisplay && game.average_score && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {overallScoreVariant === "compact" ? (
                        <Typography
                          variant="body2"
                          color="primary"
                          fontWeight="bold"
                        >
                          ⭐ {Number(game.average_score).toFixed(1)}
                        </Typography>
                      ) : (
                        <>
                          <Rating
                            value={Number(game.average_score) / 2}
                            precision={0.1}
                            size="small"
                            readOnly
                          />
                          <Typography variant="body2" color="primary">
                            {Number(game.average_score).toFixed(1)}
                          </Typography>
                        </>
                      )}
                    </Box>
                  )}
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default UnifiedGameList;
