import { useState, useEffect, useCallback } from 'react';

export interface UseApiQueryOptions<T> {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  staleTime?: number;
  cacheTime?: number;
  retry?: number;
  retryDelay?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export interface UseApiQueryResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  isStale: boolean;
}

// シンプルなキャッシュ実装
const cache = new Map<string, {
  data: any;
  timestamp: number;
  staleTime: number;
}>();

export function useApiQuery<T>(
  key: string | string[],
  queryFn: () => Promise<T>,
  options: UseApiQueryOptions<T> = {}
): UseApiQueryResult<T> {
  const {
    enabled = true,
    refetchOnWindowFocus = false,
    staleTime = 5 * 60 * 1000, // 5分
    cacheTime = 10 * 60 * 1000, // 10分
    retry = 3,
    retryDelay = 1000,
    onSuccess,
    onError
  } = options;

  const cacheKey = Array.isArray(key) ? key.join(':') : key;
  
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const executeQuery = useCallback(async (retryCount = 0) => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await queryFn();
      
      // キャッシュに保存
      cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
        staleTime
      });

      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      
      if (retryCount < retry) {
        setTimeout(() => {
          executeQuery(retryCount + 1);
        }, retryDelay * (retryCount + 1));
      } else {
        setError(error);
        onError?.(error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [enabled, queryFn, cacheKey, staleTime, retry, retryDelay, onSuccess, onError]);

  // 初回実行
  useEffect(() => {
    if (enabled) {
      executeQuery();
    }
  }, [executeQuery]);

  const refetch = useCallback(async () => {
    await executeQuery();
  }, [executeQuery]);

  // データの鮮度チェック
  const cached = cache.get(cacheKey);
  const isStale = !cached || Date.now() - cached.timestamp > staleTime;

  return {
    data,
    isLoading,
    error,
    refetch,
    isStale
  };
} 