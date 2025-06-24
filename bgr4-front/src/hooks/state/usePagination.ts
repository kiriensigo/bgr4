import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export interface UsePaginationOptions {
  initialPage?: number;
  pageSize?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
}

export interface UsePaginationResult {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
}

export function usePagination({
  initialPage = 1,
  pageSize = 20,
  totalCount = 0,
  onPageChange
}: UsePaginationOptions = {}): UsePaginationResult {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URLからページ番号を取得、なければinitialPageを使用
  const urlPage = searchParams.get('page');
  const [currentPage, setCurrentPage] = useState(() => {
    return urlPage ? parseInt(urlPage, 10) : initialPage;
  });

  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  const updateURL = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  const goToPage = useCallback((page: number) => {
    if (page < 1 || page > totalPages) return;
    
    setCurrentPage(page);
    updateURL(page);
    onPageChange?.(page);
  }, [totalPages, updateURL, onPageChange]);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      goToPage(currentPage + 1);
    }
  }, [hasNextPage, goToPage, currentPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      goToPage(currentPage - 1);
    }
  }, [hasPreviousPage, goToPage, currentPage]);

  const goToFirstPage = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  const goToLastPage = useCallback(() => {
    goToPage(totalPages);
  }, [goToPage, totalPages]);

  return {
    currentPage,
    pageSize,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    nextPage,
    previousPage,
    goToFirstPage,
    goToLastPage
  };
} 