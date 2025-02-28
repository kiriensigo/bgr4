"use client";

import { Box, Pagination, PaginationProps, ToggleButtonGroup, ToggleButton, Typography } from "@mui/material";
import { ReactNode } from "react";

export interface SearchPaginationProps extends Omit<PaginationProps, "onChange"> {
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
  onPageSizeChange?: (event: React.MouseEvent<HTMLElement>, newPageSize: number | null) => void;
  showPageSizeSelector?: boolean;
  children?: ReactNode;
}

export default function SearchPagination({
  count,
  page,
  onChange,
  size = "medium",
  showIfSinglePage = false,
  totalItems,
  currentPageStart,
  currentPageEnd,
  pageSize,
  pageSizeOptions = [12, 24, 36],
  onPageSizeChange,
  showPageSizeSelector = true,
  children,
  ...props
}: SearchPaginationProps) {
  // 1ページしかない場合は表示しない（オプションで変更可能）
  if (count <= 1 && !showIfSinglePage) {
    return null;
  }

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
        {totalItems !== undefined && currentPageStart !== undefined && currentPageEnd !== undefined && (
          <Typography variant="body2" color="text.secondary">
            {totalItems}件中 {currentPageStart}-{currentPageEnd}件を表示
          </Typography>
        )}

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
                <ToggleButton key={size} value={size} aria-label={`${size}件表示`}>
                  {size}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
        )}

        {children}
      </Box>

      <Pagination
        count={count}
        page={page}
        onChange={onChange}
        color="primary"
        size={size}
        {...props}
      />
    </Box>
  );
} 