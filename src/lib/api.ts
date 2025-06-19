import { Game, PaginatedResponse } from "@/types/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api/v1";

async function fetcher<T>(path: string): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    // next: { revalidate: 3600 } // 1時間キャッシュ
  });

  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error(`Failed to fetch data from ${url}`);
  }

  return res.json();
}

export async function getGames(
  page = 1,
  sort = "created_at_desc",
  query = ""
): Promise<PaginatedResponse<Game>> {
  const path = `/games?page=${page}&sort_by=${sort}&query=${encodeURIComponent(
    query
  )}`;
  const data = await fetcher<{
    games: Game[];
    total_pages: number;
    current_page: number;
  }>(path);
  return {
    items: data.games,
    total_pages: data.total_pages,
    current_page: data.current_page,
  };
}

export async function getGame(id: string): Promise<Game> {
  const data = await fetcher<{ game: Game }>(`/games/${id}`);
  return data.game;
}
