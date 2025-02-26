import { Grid, Stack, Typography, ToggleButtonGroup } from "@mui/material";
import { CustomSlider } from "./CustomSlider";
import { CustomToggleButton } from "./CustomToggleButton";
import {
  MECHANICS,
  TAGS,
  PLAYER_COUNT_OPTIONS,
  PLAY_TIME_MARKS,
  COMPLEXITY_MARKS,
  EVALUATION_MARKS,
  DOWNTIME_MARKS,
} from "./constants";

interface EvaluationSectionProps {
  values: {
    totalScoreMin?: number;
    totalScoreMax?: number;
    playTimeMin: number;
    playTimeMax: number;
    complexityMin: number;
    complexityMax: number;
    luckFactorMin: number;
    luckFactorMax: number;
    interactionMin: number;
    interactionMax: number;
    downtimeMin: number;
    downtimeMax: number;
    recommendedPlayers: string[];
    mechanics: string[];
    tags: string[];
  };
  onChange: (name: string, value: any) => void;
  isSearchMode?: boolean;
}

export const EvaluationSection = ({
  values,
  onChange,
  isSearchMode = false,
}: EvaluationSectionProps) => {
  const handleSliderChange =
    (name: string) => (event: Event, newValue: number | number[]) => {
      if (isSearchMode && Array.isArray(newValue)) {
        const [min, max] = newValue;
        onChange(`${name}Min`, min);
        onChange(`${name}Max`, max);
      } else {
        onChange(name, newValue);
      }
    };

  const handleArrayChange =
    (name: string) =>
    (event: React.MouseEvent<HTMLElement>, newValue: string[]) => {
      onChange(name, newValue);
    };

  return (
    <Grid container spacing={3}>
      {isSearchMode && (
        <Grid item xs={12}>
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight="medium">
              総合評価
            </Typography>
            <CustomSlider
              value={[values.totalScoreMin || 0, values.totalScoreMax || 10]}
              onChange={handleSliderChange("totalScore")}
              valueLabelDisplay="auto"
              min={0}
              max={10}
              step={0.1}
              marks={[
                { value: 0, label: "0" },
                { value: 2.5, label: "2.5" },
                { value: 5, label: "5" },
                { value: 7.5, label: "7.5" },
                { value: 10, label: "10" },
              ]}
            />
          </Stack>
        </Grid>
      )}

      <Grid item xs={12}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" fontWeight="medium">
            プレイ時間
          </Typography>
          <CustomSlider
            value={
              isSearchMode
                ? [values.playTimeMin, values.playTimeMax]
                : values.playTimeMin
            }
            onChange={handleSliderChange("playTime")}
            valueLabelDisplay="auto"
            min={1}
            max={5}
            step={1}
            marks={PLAY_TIME_MARKS}
          />
        </Stack>
      </Grid>

      <Grid item xs={12}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" fontWeight="medium">
            ルールの複雑さ
          </Typography>
          <CustomSlider
            value={
              isSearchMode
                ? [values.complexityMin, values.complexityMax]
                : values.complexityMin
            }
            onChange={handleSliderChange("complexity")}
            valueLabelDisplay="auto"
            min={1}
            max={5}
            step={0.5}
            marks={COMPLEXITY_MARKS}
          />
        </Stack>
      </Grid>

      <Grid item xs={12}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" fontWeight="medium">
            運要素
          </Typography>
          <CustomSlider
            value={
              isSearchMode
                ? [values.luckFactorMin, values.luckFactorMax]
                : values.luckFactorMin
            }
            onChange={handleSliderChange("luckFactor")}
            valueLabelDisplay="auto"
            min={1}
            max={5}
            step={0.5}
            marks={EVALUATION_MARKS}
          />
        </Stack>
      </Grid>

      <Grid item xs={12}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" fontWeight="medium">
            インタラクション（相互作用）
          </Typography>
          <CustomSlider
            value={
              isSearchMode
                ? [values.interactionMin, values.interactionMax]
                : values.interactionMin
            }
            onChange={handleSliderChange("interaction")}
            valueLabelDisplay="auto"
            min={1}
            max={5}
            step={0.5}
            marks={EVALUATION_MARKS}
          />
        </Stack>
      </Grid>

      <Grid item xs={12}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" fontWeight="medium">
            ダウンタイム
          </Typography>
          <CustomSlider
            value={
              isSearchMode
                ? [values.downtimeMin, values.downtimeMax]
                : values.downtimeMin
            }
            onChange={handleSliderChange("downtime")}
            valueLabelDisplay="auto"
            min={1}
            max={5}
            step={0.5}
            marks={DOWNTIME_MARKS}
          />
        </Stack>
      </Grid>

      <Grid item xs={12}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" fontWeight="medium">
            おすすめプレイ人数
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ※ユーザーレビューで50%以上の支持を得た人数で検索します
          </Typography>
          <ToggleButtonGroup
            value={values.recommendedPlayers}
            onChange={handleArrayChange("recommendedPlayers")}
            aria-label="おすすめのプレイ人数"
            multiple
            sx={{ flexWrap: "wrap", gap: 1 }}
          >
            {PLAYER_COUNT_OPTIONS.map((count) => (
              <CustomToggleButton key={count} value={count}>
                {count}人
              </CustomToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>
      </Grid>

      <Grid item xs={12}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" fontWeight="medium">
            メカニクス
          </Typography>
          <ToggleButtonGroup
            value={values.mechanics}
            onChange={handleArrayChange("mechanics")}
            aria-label="メカニクス"
            multiple
            sx={{ flexWrap: "wrap", gap: 1 }}
          >
            {MECHANICS.map((mechanic) => (
              <CustomToggleButton key={mechanic} value={mechanic}>
                {mechanic}
              </CustomToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>
      </Grid>

      <Grid item xs={12}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" fontWeight="medium">
            タグ
          </Typography>
          <ToggleButtonGroup
            value={values.tags}
            onChange={handleArrayChange("tags")}
            aria-label="タグ"
            multiple
            sx={{ flexWrap: "wrap", gap: 1 }}
          >
            {TAGS.map((tag) => (
              <CustomToggleButton key={tag} value={tag}>
                {tag}
              </CustomToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>
      </Grid>
    </Grid>
  );
};
