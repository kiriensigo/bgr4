import { renderHook, act } from '@testing-library/react'
import { useOptimizedSearch, useOptimizedFilter, useOptimizedSort } from '../useOptimizedData'

// タイマーをモック
jest.useFakeTimers()

describe('useOptimizedData', () => {
  afterEach(() => {
    jest.clearAllTimers()
  })

  describe('useOptimizedSearch', () => {
    it('デバウンス機能が正常に動作する', () => {
      const mockOnSearch = jest.fn()
      const { result } = renderHook(() => useOptimizedSearch(mockOnSearch, 300))

      // 連続して検索関数を呼び出す
      act(() => {
        result.current('test1')
        result.current('test2')
        result.current('test3')
      })

      // まだデバウンス期間中なので呼ばれない
      expect(mockOnSearch).not.toHaveBeenCalled()

      // デバウンス期間経過
      act(() => {
        jest.advanceTimersByTime(300)
      })

      // 最後の検索クエリだけが実行される
      expect(mockOnSearch).toHaveBeenCalledTimes(1)
      expect(mockOnSearch).toHaveBeenCalledWith('test3')
    })

    it('カスタムデバウンス時間が適用される', () => {
      const mockOnSearch = jest.fn()
      const customDelay = 500
      const { result } = renderHook(() => useOptimizedSearch(mockOnSearch, customDelay))

      act(() => {
        result.current('test')
      })

      // カスタム時間未満では呼ばれない
      act(() => {
        jest.advanceTimersByTime(400)
      })
      expect(mockOnSearch).not.toHaveBeenCalled()

      // カスタム時間経過後は呼ばれる
      act(() => {
        jest.advanceTimersByTime(100)
      })
      expect(mockOnSearch).toHaveBeenCalledWith('test')
    })
  })

  describe('useOptimizedFilter', () => {
    const testData = [
      { id: 1, name: 'Apple', category: 'fruit' },
      { id: 2, name: 'Banana', category: 'fruit' },
      { id: 3, name: 'Carrot', category: 'vegetable' },
    ]

    it('フィルタリングが正常に動作する', () => {
      const filterFn = (item: any) => item.category === 'fruit'
      const { result } = renderHook(() => 
        useOptimizedFilter(testData, filterFn, ['fruit'])
      )

      expect(result.current).toHaveLength(2)
      expect(result.current[0].name).toBe('Apple')
      expect(result.current[1].name).toBe('Banana')
    })

    it('依存関係が変更されるとメモ化が更新される', () => {
      const { result, rerender } = renderHook(
        ({ category }) => {
          const filterFn = (item: any) => item.category === category
          return useOptimizedFilter(testData, filterFn, [category])
        },
        { initialProps: { category: 'fruit' } }
      )

      // 最初は果物のみ
      expect(result.current).toHaveLength(2)

      // 依存関係を変更
      rerender({ category: 'vegetable' })

      // 野菜のみに変更される
      expect(result.current).toHaveLength(1)
      expect(result.current[0].name).toBe('Carrot')
    })
  })

  describe('useOptimizedSort', () => {
    const testData = [
      { id: 3, name: 'Charlie', score: 80 },
      { id: 1, name: 'Alice', score: 95 },
      { id: 2, name: 'Bob', score: 75 },
    ]

    it('ソートが正常に動作する', () => {
      const sortFn = (a: any, b: any) => b.score - a.score // スコア降順
      const { result } = renderHook(() => 
        useOptimizedSort(testData, sortFn, [])
      )

      expect(result.current).toHaveLength(3)
      expect(result.current[0].name).toBe('Alice') // 95点
      expect(result.current[1].name).toBe('Charlie') // 80点
      expect(result.current[2].name).toBe('Bob') // 75点
    })

    it('元の配列を変更しない', () => {
      const sortFn = (a: any, b: any) => a.name.localeCompare(b.name)
      const { result } = renderHook(() => 
        useOptimizedSort(testData, sortFn, [])
      )

      // ソート結果は名前順
      expect(result.current[0].name).toBe('Alice')
      expect(result.current[1].name).toBe('Bob')
      expect(result.current[2].name).toBe('Charlie')

      // 元の配列は変更されていない
      expect(testData[0].name).toBe('Charlie')
      expect(testData[1].name).toBe('Alice')
      expect(testData[2].name).toBe('Bob')
    })

    it('依存関係が変更されるとソートが再実行される', () => {
      const { result, rerender } = renderHook(
        ({ ascending }) => {
          const sortFn = (a: any, b: any) => {
            return ascending ? a.score - b.score : b.score - a.score
          }
          return useOptimizedSort(testData, sortFn, [ascending])
        },
        { initialProps: { ascending: true } }
      )

      // 昇順ソート
      expect(result.current[0].name).toBe('Bob') // 75点
      expect(result.current[2].name).toBe('Alice') // 95点

      // 降順に変更
      rerender({ ascending: false })

      expect(result.current[0].name).toBe('Alice') // 95点
      expect(result.current[2].name).toBe('Bob') // 75点
    })
  })
})