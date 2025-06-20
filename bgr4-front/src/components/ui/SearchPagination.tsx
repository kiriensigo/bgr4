"use client";

import {
  Box,
  Pagination,
  PaginationProps,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
} from "@mui/material";
import { ReactNode } from "react";

export interface SearchPaginationProps
  extends Omit<PaginationProps, "onChange"> {
  count: number;
  page: number;
  onChange: (event: React.ChangeEvent<unknown>, value: number) => void;
  size?: "small" | "medium" | "large";
  showIfSinglePage?: boolean;
  totalItems?: number;
  currentPageStart?: number;
  currentPageEnd?: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (
    event: React.MouseEvent<HTMLElement>,
    newPageSize: number | null
  ) => void;
  showPageSizeSelector?: boolean;
  children?: ReactNode;
  showFirstButton?: boolean;
  showLastButton?: boolean;
}

// ページサイズの選択肢
const PAGE_SIZE_OPTIONS = [12, 24, 36, 48, 60, 72];

export default function SearchPagination({
  count,
  page,
  onChange,
  size = "medium",
  showIfSinglePage = true,
  totalItems,
  currentPageStart,
  currentPageEnd,
  pageSize,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  onPageSizeChange,
  showPageSizeSelector = true,
  children,
  showFirstButton,
  showLastButton,
  ...props
}: SearchPaginationProps) {
  // ページ数が0の場合は表示しない
  if (count <= 0) {
    return null;
  }

  // showIfSinglePage=falseの場合、ページ数が1の場合は表示しない
  if (!showIfSinglePage && count <= 1) {
    return null;
  }

  // それ以外の場合は表示する（showIfSinglePage=trueの場合、ページ数が1でも表示）
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        justifyContent: "space-between",
        alignItems: { xs: "flex-start", sm: "center" },
        mb: 3,
        gap: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        {/* 表示数情報 */}
        {totalItems !== undefined &&
          currentPageStart !== undefined &&
          currentPageEnd !== undefined && (
            <Typography variant="body2" color="text.secondary">
              {totalItems}件中 {currentPageStart}-{currentPageEnd}件を表示
            </Typography>
          )}

        {/* ページサイズセレクター */}
        {showPageSizeSelector && pageSize !== undefined && onPageSizeChange && (
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
              表示件数:
            </Typography>
            <ToggleButtonGroup
              value={pageSize}
              exclusive
              onChange={onPageSizeChange}
              aria-label="表示件数"
              size="small"
            >
              {pageSizeOptions.map((size) => (
                <ToggleButton
                  key={size}
                  value={size}
                  aria-label={`${size}件表示`}
                >
                  {size}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
        )}

        {children}
      </Box>

      {/* ページネーション */}
      <Pagination
        count={count}
        page={page}
        onChange={onChange}
        color="primary"
        size={size}
        showFirstButton={showFirstButton}
        showLastButton={showLastButton}
        {...props}
      />
    </Box>
  );
}
