import { NextResponse } from 'next/server'

// min/max時間データを含むテスト用ゲームデータ
const gamesWithRange = [
  {
    id: 25,
    bgg_id: 167791,
    name: "Terraforming Mars",
    year_published: 2016,
    min_players: 1,
    max_players: 5,
    playing_time: 120,
    min_playing_time: 90,
    max_playing_time: 150,
    image_url: "https://cf.geekdo-images.com/wg9oOLcsKvDesSUdZQ4rxw__original/img/thIqWDnH9utKuoKVEUqveDixprI=/0x0/filters:format(jpeg)/pic3536616.jpg",
    categories: ["SF", "宇宙"],
    mechanics: ["ドラフト", "タイル配置"],
    designers: ["Jacob Fryxelius"],
    rating_average: 8.35,
    created_at: "2025-08-17T14:38:41.793Z",
    updated_at: "2025-08-17T14:38:41.793Z"
  },
  {
    id: 24,
    bgg_id: 68448,
    name: "7 Wonders",
    year_published: 2010,
    min_players: 2,
    max_players: 7,
    playing_time: 30,
    min_playing_time: 30,
    max_playing_time: 30,
    image_url: "https://cf.geekdo-images.com/35h9Za_JvMMMtx_92kT0Jg__original/img/jt70jJDZ1y1FWJs4ZQf5FI8APVY=/0x0/filters:format(jpeg)/pic7149798.jpg",
    categories: ["カードゲーム"],
    mechanics: ["ドラフト", "セット収集"],
    designers: ["Antoine Bauza"],
    rating_average: 7.67,
    created_at: "2025-08-17T14:38:40.831Z",
    updated_at: "2025-08-17T14:38:40.831Z"
  },
  {
    id: 1,
    bgg_id: 174430,
    name: "Gloomhaven",
    year_published: 2017,
    min_players: 1,
    max_players: 4,
    playing_time: 120,
    min_playing_time: 60,
    max_playing_time: 120,
    image_url: "/placeholder-game.jpg",
    categories: ["アドベンチャー", "ファンタジー"],
    mechanics: ["協力", "RPG要素"],
    designers: ["Isaac Childres"],
    rating_average: 8.8,
    created_at: "2025-08-17T14:38:39.817Z",
    updated_at: "2025-08-17T14:38:39.817Z"
  }
]

export async function GET() {
  return NextResponse.json({
    games: gamesWithRange,
    total: gamesWithRange.length,
    page: 1,
    limit: 20,
    totalPages: 1
  })
}