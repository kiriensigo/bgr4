"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Chip,
  Tooltip,
  Pagination,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
} from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { searchGames } from "@/lib/api";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import GroupIcon from "@mui/icons-material/Group";
import ShareIcon from "@mui/icons-material/Share";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import Link from "next/link";
import { containerStyle, cardStyle, LAYOUT_CONFIG } from "@/styles/layout";

// 表示件数のオプション
const PAGE_SIZE_OPTIONS = [12, 24, 36];

// 数値を安全にフォーマットする関数
const formatNumber = (value: any, decimals = 1): string => {
  if (value === null || value === undefined) return "0";
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num) ? "0" : num.toFixed(decimals);
};

export default function SearchResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchCriteria, setSearchCriteria] = useState<Record<string, string>>(
    {}
  );
  const [copied, setCopied] = useState(false);

  // ページネーション用の状態
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  // URLパラメータから検索条件を取得して検索を実行
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError(null);

      try {
        // URLパラメータを取得
        const params: Record<string, string> = {};
        searchParams.forEach((value, key) => {
          params[key] = value;
        });

        // 検索条件を保存（表示用）
        setSearchCriteria(params);

        // 配列パラメータを処理
        const apiParams = { ...params };
        if (params.mechanics) apiParams.mechanics = params.mechanics.split(",");
        if (params.tags) apiParams.tags = params.tags.split(",");
        if (params.recommended_players)
          apiParams.recommended_players = params.recommended_players.split(",");

        // 数値パラメータを処理
        [
          "min_players",
          "max_players",
          "play_time_min",
          "play_time_max",
          "complexity_min",
          "complexity_max",
          "total_score_min",
          "total_score_max",
          "interaction_min",
          "interaction_max",
          "luck_factor_min",
          "luck_factor_max",
          "downtime_min",
          "downtime_max",
        ].forEach((key) => {
          if (apiParams[key]) apiParams[key] = Number(apiParams[key]);
        });

        console.log("検索パラメータ:", apiParams);
        const results = await searchGames(apiParams);
        setSearchResults(results);

        // 総ページ数を計算
        setTotalPages(Math.ceil(results.length / pageSize));

        // ページを1に戻す
        setPage(1);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "検索結果の取得中にエラーが発生しました"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [searchParams]);

  // 表示件数が変更されたときに総ページ数を再計算
  useEffect(() => {
    if (searchResults.length > 0) {
      setTotalPages(Math.ceil(searchResults.length / pageSize));
      // 現在のページが新しい総ページ数を超えている場合は、最後のページに設定
      if (page > Math.ceil(searchResults.length / pageSize)) {
        setPage(Math.ceil(searchResults.length / pageSize));
      }
    }
  }, [pageSize, searchResults.length]);

  // URLをクリップボードにコピー
  const handleShareClick = () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error("URLのコピーに失敗しました:", err);
      });
  };

  // ページ変更ハンドラー
  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPage(value);
    // ページ変更時に画面上部にスクロール
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 表示件数変更ハンドラー
  const handlePageSizeChange = (
    event: React.MouseEvent<HTMLElement>,
    newPageSize: number | null
  ) => {
    if (newPageSize !== null) {
      setPageSize(newPageSize);
      // ページを1に戻す
      setPage(1);
      // 画面上部にスクロール
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // 現在のページに表示する検索結果
  const paginatedResults = searchResults.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // 検索条件の表示用テキストを生成
  const getSearchCriteriaText = () => {
    const criteriaTexts = [];

    if (searchCriteria.keyword) {
      criteriaTexts.push(`キーワード: ${searchCriteria.keyword}`);
    }

    if (searchCriteria.min_players || searchCriteria.max_players) {
      const minPlayers = searchCriteria.min_players || "指定なし";
      const maxPlayers = searchCriteria.max_players || "指定なし";
      criteriaTexts.push(`プレイ人数: ${minPlayers}〜${maxPlayers}人`);
    }

    return criteriaTexts.length > 0
      ? criteriaTexts.join(", ")
      : "すべてのゲーム";
  };

  return (
    <Container maxWidth={false}>
      <Box sx={containerStyle}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Link href="/search" style={{ textDecoration: "none" }}>
            <Button variant="outlined">← 検索条件を変更</Button>
          </Link>

          <Tooltip title={copied ? "コピーしました！" : "URLをコピー"}>
            <Button
              variant="outlined"
              startIcon={<ShareIcon />}
              onClick={handleShareClick}
            >
              {copied ? "コピーしました" : "共有"}
            </Button>
          </Tooltip>
        </Box>

        <Typography variant="h4" component="h1" gutterBottom>
          検索結果
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ mb: 3 }}>
          検索条件: {getSearchCriteriaText()}
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : searchResults.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            検索条件に一致するゲームが見つかりませんでした。条件を変更して再度お試しください。
          </Alert>
        ) : (
          <>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", sm: "center" },
                mb: 2,
                gap: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {searchResults.length}件中 {(page - 1) * pageSize + 1}-
                  {Math.min(page * pageSize, searchResults.length)}件を表示
                </Typography>

                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mr: 1 }}
                  >
                    表示件数:
                  </Typography>
                  <ToggleButtonGroup
                    value={pageSize}
                    exclusive
                    onChange={handlePageSizeChange}
                    aria-label="表示件数"
                    size="small"
                  >
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <ToggleButton
                        key={size}
                        value={size}
                        aria-label={`${size}件表示`}
                      >
                        {size}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </Box>
              </Box>

              {totalPages > 1 && (
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  size="medium"
                />
              )}
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={LAYOUT_CONFIG.gridSpacing}>
              {paginatedResults.map((game) => (
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
                          {game.japanese_name || game.name}
                        </Typography>
                        {game.japanese_name &&
                          game.japanese_name !== game.name && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                display: "-webkit-box",
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: "vertical",
                                mb: 1,
                              }}
                            >
                              {game.name}
                            </Typography>
                          )}
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

                        {/* 評価とレビュー数 */}
                        <Box sx={{ mb: 1 }}>
                          {game.average_score > 0 && (
                            <Chip
                              label={`評価: ${formatNumber(
                                game.average_score
                              )}/10`}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ mr: 1, mb: 0.5 }}
                            />
                          )}
                          {game.reviews_count > 0 && (
                            <Chip
                              label={`レビュー: ${game.reviews_count}件`}
                              size="small"
                              color="secondary"
                              variant="outlined"
                              sx={{ mr: 1, mb: 0.5 }}
                            />
                          )}
                        </Box>

                        {/* 人気タグ */}
                        {game.popular_tags && game.popular_tags.length > 0 && (
                          <Box sx={{ mb: 1 }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: "block", mb: 0.5 }}
                            >
                              人気タグ:
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 0.5,
                              }}
                            >
                              {game.popular_tags.slice(0, 3).map((tag) => (
                                <Chip
                                  key={tag}
                                  label={tag}
                                  size="small"
                                  variant="outlined"
                                  sx={{ mr: 0.5, mb: 0.5 }}
                                />
                              ))}
                              {game.popular_tags.length > 3 && (
                                <Chip
                                  label={`+${game.popular_tags.length - 3}`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ mr: 0.5, mb: 0.5 }}
                                />
                              )}
                            </Box>
                          </Box>
                        )}

                        {/* おすすめプレイ人数 */}
                        {game.recommended_players &&
                          game.recommended_players.length > 0 && (
                            <Box>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: "block", mb: 0.5 }}
                              >
                                おすすめ人数:
                              </Typography>
                              <Box
                                sx={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 0.5,
                                }}
                              >
                                {game.recommended_players.map((count) => (
                                  <Chip
                                    key={count}
                                    label={`${count}人`}
                                    size="small"
                                    color="info"
                                    variant="outlined"
                                    sx={{ mr: 0.5, mb: 0.5 }}
                                  />
                                ))}
                              </Box>
                            </Box>
                          )}
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {totalPages > 1 && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                />
              </Box>
            )}
          </>
        )}
      </Box>
    </Container>
  );
}
