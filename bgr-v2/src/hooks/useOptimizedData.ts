import { useMemo, useCallback } from 'react'

export function useOptimizedSearch(onSearch: (query: string) => void, delay = 300) {
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout
      return (query: string) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          onSearch(query)
        }, delay)
      }
    })(),
    [onSearch, delay]
  )
  
  return debouncedSearch
}

export function useOptimizedFilter<T>(
  data: T[], 
  filterFn: (item: T) => boolean, 
  deps: readonly unknown[]
): T[] {
  return useMemo(() => {
    return data.filter(filterFn)
  }, [data, ...deps])
}

export function useOptimizedSort<T>(
  data: T[], 
  sortFn: (a: T, b: T) => number, 
  deps: readonly unknown[]
): T[] {
  return useMemo(() => {
    return [...data].sort(sortFn)
  }, [data, ...deps])
}

export function useOptimizedMap<T, U>(data: T[], mapFn: (item: T) => U, deps: any[]) {
  return useMemo(() => {
    return data.map(mapFn)
  }, [data, mapFn, ...deps])
}