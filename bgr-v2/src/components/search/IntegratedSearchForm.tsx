'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Search as SearchIcon, RotateCcw } from 'lucide-react'
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Button,
  TextField,
  Slider,
  Badge,
  ToggleButton,
  ToggleButtonGroup,
  Card,
  CardContent,
  CardHeader,
  CardActions,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

import {
  REVIEW_MECHANIC_OPTIONS,
  REVIEW_CATEGORY_OPTIONS,
  REVIEW_RECOMMENDED_PLAYER_COUNTS,
  REVIEW_GAME_PLAYER_COUNTS,
} from '@/shared/constants/review-search'
import {
  ReviewSearchFormValues,
  mergeWithDefaultReviewFilters,
  getActiveReviewFilterCount,
  REVIEW_DEFAULT_FORM_VALUES,
} from '@/lib/search/review-filters'

interface IntegratedSearchFormProps {
  initialValues?: Partial<ReviewSearchFormValues>
  onSubmit: (filters: ReviewSearchFormValues) => void
  loading?: boolean
  className?: string
}

type AdvancedFilterSection =
  | 'scores'
  | 'recommendedPlayers'
  | 'gamePlayers'
  | 'mechanics'
  | 'categories'

const SECTION_KEYS: AdvancedFilterSection[] = [
  'scores',
  'recommendedPlayers',
  'gamePlayers',
  'mechanics',
  'categories',
]

const createSectionState = (defaultExpanded: boolean): Record<AdvancedFilterSection, boolean> =>
  SECTION_KEYS.reduce(
    (acc, key) => {
      acc[key] = defaultExpanded
      return acc
    },
    {} as Record<AdvancedFilterSection, boolean>
  )

const formatRangeLabel = (label: string, range: [number, number], suffix = '点') => {
  return `${label}: ${range[0].toFixed(1)}${suffix}〜${range[1].toFixed(1)}${suffix}`
}

const isRangeEqual = (value: [number, number], defaults: [number, number]) =>
  value[0] === defaults[0] && value[1] === defaults[1]

export default function IntegratedSearchForm({
  initialValues,
  onSubmit,
  loading = false,
  className = '',
}: IntegratedSearchFormProps) {
  const [filters, setFilters] = useState<ReviewSearchFormValues>(
    mergeWithDefaultReviewFilters(initialValues)
  )
  const [expandedSections, setExpandedSections] = useState<Record<AdvancedFilterSection, boolean>>(
    () => createSectionState(false)
  )

  useEffect(() => {
    setFilters(mergeWithDefaultReviewFilters(initialValues))
  }, [initialValues])

  const handleAccordionChange =
    (panel: AdvancedFilterSection) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedSections(prev => ({ ...prev, [panel]: isExpanded }))
    }

  const activeFilterCount = useMemo(() => getActiveReviewFilterCount(filters), [filters])

  const handleSubmit = () => {
    onSubmit(mergeWithDefaultReviewFilters(filters))
  }

  const handleReset = () => {
    const reset = mergeWithDefaultReviewFilters()
    setFilters(reset)
    onSubmit(reset)
    setExpandedSections(createSectionState(false)) // Reset accordion states
  }

  const hasScoreFilters = useMemo(() => {
    return (
      !isRangeEqual(filters.overallScore, REVIEW_DEFAULT_FORM_VALUES.overallScore) ||
      !isRangeEqual(filters.ruleComplexity, REVIEW_DEFAULT_FORM_VALUES.ruleComplexity) ||
      !isRangeEqual(filters.luckFactor, REVIEW_DEFAULT_FORM_VALUES.luckFactor) ||
      !isRangeEqual(filters.interaction, REVIEW_DEFAULT_FORM_VALUES.interaction) ||
      !isRangeEqual(filters.downtime, REVIEW_DEFAULT_FORM_VALUES.downtime) ||
      !isRangeEqual(filters.playTimeRange, REVIEW_DEFAULT_FORM_VALUES.playTimeRange)
    )
  }, [filters])

  const recommendedCount = filters.selectedRecommendedCounts.length
  const gameCount = filters.selectedGameCounts.length
  const mechanicsCount = filters.selectedMechanics.length
  const categoriesCount = filters.selectedCategories.length

  return (
    <Card className={className}>
      <CardHeader title="レビュー基準で探す" action={<SearchIcon />} />
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
            alignItems: 'center',
          }}
        >
          <TextField
            fullWidth
            label="ゲーム名やキーワードで検索"
            value={filters.query}
            onChange={event => setFilters(prev => ({ ...prev, query: event.target.value }))}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault()
                handleSubmit()
              }
            }}
            aria-label="ゲーム名・キーワード検索"
          />
          <Box sx={{ display: 'flex', gap: 1.5, width: { xs: '100%', md: 'auto' } }}>
            <Button
              variant="outlined"
              size="medium"
              onClick={handleReset}
              disabled={loading || activeFilterCount === 0}
              startIcon={<RotateCcw style={{ width: 18, height: 18 }} />}
              sx={{
                minWidth: '100px',
                fontWeight: 500,
                borderRadius: '8px',
                textTransform: 'none',
                borderColor: 'divider',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'action.hover',
                },
                '&:disabled': {
                  opacity: 0.5,
                },
              }}
            >
              リセット
            </Button>
            <Button
              variant="contained"
              size="medium"
              onClick={handleSubmit}
              disabled={loading}
              startIcon={<SearchIcon style={{ width: 18, height: 18 }} />}
              sx={{
                minWidth: '120px',
                fontWeight: 600,
                borderRadius: '8px',
                textTransform: 'none',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
                '&:hover': {
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
                },
                '&:disabled': {
                  opacity: 0.6,
                },
              }}
            >
              検索
            </Button>
          </Box>
        </Box>

        <Accordion expanded={expandedSections.scores} onChange={handleAccordionChange('scores')}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              flexDirection: 'row-reverse',
              '& .MuiAccordionSummary-expandIconWrapper': {
                marginLeft: '8px',
              },
              '& .MuiAccordionSummary-content': {
                marginLeft: '8px',
              },
            }}
          >
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                5段階指標で絞り込む
              </Typography>
              <Typography variant="body2" color="text.secondary">
                レビューで集計した各指標のレンジを設定できます。
              </Typography>
            </Box>
            {hasScoreFilters && (
              <Badge color="secondary" badgeContent="調整中" sx={{ alignSelf: 'center' }} />
            )}
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { md: '1fr 1fr' } }}>
              <Box>
                <Typography variant="body2" fontWeight="medium">
                  {formatRangeLabel('総合評価', filters.overallScore)}
                </Typography>
                <Slider
                  min={1}
                  max={10}
                  step={0.1}
                  value={filters.overallScore}
                  onChange={(_: Event, value: number | number[]) =>
                    setFilters(prev => ({ ...prev, overallScore: value as [number, number] }))
                  }
                  valueLabelDisplay="auto"
                />
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: 'text.secondary',
                  }}
                >
                  <span>低評価</span>
                  <span>高評価</span>
                </Box>
              </Box>

              <Box>
                <Typography variant="body2" fontWeight="medium">
                  {formatRangeLabel('ルールの複雑さ', filters.ruleComplexity)}
                </Typography>
                <Slider
                  min={1}
                  max={5}
                  step={0.1}
                  value={filters.ruleComplexity}
                  onChange={(_: Event, value: number | number[]) =>
                    setFilters(prev => ({ ...prev, ruleComplexity: value as [number, number] }))
                  }
                  valueLabelDisplay="auto"
                />
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: 'text.secondary',
                  }}
                >
                  <span>シンプル</span>
                  <span>複雑</span>
                </Box>
              </Box>

              <Box>
                <Typography variant="body2" fontWeight="medium">
                  {formatRangeLabel('運要素', filters.luckFactor)}
                </Typography>
                <Slider
                  min={1}
                  max={5}
                  step={0.1}
                  value={filters.luckFactor}
                  onChange={(_: Event, value: number | number[]) =>
                    setFilters(prev => ({ ...prev, luckFactor: value as [number, number] }))
                  }
                  valueLabelDisplay="auto"
                />
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: 'text.secondary',
                  }}
                >
                  <span>戦略寄り</span>
                  <span>運寄り</span>
                </Box>
              </Box>

              <Box>
                <Typography variant="body2" fontWeight="medium">
                  {formatRangeLabel('インタラクション', filters.interaction)}
                </Typography>
                <Slider
                  min={1}
                  max={5}
                  step={0.1}
                  value={filters.interaction}
                  onChange={(_: Event, value: number | number[]) =>
                    setFilters(prev => ({ ...prev, interaction: value as [number, number] }))
                  }
                  valueLabelDisplay="auto"
                />
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: 'text.secondary',
                  }}
                >
                  <span>ソロプレイ寄り</span>
                  <span>インタラクティブ</span>
                </Box>
              </Box>

              <Box>
                <Typography variant="body2" fontWeight="medium">
                  {formatRangeLabel('ダウンタイム', filters.downtime)}
                </Typography>
                <Slider
                  min={1}
                  max={5}
                  step={0.1}
                  value={filters.downtime}
                  onChange={(_: Event, value: number | number[]) =>
                    setFilters(prev => ({ ...prev, downtime: value as [number, number] }))
                  }
                  valueLabelDisplay="auto"
                />
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: 'text.secondary',
                  }}
                >
                  <span>テンポ重視</span>
                  <span>じっくり型</span>
                </Box>
              </Box>

              <Box>
                <Typography variant="body2" fontWeight="medium">
                  プレイ時間: {filters.playTimeRange[0]}分〜
                  {filters.playTimeRange[1] >= 180 ? '180分以上' : `${filters.playTimeRange[1]}分`}
                </Typography>
                <Slider
                  min={15}
                  max={180}
                  step={15}
                  value={filters.playTimeRange}
                  onChange={(_: Event, value: number | number[]) =>
                    setFilters(prev => ({ ...prev, playTimeRange: value as [number, number] }))
                  }
                  valueLabelDisplay="auto"
                />
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: 'text.secondary',
                  }}
                >
                  <span>短時間</span>
                  <span>長時間</span>
                </Box>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion
          expanded={expandedSections.recommendedPlayers}
          onChange={handleAccordionChange('recommendedPlayers')}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              flexDirection: 'row-reverse',
              '& .MuiAccordionSummary-expandIconWrapper': {
                marginLeft: '8px',
              },
              '& .MuiAccordionSummary-content': {
                marginLeft: '8px',
              },
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              おすすめプレイ人数
            </Typography>
            {recommendedCount > 0 && (
              <Badge
                color="secondary"
                badgeContent={`${recommendedCount}件選択中`}
                sx={{ ml: 2, alignSelf: 'center' }}
              />
            )}
          </AccordionSummary>
          <AccordionDetails>
            <ToggleButtonGroup
              value={filters.selectedRecommendedCounts.map(String)}
              onChange={(_: React.MouseEvent<HTMLElement>, newValues: string[]) =>
                setFilters(prev => ({
                  ...prev,
                  selectedRecommendedCounts: newValues
                    .map(Number)
                    .filter(value => !Number.isNaN(value)),
                }))
              }
              aria-label="recommended player counts"
              sx={{ flexWrap: 'wrap', gap: 1 }}
            >
              {REVIEW_RECOMMENDED_PLAYER_COUNTS.map(option => (
                <ToggleButton
                  key={option.value}
                  value={option.value.toString()}
                  size="small"
                  sx={{
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      },
                    },
                  }}
                >
                  {option.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </AccordionDetails>
        </Accordion>

        <Accordion
          expanded={expandedSections.gamePlayers}
          onChange={handleAccordionChange('gamePlayers')}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              flexDirection: 'row-reverse',
              '& .MuiAccordionSummary-expandIconWrapper': {
                marginLeft: '8px',
              },
              '& .MuiAccordionSummary-content': {
                marginLeft: '8px',
              },
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              対応プレイ人数
            </Typography>
            {gameCount > 0 && (
              <Badge
                color="secondary"
                badgeContent={`${gameCount}件選択中`}
                sx={{ ml: 2, alignSelf: 'center' }}
              />
            )}
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              ゲームの推奨プレイ人数ではなく、ルール上プレイ可能な人数で絞り込めます。
            </Typography>
            <ToggleButtonGroup
              value={filters.selectedGameCounts.map(String)}
              onChange={(_: React.MouseEvent<HTMLElement>, newValues: string[]) =>
                setFilters(prev => ({
                  ...prev,
                  selectedGameCounts: newValues.map(Number).filter(value => !Number.isNaN(value)),
                }))
              }
              aria-label="game player counts"
              sx={{ flexWrap: 'wrap', gap: 1 }}
            >
              {REVIEW_GAME_PLAYER_COUNTS.map(option => (
                <ToggleButton
                  key={option.value}
                  value={option.value.toString()}
                  size="small"
                  sx={{
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      },
                    },
                  }}
                >
                  {option.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </AccordionDetails>
        </Accordion>

        <Accordion
          expanded={expandedSections.mechanics}
          onChange={handleAccordionChange('mechanics')}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              flexDirection: 'row-reverse',
              '& .MuiAccordionSummary-expandIconWrapper': {
                marginLeft: '8px',
              },
              '& .MuiAccordionSummary-content': {
                marginLeft: '8px',
              },
            }}
          >
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                メカニクス
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ゲーム詳細ページの統計ラベルと同じ名称で指定できます。
              </Typography>
            </Box>
            {mechanicsCount > 0 && (
              <Badge
                color="secondary"
                badgeContent={`${mechanicsCount}件選択中`}
                sx={{ ml: 2, alignSelf: 'center' }}
              />
            )}
          </AccordionSummary>
          <AccordionDetails>
            <ToggleButtonGroup
              value={filters.selectedMechanics}
              onChange={(_: React.MouseEvent<HTMLElement>, newValues: string[]) =>
                setFilters(prev => ({ ...prev, selectedMechanics: newValues }))
              }
              aria-label="mechanics"
              sx={{ flexWrap: 'wrap', gap: 1 }}
            >
              {REVIEW_MECHANIC_OPTIONS.map(option => (
                <ToggleButton
                  key={option.label}
                  value={option.label}
                  size="small"
                  sx={{
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      },
                    },
                  }}
                >
                  {option.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </AccordionDetails>
        </Accordion>

        <Accordion
          expanded={expandedSections.categories}
          onChange={handleAccordionChange('categories')}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              flexDirection: 'row-reverse',
              '& .MuiAccordionSummary-expandIconWrapper': {
                marginLeft: '8px',
              },
              '& .MuiAccordionSummary-content': {
                marginLeft: '8px',
              },
            }}
          >
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                カテゴリー
              </Typography>
              <Typography variant="body2" color="text.secondary">
                レビューで人気のカテゴリーから AND 条件で絞り込めます。
              </Typography>
            </Box>
            {categoriesCount > 0 && (
              <Badge
                color="secondary"
                badgeContent={`${categoriesCount}件選択中`}
                sx={{ ml: 2, alignSelf: 'center' }}
              />
            )}
          </AccordionSummary>
          <AccordionDetails>
            <ToggleButtonGroup
              value={filters.selectedCategories}
              onChange={(_: React.MouseEvent<HTMLElement>, newValues: string[]) =>
                setFilters(prev => ({ ...prev, selectedCategories: newValues }))
              }
              aria-label="categories"
              sx={{ flexWrap: 'wrap', gap: 1 }}
            >
              {REVIEW_CATEGORY_OPTIONS.map(option => (
                <ToggleButton
                  key={option.label}
                  value={option.label}
                  size="small"
                  sx={{
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      },
                    },
                  }}
                >
                  {option.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </AccordionDetails>
        </Accordion>
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end', gap: 1.5, p: 3, pt: 0 }}>
        {activeFilterCount > 0 && (
          <Badge
            color="secondary"
            badgeContent={`${activeFilterCount}件のフィルタ`}
            sx={{
              mr: 'auto',
              '& .MuiBadge-badge': {
                fontSize: '0.75rem',
                fontWeight: 500,
                padding: '0 8px',
                height: '22px',
                borderRadius: '11px',
              },
            }}
          />
        )}
        <Button
          variant="outlined"
          size="medium"
          onClick={handleReset}
          disabled={loading || activeFilterCount === 0}
          startIcon={<RotateCcw style={{ width: 18, height: 18 }} />}
          sx={{
            minWidth: '100px',
            fontWeight: 500,
            borderRadius: '8px',
            textTransform: 'none',
            borderColor: 'divider',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'action.hover',
            },
            '&:disabled': {
              opacity: 0.5,
            },
          }}
        >
          リセット
        </Button>
        <Button
          variant="contained"
          size="medium"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={<SearchIcon style={{ width: 18, height: 18 }} />}
          sx={{
            minWidth: '120px',
            fontWeight: 600,
            borderRadius: '8px',
            textTransform: 'none',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
            '&:hover': {
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
            },
            '&:disabled': {
              opacity: 0.6,
            },
          }}
        >
          検索
        </Button>
      </CardActions>
    </Card>
  )
}
