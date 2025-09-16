// BGGゲーム登録テストスクリプト
const testGames = [
  { bgg_id: 174430, name: "Gloomhaven" },           // 人気協力ゲーム
  { bgg_id: 220308, name: "Gaia Project" },         // 重ゲー戦略
  { bgg_id: 169786, name: "Scythe" },               // エリア支配
  { bgg_id: 224517, name: "Brass: Birmingham" },    // 経済ゲーム  
  { bgg_id: 31260, name: "Agricola" }               // ワーカープレイスメント
];

async function testBggRegistration() {
  console.log('🎲 BGGゲーム登録テスト開始...\n');
  
  for (const game of testGames) {
    try {
      console.log(`📝 ${game.name} (BGG ID: ${game.bgg_id}) を登録中...`);
      
      const response = await fetch('http://localhost:3001/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          game: { bgg_id: game.bgg_id },
          auto_register: true
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ 登録成功: ${result.name}`);
        console.log(`   - 評価: ${result.rating_average || 'N/A'}`);
        console.log(`   - カテゴリー: ${result.categories?.slice(0, 3).join(', ') || 'N/A'}`);
        console.log(`   - メカニクス: ${result.mechanics?.slice(0, 3).join(', ') || 'N/A'}`);
      } else {
        const error = await response.json();
        console.log(`❌ 登録失敗: ${error.error || 'Unknown error'}`);
      }
      
      console.log('');
      
      // レート制限のため1秒待機
      await new Promise(resolve => setTimeout(resolve, 1100));
      
    } catch (error) {
      console.error(`❌ エラー: ${error.message}`);
    }
  }
  
  console.log('🎯 テスト完了！');
}

testBggRegistration();