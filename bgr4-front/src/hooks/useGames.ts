import useSWR from "swr";
import { fetcher, GamesResponse } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const API_BASE_URL = `${API_URL}/api/v1`;

export function useGames(page: number, pageSize: number, sort: string) {
  const url = `${API_BASE_URL}/games?page=${page}&per_page=${pageSize}&sort_by=${sort}`;

  const { data, error, isLoading } = useSWR<GamesResponse>(url, fetcher, {
    suspense: false,
  });

  return {
    games: data?.games,
    totalPages: data?.totalPages,
    totalItems: data?.totalItems,
    isLoading: isLoading,
    isError: error,
  };
}
