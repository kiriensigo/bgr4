// BGGゲーム登録テストスクリプト（変換システム付き）
const testGames = [
  { bgg_id: 161936, name: "パンデミック・レガシー シーズン1" },    // 協力ゲーム
  { bgg_id: 182028, name: "ウイングスパン" },                  // エンジンビルド
  { bgg_id: 120677, name: "テラミスティカ" },                  // エリア支配
  { bgg_id: 36218, name: "ドミニオン" },                      // デッキ構築
  { bgg_id: 12333, name: "トワイライト・ストラグル" }          // 2人用戦略
];

async function testBggConversionRegistration() {
  console.log('🎲 BGG変換システム付きゲーム登録テスト開始...\n');
  
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
        console.log(`   - カテゴリー: ${result.categories?.slice(0, 4).join(', ') || 'N/A'}`);
        console.log(`   - メカニクス: ${result.mechanics?.slice(0, 3).join(', ') || 'N/A'}`);
        console.log(`   - パブリッシャー: ${result.publishers?.slice(0, 2).join(', ') || 'N/A'}`);
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
  
  console.log('🎯 BGG変換システムテスト完了！');
  console.log('📊 登録されたゲームの確認...');
  
  try {
    const response = await fetch('http://localhost:3001/api/games?limit=10');
    const data = await response.json();
    
    console.log(`\n📋 登録済みゲーム: ${data.games?.length || 0}件`);
    if (data.games?.length > 0) {
      data.games.slice(0, 5).forEach((game, index) => {
        console.log(`${index + 1}. ${game.name} (評価: ${game.rating_average || 'N/A'})`);
      });
    }
  } catch (error) {
    console.error('ゲーム一覧取得エラー:', error.message);
  }
}

testBggConversionRegistration();