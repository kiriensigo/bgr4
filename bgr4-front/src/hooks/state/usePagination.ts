import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export interface UsePaginationOptions {
  initialPage?: number;
  pageSize?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  syncWithUrl?: boolean;
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
  // 新しいインターフェース用
  page: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  updateUrl: (params: URLSearchParams) => void;
}

export function usePagination({
  initialPage = 1,
  pageSize: initialPageSize = 20,
  totalCount = 0,
  onPageChange,
  defaultPageSize = 24,
  syncWithUrl = false,
}: UsePaginationOptions = {}): UsePaginationResult {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URLからページ番号を取得、なければinitialPageを使用
  const urlPage = searchParams.get("page");
  const urlPageSize = searchParams.get("per_page");
  
  const [currentPage, setCurrentPage] = useState(() => {
    return urlPage ? parseInt(urlPage, 10) : initialPage;
  });

  const [pageSize, setPageSizeState] = useState(() => {
    return urlPageSize
      ? parseInt(urlPageSize, 10)
      : initialPageSize || defaultPageSize;
  });

  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  const updateURL = useCallback(
    (page: number, newPageSize?: number) => {
    if (!syncWithUrl) return;
    
    const params = new URLSearchParams(searchParams.toString());
      params.set("page", page.toString());
    if (newPageSize) {
        params.set("per_page", newPageSize.toString());
    }
    router.push(`?${params.toString()}`);
    },
    [router, searchParams, syncWithUrl]
  );

  const goToPage = useCallback(
    (page: number) => {
    if (page < 1 || page > totalPages) return;
    
    setCurrentPage(page);
    updateURL(page);
    onPageChange?.(page);
    },
    [totalPages, updateURL, onPageChange]
  );

  const setPage = useCallback(
    (page: number) => {
    goToPage(page);
    },
    [goToPage]
  );

  const setPageSize = useCallback(
    (size: number) => {
    setPageSizeState(size);
    setCurrentPage(1); // ページサイズ変更時は1ページ目に戻る
    updateURL(1, size);
    },
    [updateURL]
  );

  const updateUrl = useCallback(
    (params: URLSearchParams) => {
    if (syncWithUrl) {
      router.push(`?${params.toString()}`);
    }
    },
    [router, syncWithUrl]
  );

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
    goToLastPage,
    // 新しいインターフェース
    page: currentPage,
    setPage,
    setPageSize,
    updateUrl,
  };
}
