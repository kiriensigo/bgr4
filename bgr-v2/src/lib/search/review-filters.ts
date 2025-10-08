import { REVIEW_DEFAULT_FILTERS, REVIEW_MECHANIC_OPTIONS, REVIEW_CATEGORY_OPTIONS, REVIEW_RECOMMENDED_PLAYER_COUNTS, REVIEW_GAME_PLAYER_COUNTS } from '@/shared/constants/review-search'

export interface ReviewSearchFormValues {
  query: string
  overallScore: [number, number]
  ruleComplexity: [number, number]
  luckFactor: [number, number]
  interaction: [number, number]
  downtime: [number, number]
  playTimeRange: [number, number]
  selectedRecommendedCounts: number[]
  selectedGameCounts: number[]
  selectedMechanics: string[]
  selectedCategories: string[]
}

export const REVIEW_DEFAULT_FORM_VALUES: ReviewSearchFormValues = {
  query: REVIEW_DEFAULT_FILTERS.query,
  overallScore: [...REVIEW_DEFAULT_FILTERS.overallScore],
  ruleComplexity: [...REVIEW_DEFAULT_FILTERS.ruleComplexity],
  luckFactor: [...REVIEW_DEFAULT_FILTERS.luckFactor],
  interaction: [...REVIEW_DEFAULT_FILTERS.interaction],
  downtime: [...REVIEW_DEFAULT_FILTERS.downtime],
  playTimeRange: [...REVIEW_DEFAULT_FILTERS.playTimeRange],
  selectedRecommendedCounts: [...REVIEW_DEFAULT_FILTERS.selectedRecommendedCounts],
  selectedGameCounts: [...REVIEW_DEFAULT_FILTERS.selectedGameCounts],
  selectedMechanics: [...REVIEW_DEFAULT_FILTERS.selectedMechanics],
  selectedCategories: [...REVIEW_DEFAULT_FILTERS.selectedCategories]
}

const toNumberArray = (values: (string | null)[]): number[] => {
  return values
    .map((value) => {
      if (value == null || value.trim() === '') return null
      const parsed = Number(value)
      return Number.isNaN(parsed) ? null : parsed
    })
    .filter((value): value is number => value !== null)
}

const isDefaultRange = (value: [number, number], defaultValue: [number, number]): boolean => {
  return value[0] === defaultValue[0] && value[1] === defaultValue[1]
}

const cloneFormValues = (values: ReviewSearchFormValues): ReviewSearchFormValues => ({
  query: values.query,
  overallScore: [...values.overallScore],
  ruleComplexity: [...values.ruleComplexity],
  luckFactor: [...values.luckFactor],
  interaction: [...values.interaction],
  downtime: [...values.downtime],
  playTimeRange: [...values.playTimeRange],
  selectedRecommendedCounts: [...values.selectedRecommendedCounts],
  selectedGameCounts: [...values.selectedGameCounts],
  selectedMechanics: [...values.selectedMechanics],
  selectedCategories: [...values.selectedCategories]
})

export const mergeWithDefaultReviewFilters = (override?: Partial<ReviewSearchFormValues>): ReviewSearchFormValues => {
  if (!override) return cloneFormValues(REVIEW_DEFAULT_FORM_VALUES)
  const merged = cloneFormValues(REVIEW_DEFAULT_FORM_VALUES)

  if (override.query !== undefined) merged.query = override.query
  if (override.overallScore) merged.overallScore = [...override.overallScore]
  if (override.ruleComplexity) merged.ruleComplexity = [...override.ruleComplexity]
  if (override.luckFactor) merged.luckFactor = [...override.luckFactor]
  if (override.interaction) merged.interaction = [...override.interaction]
  if (override.downtime) merged.downtime = [...override.downtime]
  if (override.playTimeRange) merged.playTimeRange = [...override.playTimeRange]
  if (override.selectedRecommendedCounts) merged.selectedRecommendedCounts = [...override.selectedRecommendedCounts]
  if (override.selectedGameCounts) merged.selectedGameCounts = [...override.selectedGameCounts]
  if (override.selectedMechanics) merged.selectedMechanics = [...override.selectedMechanics]
  if (override.selectedCategories) merged.selectedCategories = [...override.selectedCategories]

  return merged
}

export const parseReviewSearchParams = (params: URLSearchParams): ReviewSearchFormValues => {
  const merged = cloneFormValues(REVIEW_DEFAULT_FORM_VALUES)

  const query = params.get('query')
  if (query) merged.query = query

  const overallMin = params.get('overallScoreMin')
  const overallMax = params.get('overallScoreMax')
  if (overallMin || overallMax) {
    merged.overallScore = [
      overallMin ? Number(overallMin) || REVIEW_DEFAULT_FORM_VALUES.overallScore[0] : REVIEW_DEFAULT_FORM_VALUES.overallScore[0],
      overallMax ? Number(overallMax) || REVIEW_DEFAULT_FORM_VALUES.overallScore[1] : REVIEW_DEFAULT_FORM_VALUES.overallScore[1]
    ]
  }

  const ruleMin = params.get('ruleComplexityMin')
  const ruleMax = params.get('ruleComplexityMax')
  if (ruleMin || ruleMax) {
    merged.ruleComplexity = [
      ruleMin ? Number(ruleMin) || REVIEW_DEFAULT_FORM_VALUES.ruleComplexity[0] : REVIEW_DEFAULT_FORM_VALUES.ruleComplexity[0],
      ruleMax ? Number(ruleMax) || REVIEW_DEFAULT_FORM_VALUES.ruleComplexity[1] : REVIEW_DEFAULT_FORM_VALUES.ruleComplexity[1]
    ]
  }

  const luckMin = params.get('luckFactorMin')
  const luckMax = params.get('luckFactorMax')
  if (luckMin || luckMax) {
    merged.luckFactor = [
      luckMin ? Number(luckMin) || REVIEW_DEFAULT_FORM_VALUES.luckFactor[0] : REVIEW_DEFAULT_FORM_VALUES.luckFactor[0],
      luckMax ? Number(luckMax) || REVIEW_DEFAULT_FORM_VALUES.luckFactor[1] : REVIEW_DEFAULT_FORM_VALUES.luckFactor[1]
    ]
  }

  const interactionMin = params.get('interactionMin')
  const interactionMax = params.get('interactionMax')
  if (interactionMin || interactionMax) {
    merged.interaction = [
      interactionMin ? Number(interactionMin) || REVIEW_DEFAULT_FORM_VALUES.interaction[0] : REVIEW_DEFAULT_FORM_VALUES.interaction[0],
      interactionMax ? Number(interactionMax) || REVIEW_DEFAULT_FORM_VALUES.interaction[1] : REVIEW_DEFAULT_FORM_VALUES.interaction[1]
    ]
  }

  const downtimeMin = params.get('downtimeMin')
  const downtimeMax = params.get('downtimeMax')
  if (downtimeMin || downtimeMax) {
    merged.downtime = [
      downtimeMin ? Number(downtimeMin) || REVIEW_DEFAULT_FORM_VALUES.downtime[0] : REVIEW_DEFAULT_FORM_VALUES.downtime[0],
      downtimeMax ? Number(downtimeMax) || REVIEW_DEFAULT_FORM_VALUES.downtime[1] : REVIEW_DEFAULT_FORM_VALUES.downtime[1]
    ]
  }

  const playMin = params.get('playTimeMin')
  const playMax = params.get('playTimeMax')
  if (playMin || playMax) {
    merged.playTimeRange = [
      playMin ? Number(playMin) || REVIEW_DEFAULT_FORM_VALUES.playTimeRange[0] : REVIEW_DEFAULT_FORM_VALUES.playTimeRange[0],
      playMax ? Number(playMax) || REVIEW_DEFAULT_FORM_VALUES.playTimeRange[1] : REVIEW_DEFAULT_FORM_VALUES.playTimeRange[1]
    ]
  }

  const recommended = toNumberArray(params.getAll('recommendedPlayerCounts'))
  if (recommended.length > 0) merged.selectedRecommendedCounts = recommended

  const gameCounts = toNumberArray(params.getAll('gamePlayerCounts'))
  if (gameCounts.length > 0) merged.selectedGameCounts = gameCounts

  const mechanics = params.getAll('mechanics').filter(Boolean)
  if (mechanics.length > 0) merged.selectedMechanics = mechanics

  const categories = params.getAll('categories').filter(Boolean)
  if (categories.length > 0) merged.selectedCategories = categories

  return merged
}

export const buildReviewSearchParams = (filters: ReviewSearchFormValues): URLSearchParams => {
  const params = new URLSearchParams()
  const trimmedQuery = filters.query.trim()
  if (trimmedQuery) params.set('query', trimmedQuery)

  if (!isDefaultRange(filters.overallScore, REVIEW_DEFAULT_FORM_VALUES.overallScore)) {
    params.set('overallScoreMin', filters.overallScore[0].toString())
    params.set('overallScoreMax', filters.overallScore[1].toString())
  }

  if (!isDefaultRange(filters.ruleComplexity, REVIEW_DEFAULT_FORM_VALUES.ruleComplexity)) {
    params.set('ruleComplexityMin', filters.ruleComplexity[0].toString())
    params.set('ruleComplexityMax', filters.ruleComplexity[1].toString())
  }

  if (!isDefaultRange(filters.luckFactor, REVIEW_DEFAULT_FORM_VALUES.luckFactor)) {
    params.set('luckFactorMin', filters.luckFactor[0].toString())
    params.set('luckFactorMax', filters.luckFactor[1].toString())
  }

  if (!isDefaultRange(filters.interaction, REVIEW_DEFAULT_FORM_VALUES.interaction)) {
    params.set('interactionMin', filters.interaction[0].toString())
    params.set('interactionMax', filters.interaction[1].toString())
  }

  if (!isDefaultRange(filters.downtime, REVIEW_DEFAULT_FORM_VALUES.downtime)) {
    params.set('downtimeMin', filters.downtime[0].toString())
    params.set('downtimeMax', filters.downtime[1].toString())
  }

  if (!isDefaultRange(filters.playTimeRange, REVIEW_DEFAULT_FORM_VALUES.playTimeRange)) {
    params.set('playTimeMin', filters.playTimeRange[0].toString())
    params.set('playTimeMax', filters.playTimeRange[1].toString())
  }

  filters.selectedRecommendedCounts.forEach((count) => {
    params.append('recommendedPlayerCounts', count.toString())
  })

  filters.selectedGameCounts.forEach((count) => {
    params.append('gamePlayerCounts', count.toString())
  })

  filters.selectedMechanics.forEach((mechanic) => {
    params.append('mechanics', mechanic)
  })

  filters.selectedCategories.forEach((category) => {
    params.append('categories', category)
  })

  return params
}

export const getActiveReviewFilterCount = (filters: ReviewSearchFormValues): number => {
  let count = 0
  if (filters.query.trim()) count += 1
  if (filters.selectedRecommendedCounts.length > 0) count += 1
  if (filters.selectedGameCounts.length > 0) count += 1
  if (filters.selectedMechanics.length > 0) count += 1
  if (filters.selectedCategories.length > 0) count += 1
  if (!isDefaultRange(filters.overallScore, REVIEW_DEFAULT_FORM_VALUES.overallScore)) count += 1
  if (!isDefaultRange(filters.ruleComplexity, REVIEW_DEFAULT_FORM_VALUES.ruleComplexity)) count += 1
  if (!isDefaultRange(filters.luckFactor, REVIEW_DEFAULT_FORM_VALUES.luckFactor)) count += 1
  if (!isDefaultRange(filters.interaction, REVIEW_DEFAULT_FORM_VALUES.interaction)) count += 1
  if (!isDefaultRange(filters.downtime, REVIEW_DEFAULT_FORM_VALUES.downtime)) count += 1
  if (!isDefaultRange(filters.playTimeRange, REVIEW_DEFAULT_FORM_VALUES.playTimeRange)) count += 1
  return count
}

export const hasActiveReviewFilters = (filters: ReviewSearchFormValues): boolean => {
  return getActiveReviewFilterCount(filters) > 0
}

export const formatRecommendedPlayerLabel = (count: number): string => {
  const match = REVIEW_RECOMMENDED_PLAYER_COUNTS.find((option) => option.value === count)
  if (match) return match.label

  if (count >= 7) return '6人以上'
  return `${count}人`
}

export const formatGamePlayerLabel = (count: number): string => {
  const match = REVIEW_GAME_PLAYER_COUNTS.find((option) => option.value === count)
  if (match) return match.label

  if (count >= 7) return '7人以上'
  return `${count}人`
}

export const mechanicLabels = REVIEW_MECHANIC_OPTIONS.map((option) => option.label)
export const categoryLabels = REVIEW_CATEGORY_OPTIONS.map((option) => option.label)
