"use client";

import { useEffect, useState } from "react";
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Chip,
  Rating,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";

interface Game {
  id: string;
  bgg_id: string;
  name: string;
  description: string;
  image_url: string;
  min_players: number;
  max_players: number;
  play_time: number;
  average_score: number;
  reviews_count: number;
  average_rule_complexity: number;
}

export default function SearchResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Game[]>([]);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        // TODO: 検索APIの呼び出し
        // const response = await searchGames(searchParams);
        // setResults(response);

        // ダミーデータ（後で削除）
        setResults([
          {
            id: "1",
            bgg_id: "123",
            name: "カタン",
            description: "資源を集めて開拓していく定番ボードゲーム",
            image_url: "https://example.com/catan.jpg",
            min_players: 3,
            max_players: 4,
            play_time: 60,
            average_score: 4.2,
            reviews_count: 15,
            average_rule_complexity: 2.5,
          },
          // ... 他の結果
        ]);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "検索結果の取得に失敗しました"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [searchParams]);

  const handleGameClick = (bggId: string) => {
    router.push(`/games/${bggId}`);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          検索結果
        </Typography>
        <Typography variant="body1" sx={{ mb: 4 }}>
          {results.length}件のゲームが見つかりました
        </Typography>

        <Grid container spacing={3}>
          {results.map((game) => (
            <Grid item xs={12} sm={6} md={4} key={game.id}>
              <Card>
                <CardActionArea onClick={() => handleGameClick(game.bgg_id)}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={game.image_url}
                    alt={game.name}
                    sx={{ objectFit: "contain" }}
                  />
                  <CardContent>
                    <Typography variant="h6" component="div" gutterBottom>
                      {game.name}
                    </Typography>

                    <Box sx={{ mb: 1 }}>
                      <Rating
                        value={game.average_score}
                        precision={0.1}
                        readOnly
                        size="small"
                      />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        component="span"
                        sx={{ ml: 1 }}
                      >
                        ({game.reviews_count}件のレビュー)
                      </Typography>
                    </Box>

                    <Box
                      sx={{ display: "flex", gap: 1, mb: 1, flexWrap: "wrap" }}
                    >
                      <Chip
                        label={`${game.min_players}-${game.max_players}人`}
                        size="small"
                      />
                      <Chip label={`${game.play_time}分`} size="small" />
                      <Chip
                        label={`難易度 ${game.average_rule_complexity}`}
                        size="small"
                      />
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {game.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
}
