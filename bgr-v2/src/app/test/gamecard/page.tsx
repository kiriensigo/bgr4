import { GameCard } from "@/components/games/GameCard";

// BGGから取得した実データ - 範囲テスト用
const testGames = [
  {
    id: 1,
    bgg_id: 174430,
    name: "Gloomhaven",
    japanese_name: "グルームヘイヴン",
    year_published: 2017,
    min_players: 1,
    max_players: 4,
    playing_time: 120,
    min_playing_time: 60,
    max_playing_time: 120,
    image_url: "/placeholder-game.jpg",
    categories: ["アドベンチャー", "ファンタジー", "協力"],
    mechanics: ["協力", "RPG要素", "カードドリブン"],
    publishers: ["Cephalofair Games"],
    designers: ["Isaac Childres"],
    bgg_categories: [],
    bgg_mechanics: [],
    bgg_publishers: [],
    site_categories: [],
    site_mechanics: [],
    site_publishers: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    bgg_id: 167791,
    name: "Terraforming Mars",
    japanese_name: "テラフォーミング・マーズ",
    year_published: 2016,
    min_players: 1,
    max_players: 5,
    playing_time: 120,
    min_playing_time: 120,
    max_playing_time: 120,
    image_url: "/placeholder-game.jpg",
    categories: ["SF", "宇宙"],
    mechanics: ["ドラフト", "タイル配置"],
    publishers: ["FryxGames"],
    designers: ["Jacob Fryxelius"],
    bgg_categories: [],
    bgg_mechanics: [],
    bgg_publishers: [],
    site_categories: [],
    site_mechanics: [],
    site_publishers: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    bgg_id: 68448,
    name: "7 Wonders",
    japanese_name: "世界の七不思議",
    year_published: 2010,
    min_players: 2,
    max_players: 7,
    playing_time: 30,
    min_playing_time: 30,
    max_playing_time: 30,
    image_url: "/placeholder-game.jpg",
    categories: ["古代", "カードゲーム"],
    mechanics: ["ドラフト", "セット収集"],
    publishers: ["Repos Production"],
    designers: ["Antoine Bauza"],
    bgg_categories: [],
    bgg_mechanics: [],
    bgg_publishers: [],
    site_categories: [],
    site_mechanics: [],
    site_publishers: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export default function TestGameCardPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            GameCard プレイ時間範囲表示テスト
          </h1>
          <p className="text-gray-600">
            BGGから取得したmin/maxプレイ時間データでの範囲表示テスト
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testGames.map((game) => (
            <div key={game.id} className="space-y-2">
              <GameCard game={game as any} />
              <div className="text-xs text-gray-500 bg-white p-2 rounded">
                <div>データ: {game.min_playing_time}分～{game.max_playing_time}分</div>
                <div>
                  期待表示: {game.min_playing_time === game.max_playing_time 
                    ? `${game.playing_time}分` 
                    : `${game.min_playing_time}分～${game.max_playing_time}分`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: "GameCard テスト | BGR",
  description: "プレイ時間範囲表示のテスト",
};