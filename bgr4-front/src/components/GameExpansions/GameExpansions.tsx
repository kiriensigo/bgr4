"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  CircularProgress,
  Chip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  getGameExpansions,
  updateGameExpansions,
  type GameExpansion,
  type ExpansionsResponse,
} from "@/lib/api";

interface GameExpansionsProps {
  gameId: string;
  isAdmin?: boolean;
}

export default function GameExpansions({
  gameId,
  isAdmin = false,
}: GameExpansionsProps) {
  const { getAuthHeaders } = useAuth();
  const [expansions, setExpansions] = useState<GameExpansion[]>([]);
  const [baseGames, setBaseGames] = useState<GameExpansion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [expanded, setExpanded] = useState<boolean>(false);
  const [showOnlyRegistered, setShowOnlyRegistered] = useState<boolean>(true);

  // 拡張情報を取得
  const fetchExpansions = async (registeredOnly: boolean = true) => {
    try {
      setLoading(true);
      const data = await getGameExpansions(
        gameId,
        registeredOnly,
        getAuthHeaders()
      );
      setExpansions(data.expansions);
      setBaseGames(data.base_games);
      setError(null);
    } catch (err) {
      console.error("拡張情報の取得に失敗しました:", err);
      setError("拡張情報の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // BGGから拡張情報を更新
  const handleUpdateExpansions = async () => {
    try {
      setUpdating(true);
      const data = await updateGameExpansions(gameId, getAuthHeaders());
      setExpansions(data.expansions);
      setBaseGames(data.base_games);
      setError(null);
    } catch (err) {
      console.error("拡張情報の更新に失敗しました:", err);
      setError("拡張情報の更新に失敗しました");
    } finally {
      setUpdating(false);
    }
  };

  // 表示切り替え
  const handleToggleRegisteredOnly = () => {
    setShowOnlyRegistered(!showOnlyRegistered);
    fetchExpansions(!showOnlyRegistered);
  };

  // 初回読み込み時に拡張情報を取得
  useEffect(() => {
    fetchExpansions(showOnlyRegistered);
  }, [gameId]);

  // 拡張がない場合は何も表示しない
  if (!loading && expansions.length === 0 && baseGames.length === 0 && !error) {
    return null;
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Accordion
        expanded={expanded}
        onChange={() => setExpanded(!expanded)}
        sx={{
          backgroundColor: "background.paper",
          boxShadow: 1,
          borderRadius: 1,
          overflow: "hidden",
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="expansions-content"
          id="expansions-header"
        >
          <Typography variant="h6">
            関連ゲーム
            {!loading && (
              <Chip
                label={`${expansions.length + baseGames.length}個`}
                size="small"
                color="primary"
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {loading ? (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress size={24} />
            </Box>
          ) : error ? (
            <Typography color="error">{error}</Typography>
          ) : (
            <Box>
              {isAdmin && (
                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Button
                    variant="outlined"
                    onClick={handleToggleRegisteredOnly}
                    disabled={updating}
                  >
                    {showOnlyRegistered ? "すべて表示" : "登録済みのみ表示"}
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleUpdateExpansions}
                    disabled={updating}
                  >
                    {updating ? <CircularProgress size={24} /> : "BGGから更新"}
                  </Button>
                </Box>
              )}

              {baseGames.length > 0 && (
                <Box mb={3}>
                  <Typography variant="subtitle1" gutterBottom>
                    ベースゲーム
                  </Typography>
                  <Grid container spacing={2}>
                    {baseGames.map((game) => (
                      <Grid item xs={12} sm={6} md={4} key={game.bgg_id}>
                        <Card sx={{ display: "flex", height: "100%" }}>
                          <CardMedia
                            component="img"
                            sx={{ width: 80, objectFit: "contain" }}
                            image={
                              game.japanese_image_url ||
                              game.image_url ||
                              "/placeholder.png"
                            }
                            alt={game.japanese_name || game.name}
                          />
                          <CardContent sx={{ flex: "1 0 auto", p: 2 }}>
                            <Typography variant="subtitle2" component="div">
                              <Link href={`/games/${game.bgg_id}`}>
                                {game.japanese_name || game.name}
                              </Link>
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {game.relationship_type === "base"
                                ? "ベースゲーム"
                                : game.relationship_type ===
                                  "standalone_expansion"
                                ? "スタンドアロン拡張"
                                : game.relationship_type === "reimplementation"
                                ? "リインプリメンテーション"
                                : "関連ゲーム"}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {expansions.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    拡張
                  </Typography>
                  <Grid container spacing={2}>
                    {expansions.map((expansion) => (
                      <Grid item xs={12} sm={6} md={4} key={expansion.bgg_id}>
                        <Card sx={{ display: "flex", height: "100%" }}>
                          <CardMedia
                            component="img"
                            sx={{ width: 80, objectFit: "contain" }}
                            image={
                              expansion.japanese_image_url ||
                              expansion.image_url ||
                              "/placeholder.png"
                            }
                            alt={expansion.japanese_name || expansion.name}
                          />
                          <CardContent sx={{ flex: "1 0 auto", p: 2 }}>
                            <Typography variant="subtitle2" component="div">
                              {expansion.registered_on_site ? (
                                <Link href={`/games/${expansion.bgg_id}`}>
                                  {expansion.japanese_name || expansion.name}
                                </Link>
                              ) : (
                                expansion.japanese_name || expansion.name
                              )}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {expansion.relationship_type === "expansion"
                                ? "拡張"
                                : expansion.relationship_type ===
                                  "standalone_expansion"
                                ? "スタンドアロン拡張"
                                : "関連ゲーム"}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Box>
          )}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
