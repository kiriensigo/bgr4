import { getGames } from "@/lib/api";
import GameGrid from "@/components/GameGrid";
import { Box } from "@mui/material";

export default async function HomePage() {
  // TODO: 本来は別々のエンドポイントから取得する
  const latestGamesData = await getGames(1);
  const popularGamesData = await getGames(2); // 仮で2ページ目を取得

  return (
    <Box>
      <GameGrid title="新着ゲーム" games={latestGamesData.items} />
      <GameGrid title="注目のゲーム" games={popularGamesData.items} />
    </Box>
  );
}
