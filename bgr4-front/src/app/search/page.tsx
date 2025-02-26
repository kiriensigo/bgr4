"use client";

import { useState } from "react";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { searchGames } from "@/lib/api";
import SearchIcon from "@mui/icons-material/Search";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import GroupIcon from "@mui/icons-material/Group";
import Link from "next/link";
import { EvaluationSection } from "@/components/GameEvaluationForm/EvaluationSection";
import { containerStyle, cardStyle, LAYOUT_CONFIG } from "@/styles/layout";
import { PLAYER_COUNT_OPTIONS } from "@/components/GameEvaluationForm/constants";

interface SearchParams {
  keyword: string;
  min_players: number | null;
  max_players: number | null;
  playTimeMin: number;
  playTimeMax: number;
  complexityMin: number;
  complexityMax: number;
  mechanics: string[];
  tags: string[];
  totalScoreMin: number;
  totalScoreMax: number;
  interactionMin: number;
  interactionMax: number;
  luckFactorMin: number;
  luckFactorMax: number;
  downtimeMin: number;
  downtimeMax: number;
  recommendedPlayers: string[];
}

export default function SearchPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // 検索条件の状態
  const [searchParams, setSearchParams] = useState<SearchParams>({
    keyword: "",
    min_players: null,
    max_players: null,
    playTimeMin: 1,
    playTimeMax: 5,
    complexityMin: 1,
    complexityMax: 5,
    mechanics: [],
    tags: [],
    totalScoreMin: 0,
    totalScoreMax: 10,
    interactionMin: 1,
    interactionMax: 5,
    luckFactorMin: 1,
    luckFactorMax: 5,
    downtimeMin: 1,
    downtimeMax: 5,
    recommendedPlayers: [],
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // APIパラメータの変換
      const apiParams = {
        keyword: searchParams.keyword,
        min_players: searchParams.min_players,
        max_players: searchParams.max_players,
        play_time_min: searchParams.playTimeMin,
        play_time_max: searchParams.playTimeMax,
        complexity_min: searchParams.complexityMin,
        complexity_max: searchParams.complexityMax,
        total_score_min: searchParams.totalScoreMin,
        total_score_max: searchParams.totalScoreMax,
        interaction_min: searchParams.interactionMin,
        interaction_max: searchParams.interactionMax,
        luck_factor_min: searchParams.luckFactorMin,
        luck_factor_max: searchParams.luckFactorMax,
        downtime_min: searchParams.downtimeMin,
        downtime_max: searchParams.downtimeMax,
        mechanics: searchParams.mechanics,
        tags: searchParams.tags,
        recommended_players: searchParams.recommendedPlayers,
      };

      const results = await searchGames(apiParams);
      setSearchResults(results);
      console.log("Search results:", results);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "検索中にエラーが発生しました"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluationChange = (name: string, value: any) => {
    setSearchParams((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Container maxWidth={false}>
      <Box sx={containerStyle}>
        <Link href="/games" style={{ textDecoration: "none" }}>
          <Button variant="outlined" sx={{ mb: 2 }}>
            ← 戻る
          </Button>
        </Link>

        <Typography variant="h4" component="h1" gutterBottom>
          ボードゲームを検索
        </Typography>

        <Card elevation={3} sx={cardStyle}>
          <CardContent>
            <form onSubmit={handleSearch}>
              <Grid container spacing={LAYOUT_CONFIG.gridSpacing}>
                {/* キーワード検索 */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="キーワード"
                    value={searchParams.keyword}
                    onChange={(e) =>
                      setSearchParams({
                        ...searchParams,
                        keyword: e.target.value,
                      })
                    }
                    placeholder="ゲーム名、説明文で検索"
                  />
                </Grid>

                {/* プレイ可能人数 */}
                <Grid item xs={12}>
                  <Typography
                    variant="subtitle1"
                    fontWeight="medium"
                    gutterBottom
                  >
                    プレイ可能人数
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                    <TextField
                      type="number"
                      label="最小人数"
                      value={searchParams.min_players || ""}
                      onChange={(e) =>
                        setSearchParams({
                          ...searchParams,
                          min_players: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                      InputProps={{ inputProps: { min: 1 } }}
                      sx={{ width: 120 }}
                    />
                    <Typography>〜</Typography>
                    <TextField
                      type="number"
                      label="最大人数"
                      value={searchParams.max_players || ""}
                      onChange={(e) =>
                        setSearchParams({
                          ...searchParams,
                          max_players: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                      InputProps={{ inputProps: { min: 1 } }}
                      sx={{ width: 120 }}
                    />
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: "block" }}
                  >
                    ※ゲームのルールで定められた人数範囲で検索します
                  </Typography>
                </Grid>

                {/* 評価セクション */}
                <Grid item xs={12}>
                  <EvaluationSection
                    values={searchParams}
                    onChange={handleEvaluationChange}
                    isSearchMode={true}
                  />
                </Grid>

                {/* エラーメッセージ */}
                {error && (
                  <Grid item xs={12}>
                    <Alert severity="error">{error}</Alert>
                  </Grid>
                )}

                {/* 検索ボタン */}
                <Grid item xs={12}>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                      startIcon={
                        loading ? (
                          <CircularProgress size={20} />
                        ) : (
                          <SearchIcon />
                        )
                      }
                      sx={{ minWidth: 120 }}
                    >
                      {loading ? "検索中..." : "検索"}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => router.back()}
                      disabled={loading}
                    >
                      戻る
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>

        {/* 検索結果 */}
        {searchResults.length > 0 && (
          <Box sx={{ mt: LAYOUT_CONFIG.sectionSpacing }}>
            <Typography variant="h5" gutterBottom>
              検索結果
            </Typography>
            <Grid container spacing={LAYOUT_CONFIG.gridSpacing}>
              {searchResults.map((game) => (
                <Grid item xs={12} sm={6} md={4} key={game.id}>
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      transition:
                        "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: 4,
                      },
                    }}
                  >
                    <CardActionArea
                      component={Link}
                      href={`/games/${game.bgg_id}`}
                      sx={{ flexGrow: 1 }}
                    >
                      <CardMedia
                        component="img"
                        image={game.image_url || "/images/no-image.png"}
                        alt={game.name}
                        sx={{
                          aspectRatio: "1",
                          objectFit: "contain",
                          bgcolor: "grey.100",
                        }}
                      />
                      <CardContent>
                        <Typography
                          gutterBottom
                          variant="h6"
                          component="h2"
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            minHeight: "3.6em",
                          }}
                        >
                          {game.name}
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            mb: 1,
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <GroupIcon sx={{ mr: 0.5, fontSize: "small" }} />
                            <Typography variant="body2" color="text.secondary">
                              {game.min_players}-{game.max_players}人
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <AccessTimeIcon
                              sx={{ mr: 0.5, fontSize: "small" }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              {game.play_time}分
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Box>
    </Container>
  );
}
