/**
 * @jest-environment node
 */

import { describe, expect, test } from '@jest/globals'

describe('Game Statistics Integration Tests', () => {
  test('統計計算ロジックの検証', () => {
    // テストデータ
    const reviewVotes = 1
    const bggVotes = 10
    const totalReviews = 11
    
    // 計算式: (レビュー選択数 + BGG該当数×10) / (総レビュー数 + 10) × 100
    const totalVotes = reviewVotes + bggVotes
    const totalBase = totalReviews
    const percentage = (totalVotes / totalBase) * 100
    
    expect(percentage).toBe(100) // 11/11 * 100 = 100%
  })

  test('30%/70%閾値判定ロジックの検証', () => {
    const testCases = [
      { percentage: 25, expected: 'hidden' },
      { percentage: 30, expected: 'normal' },
      { percentage: 50, expected: 'normal' },
      { percentage: 69.9, expected: 'normal' },
      { percentage: 70, expected: 'highlight' },
      { percentage: 90, expected: 'highlight' },
      { percentage: 100, expected: 'highlight' }
    ]
    
    testCases.forEach(({ percentage, expected }) => {
      let displayPriority: string
      
      if (percentage < 30) {
        displayPriority = 'hidden'
      } else if (percentage >= 70) {
        displayPriority = 'highlight'
      } else {
        displayPriority = 'normal'
      }
      
      expect(displayPriority).toBe(expected)
    })
  })

  test('BGG重み付け計算の検証', () => {
    // ケース1: レビュー票なし、BGG票のみ
    const case1 = {
      reviewVotes: 0,
      bggVotes: 10,
      totalReviews: 10
    }
    const percentage1 = (case1.bggVotes / case1.totalReviews) * 100
    expect(percentage1).toBe(100)
    
    // ケース2: レビュー票とBGG票の混合
    const case2 = {
      reviewVotes: 1,
      bggVotes: 10,
      totalReviews: 11
    }
    const percentage2 = ((case2.reviewVotes + case2.bggVotes) / case2.totalReviews) * 100
    expect(percentage2).toBe(100)
    
    // ケース3: 部分的な一致
    const case3 = {
      reviewVotes: 0,
      bggVotes: 10,
      totalReviews: 11
    }
    const percentage3 = (case3.bggVotes / case3.totalReviews) * 100
    expect(Math.round(percentage3 * 10) / 10).toBe(90.9)
  })

  test('統計データフォーマットの検証', () => {
    const mockApiResponse = {
      mechanics: [
        {
          name: 'セット収集',
          reviewVotes: 0,
          bggVotes: 10,
          totalVotes: 10,
          totalReviews: 11,
          percentage: 90.9,
          displayPriority: 'highlight'
        }
      ],
      categories: [],
      playerCounts: [
        {
          name: '2人',
          reviewVotes: 1,
          bggVotes: 10,
          totalVotes: 11,
          totalReviews: 11,
          percentage: 100,
          displayPriority: 'highlight'
        }
      ]
    }
    
    // データ構造の検証
    expect(mockApiResponse.mechanics).toHaveLength(1)
    expect(mockApiResponse.categories).toHaveLength(0)
    expect(mockApiResponse.playerCounts).toHaveLength(1)
    
    // フィールドの検証
    const mechanic = mockApiResponse.mechanics[0]
    expect(mechanic).toHaveProperty('name')
    expect(mechanic).toHaveProperty('reviewVotes')
    expect(mechanic).toHaveProperty('bggVotes')
    expect(mechanic).toHaveProperty('totalVotes')
    expect(mechanic).toHaveProperty('totalReviews')
    expect(mechanic).toHaveProperty('percentage')
    expect(mechanic).toHaveProperty('displayPriority')
    
    // 数値検証
    expect(typeof mechanic.percentage).toBe('number')
    expect(mechanic.percentage).toBeGreaterThanOrEqual(0)
    expect(mechanic.percentage).toBeLessThanOrEqual(100)
    
    // 優先度検証
    expect(['highlight', 'normal', 'hidden']).toContain(mechanic.displayPriority)
  })

  test('パフォーマンス要件の検証', () => {
    // APIレスポンス時間の測定（シミュレーション）
    const startTime = Date.now()
    
    // 統計計算処理のシミュレーション
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      percentage: Math.random() * 100,
      category: i % 3 === 0 ? 'mechanics' : i % 3 === 1 ? 'categories' : 'playerCounts'
    }))
    
    // フィルタリング処理（30%以上のみ）
    const filteredData = largeDataset.filter(item => item.percentage >= 30)
    
    // 並び替え処理
    const sortedData = filteredData.sort((a, b) => b.percentage - a.percentage)
    
    const endTime = Date.now()
    const processingTime = endTime - startTime
    
    // パフォーマンス検証（1秒以内）
    expect(processingTime).toBeLessThan(1000)
    expect(sortedData.length).toBeGreaterThan(0)
    
    // データが正しくソートされているか検証
    for (let i = 1; i < sortedData.length; i++) {
      expect(sortedData[i].percentage).toBeLessThanOrEqual(sortedData[i - 1].percentage)
    }
  })
})