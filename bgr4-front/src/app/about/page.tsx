"use client";

import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Paper,
} from "@mui/material";
import { Games, RateReview, Search, People } from "@mui/icons-material";

export default function AboutPage() {
  const features = [
    {
      icon: <Games sx={{ fontSize: 48, color: "primary.main" }} />,
      title: "豊富なゲームデータベース",
      description: "BoardGameGeekと連携した豊富なボードゲーム情報を提供",
    },
    {
      icon: <RateReview sx={{ fontSize: 48, color: "primary.main" }} />,
      title: "詳細なレビュー機能",
      description: "多角的な評価項目でゲームを詳しくレビュー",
    },
    {
      icon: <Search sx={{ fontSize: 48, color: "primary.main" }} />,
      title: "高度な検索機能",
      description: "プレイ人数、時間、カテゴリーなど細かい条件で検索",
    },
    {
      icon: <People sx={{ fontSize: 48, color: "primary.main" }} />,
      title: "コミュニティ機能",
      description: "ユーザー同士でレビューを共有し、おすすめゲームを発見",
    },
  ];

  const stats = [
    { label: "登録ゲーム数", value: "1,000+" },
    { label: "評価項目", value: "8項目" },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box textAlign="center" mb={6}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{ fontWeight: "bold" }}
        >
          BGRについて
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ maxWidth: "800px", mx: "auto" }}
        >
          BGR（Board Game
          Review）は、ボードゲーム愛好者のための総合レビュープラットフォームです。
          詳細な評価システムと豊富なゲーム情報で、あなたにぴったりのボードゲームを見つけるお手伝いをします。
        </Typography>
      </Box>

      <Grid container spacing={4} mb={6}>
        {features.map((feature, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card
              sx={{ height: "100%", display: "flex", flexDirection: "column" }}
            >
              <CardContent sx={{ textAlign: "center", p: 4 }}>
                <Box mb={2}>{feature.icon}</Box>
                <Typography
                  variant="h5"
                  component="h3"
                  gutterBottom
                  sx={{ fontWeight: "bold" }}
                >
                  {feature.title}
                </Typography>
                <Typography color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 4, mb: 6, textAlign: "center" }}>
        <Typography
          variant="h4"
          component="h2"
          gutterBottom
          sx={{ fontWeight: "bold" }}
        >
          サイト統計
        </Typography>
        <Grid container spacing={4} sx={{ mt: 2 }}>
          {stats.map((stat, index) => (
            <Grid item xs={6} md={3} key={index}>
              <Typography
                variant="h3"
                component="div"
                color="primary.main"
                sx={{ fontWeight: "bold" }}
              >
                {stat.value}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {stat.label}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Box mb={6}>
        <Typography
          variant="h4"
          component="h2"
          gutterBottom
          sx={{ fontWeight: "bold", textAlign: "center" }}
        >
          BGRの特徴
        </Typography>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
              多角的な評価システム
            </Typography>
            <Typography paragraph>
              BGRでは単純な総合評価だけでなく、以下の8つの項目で詳細にゲームを評価できます：
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
              {[
                "総合評価",
                "戦略性",
                "運要素",
                "コンポーネント",
                "アートワーク",
                "ルールの分かりやすさ",
                "インタラクション",
                "リプレイ性",
              ].map((item) => (
                <Chip key={item} label={item} variant="outlined" />
              ))}
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
              充実した検索・発見機能
            </Typography>
            <Typography paragraph>
              プレイ人数、プレイ時間、ゲームの複雑さ、カテゴリーなど様々な条件でゲームを検索できます。
              また、他のユーザーのレビューを参考に、あなたにぴったりのゲームを発見できます。
            </Typography>
          </Grid>
        </Grid>
      </Box>

      <Paper sx={{ p: 4, backgroundColor: "grey.50" }}>
        <Typography
          variant="h4"
          component="h2"
          gutterBottom
          sx={{ fontWeight: "bold", textAlign: "center" }}
        >
          使い方
        </Typography>

        <Grid container spacing={4} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
              1. ゲームを探す
            </Typography>
            <Typography>
              検索機能やカテゴリー別表示で興味のあるゲームを見つけましょう。
              人気のゲームやおすすめゲームもホームページで紹介しています。
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
              2. レビューを読む
            </Typography>
            <Typography>
              他のユーザーが投稿した詳細なレビューを読んで、
              ゲームの特徴や面白さを確認しましょう。
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
              3. レビューを投稿
            </Typography>
            <Typography>
              プレイしたゲームのレビューを投稿して、
              他のプレイヤーと感想を共有しましょう。
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}
