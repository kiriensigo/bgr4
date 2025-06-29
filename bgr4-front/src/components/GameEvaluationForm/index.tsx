import { useState, useEffect } from "react";
import { Box, Button, Typography, Paper, Grid, Divider } from "@mui/material";
import { EvaluationSection } from "./EvaluationSection";
import { CommentSection } from "./CommentSection";
import { OverallScoreSection } from "./OverallScoreSection";

interface GameEvaluationFormProps {
  initialValues?: {
    overall_score?: number;
    rule_complexity?: number;
    luck_factor?: number;
    interaction?: number;
    downtime?: number;
    recommended_players?: string[];
    mechanics?: string[];
    categories?: string[];
    custom_tags?: string[];
    short_comment?: string;
  };
  onSubmit: (values: any) => void;
  isSearchMode?: boolean;
  submitButtonText?: string;
  showOverallScore?: boolean;
}

export default function GameEvaluationForm({
  initialValues = {},
  onSubmit,
  isSearchMode = false,
  submitButtonText = "送信",
  showOverallScore = true,
}: GameEvaluationFormProps) {
  const [values, setValues] = useState({
    overall_score: initialValues.overall_score || 7,
    rule_complexity: initialValues.rule_complexity || 3,
    luck_factor: initialValues.luck_factor || 3,
    interaction: initialValues.interaction || 3,
    downtime: initialValues.downtime || 3,
    recommended_players: initialValues.recommended_players || [],
    mechanics: initialValues.mechanics || [],
    categories: initialValues.categories || [],
    custom_tags: initialValues.custom_tags || [],
    short_comment: initialValues.short_comment || "",
    // 検索モード用の追加フィールド
    totalScoreMin: 0,
    totalScoreMax: 10,
    playTimeMin: 1,
    playTimeMax: 13,
    complexityMin: 1,
    complexityMax: 5,
    luckFactorMin: 1,
    luckFactorMax: 5,
    interactionMin: 1,
    interactionMax: 5,
    downtimeMin: 1,
    downtimeMax: 5,
  });

  // 初期値が変更された場合に状態を更新
  useEffect(() => {
    if (Object.keys(initialValues).length > 0) {
      setValues((prev) => ({
        ...prev,
        overall_score: initialValues.overall_score || prev.overall_score,
        rule_complexity: initialValues.rule_complexity || prev.rule_complexity,
        luck_factor: initialValues.luck_factor || prev.luck_factor,
        interaction: initialValues.interaction || prev.interaction,
        downtime: initialValues.downtime || prev.downtime,
        recommended_players:
          initialValues.recommended_players || prev.recommended_players,
        mechanics: initialValues.mechanics || prev.mechanics,
        categories: initialValues.categories || prev.categories,
        custom_tags: initialValues.custom_tags || prev.custom_tags,
        short_comment: initialValues.short_comment || prev.short_comment,
      }));
    }
  }, [initialValues]);

  const handleChange = (name: string, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 検索モードの場合は検索用のパラメータを構築
    if (isSearchMode) {
      const searchParams = {
        total_score_min: values.totalScoreMin,
        total_score_max: values.totalScoreMax,
        play_time_min: values.playTimeMin,
        play_time_max: values.playTimeMax,
        complexity_min: values.complexityMin,
        complexity_max: values.complexityMax,
        luck_factor_min: values.luckFactorMin,
        luck_factor_max: values.luckFactorMax,
        interaction_min: values.interactionMin,
        interaction_max: values.interactionMax,
        downtime_min: values.downtimeMin,
        downtime_max: values.downtimeMax,
        recommended_players: values.recommended_players,
        mechanics: values.mechanics,
        categories: values.categories,
      };
      onSubmit(searchParams);
    } else {
      // レビュー投稿モードの場合はレビュー用のパラメータを構築
      const reviewParams = {
        overall_score: values.overall_score,
        rule_complexity: values.rule_complexity,
        luck_factor: values.luck_factor,
        interaction: values.interaction,
        downtime: values.downtime,
        recommended_players: values.recommended_players,
        mechanics: values.mechanics,
        categories: values.categories,
        custom_tags: values.custom_tags,
        short_comment: values.short_comment,
      };
      onSubmit(reviewParams);
    }
  };

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      elevation={3}
      sx={{ p: 3, mb: 4 }}
    >
      <Grid container spacing={3}>
        {showOverallScore && (
          <>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                総合評価
              </Typography>
              <OverallScoreSection
                value={values.overall_score}
                onChange={(value) => handleChange("overall_score", value)}
              />
            </Grid>
            <Grid item xs={12}>
              <Divider />
            </Grid>
          </>
        )}

        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            {isSearchMode ? "検索条件" : "評価項目"}
          </Typography>
          <EvaluationSection
            values={values}
            onChange={handleChange}
            isSearchMode={isSearchMode}
          />
        </Grid>

        {!isSearchMode && (
          <>
            <Grid item xs={12}>
              <Divider />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                コメント
              </Typography>
              <CommentSection
                value={values.short_comment}
                onChange={(value) => handleChange("short_comment", value)}
                customTags={values.custom_tags}
                onCustomTagsChange={(value) =>
                  handleChange("custom_tags", value)
                }
              />
            </Grid>
          </>
        )}

        <Grid item xs={12}>
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              sx={{ minWidth: 200 }}
            >
              {submitButtonText}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}
