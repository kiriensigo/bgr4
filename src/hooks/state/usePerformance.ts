import { useRef, useCallback, useEffect } from "react";

/**
 * デバウンス処理フック
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * スロットル処理フック
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallRef.current;

      if (timeSinceLastCall >= delay) {
        lastCallRef.current = now;
        callback(...args);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          lastCallRef.current = Date.now();
          callback(...args);
        }, delay - timeSinceLastCall);
      }
    },
    [callback, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
}

/**
 * インターセクション監視フック（無限スクロール等に使用）
 */
export function useIntersectionObserver(
  callback: () => void,
  options: IntersectionObserverInit = {}
) {
  const targetRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const observe = useCallback(
    (element: HTMLElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      if (element) {
        observerRef.current = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting) {
              callback();
            }
          },
          {
            threshold: 0.1,
            ...options,
          }
        );

        observerRef.current.observe(element);
        targetRef.current = element;
      }
    },
    [callback, options]
  );

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return { observe, targetRef };
}

/**
 * 仮想スクロール用フック
 */
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan = 5
) {
  const totalHeight = items.length * itemHeight;
  const visibleStart = useRef(0);
  const visibleEnd = useRef(Math.ceil(containerHeight / itemHeight));

  const updateVisibleRange = useCallback(
    (scrollTop: number) => {
      const start = Math.floor(scrollTop / itemHeight);
      const end = Math.min(
        items.length,
        start + Math.ceil(containerHeight / itemHeight) + overscan
      );

      visibleStart.current = Math.max(0, start - overscan);
      visibleEnd.current = end;
    },
    [items.length, itemHeight, containerHeight, overscan]
  );

  const getVisibleItems = useCallback(() => {
    return items.slice(visibleStart.current, visibleEnd.current);
  }, [items]);

  const getItemStyle = useCallback(
    (index: number) => ({
      position: "absolute" as const,
      top: (visibleStart.current + index) * itemHeight,
      height: itemHeight,
      width: "100%",
    }),
    [itemHeight]
  );

  return {
    totalHeight,
    updateVisibleRange,
    getVisibleItems,
    getItemStyle,
    visibleStart: visibleStart.current,
    visibleEnd: visibleEnd.current,
  };
}

/**
 * メモ化コールバックフック（依存関係の自動最適化）
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  return useCallback(
    (...args: Parameters<T>) => callbackRef.current(...args),
    []
  ) as T;
}

/**
 * 前回の値を記憶するフック
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
}

/**
 * マウント状態を追跡するフック
 */
export function useIsMounted() {
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return useCallback(() => isMountedRef.current, []);
}
