import { useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface UsePaginationOptions {
  /** 初期ページ */
  initialPage?: number;
  /** 初期ページサイズ */
  initialPageSize?: number;
  /** 使用可能なページサイズオプション */
  pageSizeOptions?: number[];
  /** URLパラメータとの同期 */
  syncWithUrl?: boolean;
  /** ページ変更時のコールバック */
  onPageChange?: (page: number, pageSize: number) => void;
}

interface UsePaginationResult {
  // 現在の状態
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  
  // 計算された値
  startItem: number;
  endItem: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  
  // アクション
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setTotalItems: (total: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  
  // ユーティリティ
  getPageInfo: () => string;
  reset: () => void;
}

/**
 * 統一されたページネーション管理フック
 * 
 * 機能:
 * - ページ状態管理
 * - URL同期
 * - ページ情報計算
 * - ナビゲーション機能
 */
export function usePagination({
  initialPage = 1,
  initialPageSize = 24,
  pageSizeOptions = [12, 24, 48, 96],
  syncWithUrl = true,
  onPageChange,
}: UsePaginationOptions = {}): UsePaginationResult {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URLから初期値を取得
  const urlPage = syncWithUrl ? parseInt(searchParams.get('page') || '1') : initialPage;
  const urlPageSize = syncWithUrl ? parseInt(searchParams.get('pageSize') || String(initialPageSize)) : initialPageSize;
  
  const [currentPage, setCurrentPage] = useState(urlPage);
  const [pageSize, setCurrentPageSize] = useState(urlPageSize);
  const [totalItems, setTotalItems] = useState(0);
  
  // 総ページ数を計算
  const totalPages = useMemo(() => {
    return totalItems > 0 ? Math.ceil(totalItems / pageSize) : 0;
  }, [totalItems, pageSize]);
  
  // アイテム範囲を計算
  const startItem = useMemo(() => {
    return totalItems > 0 ? Math.max((currentPage - 1) * pageSize + 1, 1) : 0;
  }, [currentPage, pageSize, totalItems]);
  
  const endItem = useMemo(() => {
    return totalItems > 0 ? Math.min(currentPage * pageSize, totalItems) : 0;
  }, [currentPage, pageSize, totalItems]);
  
  // ナビゲーション状態
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;
  
  // URLを更新する関数
  const updateUrl = useCallback((newPage: number, newPageSize: number) => {
    if (!syncWithUrl) return;
    
    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    params.set('pageSize', String(newPageSize));
    
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    router.push(newUrl, { scroll: false });
  }, [router, searchParams, syncWithUrl]);
  
  // ページ設定
  const setPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages || 1));
    setCurrentPage(validPage);
    updateUrl(validPage, pageSize);
    onPageChange?.(validPage, pageSize);
  }, [totalPages, pageSize, updateUrl, onPageChange]);
  
  // ページサイズ設定
  const setPageSize = useCallback((size: number) => {
    const validPageSize = pageSizeOptions.includes(size) ? size : initialPageSize;
    setCurrentPageSize(validPageSize);
    
    // ページサイズ変更時は1ページ目に戻る
    const newPage = 1;
    setCurrentPage(newPage);
    updateUrl(newPage, validPageSize);
    onPageChange?.(newPage, validPageSize);
  }, [pageSizeOptions, initialPageSize, updateUrl, onPageChange]);
  
  // ナビゲーション関数
  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setPage(currentPage + 1);
    }
  }, [hasNextPage, currentPage, setPage]);
  
  const prevPage = useCallback(() => {
    if (hasPrevPage) {
      setPage(currentPage - 1);
    }
  }, [hasPrevPage, currentPage, setPage]);
  
  const firstPage = useCallback(() => {
    setPage(1);
  }, [setPage]);
  
  const lastPage = useCallback(() => {
    if (totalPages > 0) {
      setPage(totalPages);
    }
  }, [totalPages, setPage]);
  
  // ページ情報文字列を生成
  const getPageInfo = useCallback(() => {
    if (totalItems === 0) {
      return 'アイテムがありません';
    }
    return `${startItem}〜${endItem}件 / 全${totalItems}件中`;
  }, [startItem, endItem, totalItems]);
  
  // リセット関数
  const reset = useCallback(() => {
    setCurrentPage(initialPage);
    setCurrentPageSize(initialPageSize);
    setTotalItems(0);
    if (syncWithUrl) {
      updateUrl(initialPage, initialPageSize);
    }
  }, [initialPage, initialPageSize, syncWithUrl, updateUrl]);
  
  return {
    // 現在の状態
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    
    // 計算された値
    startItem,
    endItem,
    hasNextPage,
    hasPrevPage,
    
    // アクション
    setPage,
    setPageSize,
    setTotalItems,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    
    // ユーティリティ
    getPageInfo,
    reset,
  };
} 