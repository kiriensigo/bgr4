import { buildReviewSearchParams, parseReviewSearchParams, getActiveReviewFilterCount, formatRecommendedPlayerLabel, mergeWithDefaultReviewFilters } from '@/lib/search/review-filters'

const createParams = (search: string) => new URLSearchParams(search)

describe('review-filters helpers', () => {
  it('builds query params with non-default filters', () => {
    const filters = mergeWithDefaultReviewFilters({
      query: 'テスト',
      overallScore: [7, 9],
      selectedRecommendedCounts: [3, 4],
      selectedMechanics: ['協力'],
      selectedCategories: ['パーティー']
    })

    const params = buildReviewSearchParams(filters)
    expect(params.get('query')).toBe('テスト')
    expect(params.get('overallScoreMin')).toBe('7')
    expect(params.getAll('recommendedPlayerCounts')).toEqual(['3', '4'])
    expect(params.getAll('mechanics')).toEqual(['協力'])
    expect(params.getAll('categories')).toEqual(['パーティー'])
  })

  it('parses URL params back to form values', () => {
    const params = createParams('query=テスト&overallScoreMin=7&overallScoreMax=9&recommendedPlayerCounts=3&mechanics=協力')
    const parsed = parseReviewSearchParams(params)

    expect(parsed.query).toBe('テスト')
    expect(parsed.overallScore).toEqual([7, 9])
    expect(parsed.selectedRecommendedCounts).toEqual([3])
    expect(parsed.selectedMechanics).toEqual(['協力'])
  })

  it('counts active filters correctly', () => {
    const filters = mergeWithDefaultReviewFilters({
      query: 'ソロ',
      selectedMechanics: ['協力'],
      selectedCategories: ['ソロ向き']
    })
    expect(getActiveReviewFilterCount(filters)).toBeGreaterThanOrEqual(3)
  })

  it('formats recommended player label', () => {
    expect(formatRecommendedPlayerLabel(2)).toBe('2人')
    expect(formatRecommendedPlayerLabel(7)).toBe('6人以上')
  })
})
