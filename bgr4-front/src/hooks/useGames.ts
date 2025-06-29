import useSWR from "swr";
import { fetcher, searchGames, GamesResponse } from "../lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const API_BASE_URL = `${API_URL}/api/v1`;

interface UseGamesParams {
  type?: "list" | "search";
  filters?: Record<string, any>;
  enabled?: boolean;
  page?: number;
  pageSize?: number;
  sort?: string;
}

// 通常のリスト用
export function useGames(page: number, pageSize: number, sort: string): any;
// 検索・フィルター用
export function useGames(params: UseGamesParams): any;

export function useGames(
  pageOrParams: number | UseGamesParams,
  pageSize?: number,
  sort?: string
) {
  // パラメータの正規化
  const isObjectParam = typeof pageOrParams === "object";
  const {
    type = "list",
    filters = {},
    enabled = true,
    page = isObjectParam
      ? (pageOrParams as UseGamesParams).filters?.page || 1
      : (pageOrParams as number),
    pageSize: finalPageSize = isObjectParam
      ? (pageOrParams as UseGamesParams).filters?.per_page || 24
      : pageSize || 24,
    sort: finalSort = isObjectParam
      ? (pageOrParams as UseGamesParams).filters?.sort_by || "created_at"
      : sort || "created_at",
  } = isObjectParam ? (pageOrParams as UseGamesParams) : {};

  // URLまたは検索パラメータの構築
  const swrKey =
    type === "search"
      ? enabled
        ? ["search", filters]
        : null
      : enabled
      ? `${API_BASE_URL}/games?page=${page}&per_page=${finalPageSize}&sort_by=${finalSort}`
      : null;

  const { data, error, isLoading } = useSWR<GamesResponse>(
    swrKey,
    async (key) => {
      if (type === "search" && Array.isArray(key)) {
        // 検索用
        const [, searchFilters] = key;
        return searchGames(searchFilters);
      } else if (typeof key === "string") {
        // 通常のリスト用
        return fetcher(key);
      }
      throw new Error("Invalid SWR key");
    },
    {
      suspense: false,
      revalidateOnFocus: false,
    }
  );

  return {
    data: data,
    games: data?.games,
    pagination: data?.pagination,
    totalPages: data?.totalPages,
    totalItems: data?.totalItems,
    loading: isLoading,
    isLoading: isLoading,
    error: error,
    isError: error,
  };
}
