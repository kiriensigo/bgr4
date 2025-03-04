"use client";

import { useState, useEffect, useCallback } from "react";
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
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListSubheader,
} from "@mui/material";
import { useRouter, usePathname } from "next/navigation";
import { searchGames } from "@/lib/api";
import SearchIcon from "@mui/icons-material/Search";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import GroupIcon from "@mui/icons-material/Group";
import Link from "next/link";
import { EvaluationSection } from "@/components/GameEvaluationForm/EvaluationSection";
import { containerStyle, cardStyle, LAYOUT_CONFIG } from "@/styles/layout";
import { PLAYER_COUNT_OPTIONS } from "@/components/GameEvaluationForm/constants";

interface LocalSearchParams {
  keyword: string;
  min_players: number | null;
  max_players: number | null;
  playTimeMin: number;
  playTimeMax: number;
  complexityMin: number;
  complexityMax: number;
  mechanics: string[];
  categories: string[];
  totalScoreMin: number;
  totalScoreMax: number;
  interactionMin: number;
  interactionMax: number;
  luckFactorMin: number;
  luckFactorMax: number;
  downtimeMin: number;
  downtimeMax: number;
  recommendedPlayers: string[];
  // 検索モードの設定
  useReviewsMechanics: boolean;
  useReviewsCategories: boolean;
  useReviewsRecommendedPlayers: boolean;
  publisher?: string;
}

// 検索結果とパラメータのキャッシュ
const searchCache: {
  params: LocalSearchParams | null;
  results: any[];
  timestamp: number;
} = {
  params: null,
  results: [],
  timestamp: 0,
};

// キャッシュの有効期限（5分）
const CACHE_EXPIRY = 5 * 60 * 1000;

// スクロール位置のキャッシュ
const SCROLL_POSITION_KEY = "searchPageScrollPosition";

export default function SearchPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  // スクロール復元フラグ
  const [shouldRestoreScroll, setShouldRestoreScroll] = useState(false);

  // 検索条件の状態
  const [searchParams, setSearchParams] = useState<LocalSearchParams>({
    keyword: "",
    min_players: null,
    max_players: null,
    playTimeMin: 1,
    playTimeMax: 13,
    complexityMin: 1,
    complexityMax: 5,
    mechanics: [],
    categories: [],
    totalScoreMin: 0,
    totalScoreMax: 10,
    interactionMin: 1,
    interactionMax: 5,
    luckFactorMin: 1,
    luckFactorMax: 5,
    downtimeMin: 1,
    downtimeMax: 5,
    recommendedPlayers: [],
    // デフォルトでは人気ベースの検索を使用
    useReviewsMechanics: false,
    useReviewsCategories: false,
    useReviewsRecommendedPlayers: false,
  });

  // ページロード時にキャッシュから復元
  useEffect(() => {
    const now = Date.now();
    if (searchCache.params && now - searchCache.timestamp < CACHE_EXPIRY) {
      console.log("検索キャッシュから復元しています");
      setSearchParams(searchCache.params);
      setSearchResults(searchCache.results);
      setShouldRestoreScroll(true);
    }
  }, []);

  // スクロール位置の復元
  useEffect(() => {
    if (shouldRestoreScroll && searchResults.length > 0) {
      const savedScrollPosition = sessionStorage.getItem(SCROLL_POSITION_KEY);
      if (savedScrollPosition) {
        const scrollY = parseInt(savedScrollPosition, 10);
        setTimeout(() => {
          window.scrollTo(0, scrollY);
          console.log(`スクロール位置を復元しました: ${scrollY}px`);
        }, 100); // 少し遅延させて確実にDOMが描画された後に実行
      }
      setShouldRestoreScroll(false);
    }
  }, [shouldRestoreScroll, searchResults]);

  // スクロール位置の保存
  useEffect(() => {
    const handleScroll = () => {
      if (searchResults.length > 0) {
        sessionStorage.setItem(SCROLL_POSITION_KEY, window.scrollY.toString());
      }
    };

    // スクロールイベントのデバウンス処理
    let scrollTimeout: NodeJS.Timeout;
    const debouncedHandleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScroll, 100);
    };

    window.addEventListener("scroll", debouncedHandleScroll);
    return () => {
      window.removeEventListener("scroll", debouncedHandleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [searchResults]);

  const isDefaultRange = (
    min: number,
    max: number,
    defaultMin: number,
    defaultMax: number
  ) => {
    return min === defaultMin && max === defaultMax;
  };

  const handleSearch = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      setError(null);
      setLoading(true);

      try {
        // APIパラメータの変換
        const apiParams = {
          keyword: searchParams.keyword || undefined,
          min_players: searchParams.min_players || undefined,
          max_players: searchParams.max_players || undefined,
          play_time_min: isDefaultRange(
            searchParams.playTimeMin,
            searchParams.playTimeMax,
            1,
            5
          )
            ? undefined
            : searchParams.playTimeMin,
          play_time_max: isDefaultRange(
            searchParams.playTimeMin,
            searchParams.playTimeMax,
            1,
            5
          )
            ? undefined
            : searchParams.playTimeMax,
          complexity_min: isDefaultRange(
            searchParams.complexityMin,
            searchParams.complexityMax,
            1,
            5
          )
            ? undefined
            : searchParams.complexityMin,
          complexity_max: isDefaultRange(
            searchParams.complexityMin,
            searchParams.complexityMax,
            1,
            5
          )
            ? undefined
            : searchParams.complexityMax,
          total_score_min: isDefaultRange(
            searchParams.totalScoreMin,
            searchParams.totalScoreMax,
            0,
            10
          )
            ? undefined
            : searchParams.totalScoreMin,
          total_score_max: isDefaultRange(
            searchParams.totalScoreMin,
            searchParams.totalScoreMax,
            0,
            10
          )
            ? undefined
            : searchParams.totalScoreMax,
          interaction_min: isDefaultRange(
            searchParams.interactionMin,
            searchParams.interactionMax,
            1,
            5
          )
            ? undefined
            : searchParams.interactionMin,
          interaction_max: isDefaultRange(
            searchParams.interactionMin,
            searchParams.interactionMax,
            1,
            5
          )
            ? undefined
            : searchParams.interactionMax,
          luck_factor_min: isDefaultRange(
            searchParams.luckFactorMin,
            searchParams.luckFactorMax,
            1,
            5
          )
            ? undefined
            : searchParams.luckFactorMin,
          luck_factor_max: isDefaultRange(
            searchParams.luckFactorMin,
            searchParams.luckFactorMax,
            1,
            5
          )
            ? undefined
            : searchParams.luckFactorMax,
          downtime_min: isDefaultRange(
            searchParams.downtimeMin,
            searchParams.downtimeMax,
            1,
            5
          )
            ? undefined
            : searchParams.downtimeMin,
          downtime_max: isDefaultRange(
            searchParams.downtimeMin,
            searchParams.downtimeMax,
            1,
            5
          )
            ? undefined
            : searchParams.downtimeMax,
          mechanics:
            searchParams.mechanics.length > 0
              ? searchParams.mechanics
              : undefined,
          tags:
            searchParams.categories.length > 0
              ? searchParams.categories
              : undefined,
          recommended_players:
            searchParams.recommendedPlayers.length > 0
              ? searchParams.recommendedPlayers
              : undefined,
          publisher: searchParams.publisher,
          // 検索モード設定
          use_reviews_mechanics: searchParams.useReviewsMechanics || undefined,
          use_reviews_tags: searchParams.useReviewsCategories || undefined,
          use_reviews_recommended_players:
            searchParams.useReviewsRecommendedPlayers || undefined,
        };

        // プレイ時間の値を実際の分数に変換
        const playTimeMapping = {
          1: "0",
          2: "15",
          3: "30",
          4: "45",
          5: "60",
          6: "75",
          7: "90",
          8: "105",
          9: "120",
          10: "135",
          11: "150",
          12: "165",
          13: "180以上",
        };

        // プレイ時間の値を実際の分数に変換
        if (apiParams.play_time_min) {
          const minValue = parseInt(apiParams.play_time_min.toString());
          if (minValue === 1) {
            apiParams.play_time_min = 0;
          } else if (minValue === 2) {
            apiParams.play_time_min = 15;
          } else if (minValue === 3) {
            apiParams.play_time_min = 30;
          } else if (minValue === 4) {
            apiParams.play_time_min = 45;
          } else if (minValue === 5) {
            apiParams.play_time_min = 60;
          } else if (minValue === 6) {
            apiParams.play_time_min = 75;
          } else if (minValue === 7) {
            apiParams.play_time_min = 90;
          } else if (minValue === 8) {
            apiParams.play_time_min = 105;
          } else if (minValue === 9) {
            apiParams.play_time_min = 120;
          } else if (minValue === 10) {
            apiParams.play_time_min = 135;
          } else if (minValue === 11) {
            apiParams.play_time_min = 150;
          } else if (minValue === 12) {
            apiParams.play_time_min = 165;
          } else if (minValue === 13) {
            apiParams.play_time_min = 180;
          }
        }

        if (apiParams.play_time_max) {
          const maxValue = parseInt(apiParams.play_time_max.toString());
          if (maxValue === 1) {
            apiParams.play_time_max = 0;
          } else if (maxValue === 2) {
            apiParams.play_time_max = 15;
          } else if (maxValue === 3) {
            apiParams.play_time_max = 30;
          } else if (maxValue === 4) {
            apiParams.play_time_max = 45;
          } else if (maxValue === 5) {
            apiParams.play_time_max = 60;
          } else if (maxValue === 6) {
            apiParams.play_time_max = 75;
          } else if (maxValue === 7) {
            apiParams.play_time_max = 90;
          } else if (maxValue === 8) {
            apiParams.play_time_max = 105;
          } else if (maxValue === 9) {
            apiParams.play_time_max = 120;
          } else if (maxValue === 10) {
            apiParams.play_time_max = 135;
          } else if (maxValue === 11) {
            apiParams.play_time_max = 150;
          } else if (maxValue === 12) {
            apiParams.play_time_max = 165;
          } else if (maxValue === 13) {
            apiParams.play_time_max = 999; // 180以上は999分として扱う
          }
        }

        // 値がundefinedのパラメータを除外
        const filteredParams = Object.fromEntries(
          Object.entries(apiParams).filter(([_, value]) => value !== undefined)
        );

        console.log("Filtered search params:", filteredParams);

        // 検索結果ページにリダイレクト
        const queryString = new URLSearchParams(
          filteredParams as Record<string, string>
        ).toString();
        router.push(`/search/results?${queryString}`);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "検索中にエラーが発生しました"
        );
        setLoading(false);
      }
    },
    [searchParams, router]
  );

  const handleEvaluationChange = (name: string, value: any) => {
    setSearchParams((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 検索モードの切り替え
  const handleSearchModeChange = (name: string, checked: boolean) => {
    setSearchParams((prev) => ({
      ...prev,
      [name]: checked,
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

                {/* 出版社 */}
                <Grid item xs={12}>
                  <Typography
                    variant="subtitle1"
                    fontWeight="medium"
                    gutterBottom
                  >
                    出版社
                  </Typography>
                  <FormControl fullWidth>
                    <InputLabel id="publisher-select-label">
                      出版社を選択
                    </InputLabel>
                    <Select
                      labelId="publisher-select-label"
                      id="publisher-select"
                      value={searchParams.publisher || ""}
                      onChange={(e) =>
                        setSearchParams({
                          ...searchParams,
                          publisher: e.target.value,
                        })
                      }
                      label="出版社を選択"
                    >
                      <MenuItem value="">
                        <em>指定なし</em>
                      </MenuItem>
                      {/* 日本の出版社 */}
                      <MenuItem value="ホビージャパン (Hobby Japan)">
                        ホビージャパン
                      </MenuItem>
                      <MenuItem value="アークライト (Arclight)">
                        アークライト
                      </MenuItem>
                      <MenuItem value="数寄ゲームズ (Suki Games)">
                        数寄ゲームズ
                      </MenuItem>
                      <MenuItem value="オインクゲームズ (Oink Games)">
                        オインクゲームズ
                      </MenuItem>
                      <MenuItem value="グラウンディング (Grounding Inc.)">
                        グラウンディング
                      </MenuItem>
                      <MenuItem value="アズモデージャパン (Asmodee Japan)">
                        アズモデージャパン
                      </MenuItem>
                      <MenuItem value="テンデイズゲームズ">
                        テンデイズゲームズ
                      </MenuItem>
                      <MenuItem value="ニューゲームズオーダー">
                        ニューゲームズオーダー
                      </MenuItem>
                      <MenuItem value="すごろくや">すごろくや</MenuItem>
                      <MenuItem value="コロンアーク">コロンアーク</MenuItem>
                      <MenuItem value="アナログランチボックス">
                        アナログランチボックス
                      </MenuItem>
                      <MenuItem value="ドミナゲームズ">ドミナゲームズ</MenuItem>
                      <MenuItem value="おかずブランド">おかずブランド</MenuItem>
                      <MenuItem value="ジェリージェリーゲームズ">
                        ジェリージェリーゲームズ
                      </MenuItem>
                      <MenuItem value="いつつ">いつつ</MenuItem>
                      <MenuItem value="遊歩堂">遊歩堂</MenuItem>
                      <MenuItem value="ヨクトゲームズ">ヨクトゲームズ</MenuItem>
                      <MenuItem value="タコアシゲームズ">
                        タコアシゲームズ
                      </MenuItem>
                      <MenuItem value="耐気圏内ゲームズ">
                        耐気圏内ゲームズ
                      </MenuItem>
                      <MenuItem value="チーム彩園">チーム彩園</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* 検索モード設定 */}
                <Grid item xs={12}>
                  <Typography
                    variant="subtitle1"
                    fontWeight="medium"
                    gutterBottom
                  >
                    検索モード設定
                  </Typography>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={searchParams.useReviewsCategories}
                          onChange={(e) =>
                            handleSearchModeChange(
                              "useReviewsCategories",
                              e.target.checked
                            )
                          }
                        />
                      }
                      label="カテゴリー検索で全レビューから検索（チェックなしの場合は人気カテゴリーから検索）"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={searchParams.useReviewsMechanics}
                          onChange={(e) =>
                            handleSearchModeChange(
                              "useReviewsMechanics",
                              e.target.checked
                            )
                          }
                        />
                      }
                      label="メカニクス検索で全レビューから検索（チェックなしの場合は人気メカニクスから検索）"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={searchParams.useReviewsRecommendedPlayers}
                          onChange={(e) =>
                            handleSearchModeChange(
                              "useReviewsRecommendedPlayers",
                              e.target.checked
                            )
                          }
                        />
                      }
                      label="おすすめプレイ人数検索で全レビューから検索（チェックなしの場合は人気おすすめプレイ人数から検索）"
                    />
                  </Box>
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
