import { useState, useEffect, useCallback, useRef } from "react";

export interface UseApiQueryOptions<T> {
  /** 初期データ */
  initialData?: T;
  /** 自動実行を無効化 */
  enabled?: boolean;
  /** ステールタイム（ミリ秒） */
  staleTime?: number;
  /** キャッシュタイム（ミリ秒） */
  cacheTime?: number;
  /** リトライ回数 */
  retryCount?: number;
  /** リトライ間隔（ミリ秒） */
  retryDelay?: number;
  /** エラー時のコールバック */
  onError?: (error: Error) => void;
  /** 成功時のコールバック */
  onSuccess?: (data: T) => void;
}

export interface UseApiQueryResult<T> {
  data: T | undefined;
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  isFetching: boolean;
  refetch: () => Promise<void>;
  invalidate: () => void;
}

// グローバルキャッシュ
const queryCache = new Map<
  string,
  {
    data: any;
    timestamp: number;
    isLoading: boolean;
  }
>();

// ローディング状態のマップ
const loadingQueries = new Set<string>();

/**
 * 統一されたAPIクエリフック
 *
 * 機能:
 * - 自動キャッシュ管理
 * - リトライ機能
 * - ローディング状態管理
 * - エラーハンドリング
 * - 手動リフェッチ
 */
export function useApiQuery<T>(
  queryKey: string,
  queryFn: () => Promise<T>,
  options: UseApiQueryOptions<T> = {}
): UseApiQueryResult<T> {
  const {
    initialData,
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5分
    cacheTime = 10 * 60 * 1000, // 10分
    retryCount = 3,
    retryDelay = 1000,
    onError,
    onSuccess,
  } = options;

  const [data, setData] = useState<T | undefined>(initialData);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const retryCountRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const isError = error !== null;
  const isSuccess = !isError && data !== undefined;

  // キャッシュから初期データを取得
  useEffect(() => {
    const cached = queryCache.get(queryKey);
    if (cached && Date.now() - cached.timestamp < staleTime) {
      setData(cached.data);
    }
  }, [queryKey, staleTime]);

  // データフェッチ関数
  const fetchData = useCallback(
    async (isRefetch = false) => {
      // 無効化されている場合はスキップ
      if (!enabled) return;

      // 既に同じクエリが実行中の場合はスキップ
      if (loadingQueries.has(queryKey) && !isRefetch) {
        return;
      }

      // 前回のリクエストをキャンセル
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setIsFetching(true);
      if (!data) {
        setIsLoading(true);
      }
      setError(null);
      loadingQueries.add(queryKey);

      try {
        // リトライロジック
        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= retryCount; attempt++) {
          try {
            const result = await queryFn();

            // リクエストがキャンセルされていないかチェック
            if (abortController.signal.aborted) {
              return;
            }

            // 成功時の処理
            setData(result);
            setError(null);
            retryCountRef.current = 0;

            // キャッシュに保存
            queryCache.set(queryKey, {
              data: result,
              timestamp: Date.now(),
              isLoading: false,
            });

            onSuccess?.(result);
            break;
          } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));

            // 最後の試行でない場合はリトライ
            if (attempt < retryCount) {
              await new Promise((resolve) =>
                setTimeout(resolve, retryDelay * (attempt + 1))
              );
            }
          }
        }

        // すべてのリトライが失敗した場合
        if (lastError) {
          setError(lastError);
          onError?.(lastError);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
      } finally {
        setIsLoading(false);
        setIsFetching(false);
        loadingQueries.delete(queryKey);
      }
    },
    [
      queryKey,
      queryFn,
      enabled,
      retryCount,
      retryDelay,
      data,
      onError,
      onSuccess,
    ]
  );

  // 手動リフェッチ
  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  // キャッシュ無効化
  const invalidate = useCallback(() => {
    queryCache.delete(queryKey);
  }, [queryKey]);

  // 初回実行とenabled変更時の実行
  useEffect(() => {
    if (enabled) {
      const cached = queryCache.get(queryKey);
      const isCacheValid = cached && Date.now() - cached.timestamp < staleTime;

      if (!isCacheValid) {
        fetchData();
      }
    }
  }, [enabled, queryKey, staleTime, fetchData]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      loadingQueries.delete(queryKey);
    };
  }, [queryKey]);

  return {
    data,
    error,
    isLoading,
    isError,
    isSuccess,
    isFetching,
    refetch,
    invalidate,
  };
}

// キャッシュ管理ユーティリティ
export const queryUtils = {
  /** 全キャッシュをクリア */
  clearAll: () => {
    queryCache.clear();
    loadingQueries.clear();
  },

  /** 特定のキーのキャッシュをクリア */
  clear: (queryKey: string) => {
    queryCache.delete(queryKey);
  },

  /** 期限切れキャッシュを削除 */
  cleanup: (maxAge = 10 * 60 * 1000) => {
    const now = Date.now();
    for (const [key, value] of queryCache) {
      if (now - value.timestamp > maxAge) {
        queryCache.delete(key);
      }
    }
  },

  /** キャッシュサイズを取得 */
  size: () => queryCache.size,
};
