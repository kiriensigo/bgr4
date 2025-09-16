// 5件のゲーム登録スクリプト
const API_BASE = 'http://localhost:3001';

// マッピングテストに適した多様なゲーム選択
const testGames = [
  { bggId: 30549, name: 'Pandemic' },              // 協力ゲーム、セット収集
  { bggId: 167791, name: 'Terraforming Mars' },    // ソロ向き、タイル配置、ドラフト
  { bggId: 36218, name: 'Dominion' },              // デッキビルド、カードゲーム
  { bggId: 68448, name: '7 Wonders' },             // ドラフト、セット収集、文明
  { bggId: 174430, name: 'Gloomhaven' }            // 協力、レガシー、RPG要素
];

async function register5Games() {
  try {
    console.log('🎮 5件のゲーム登録開始');
    console.log('');
    
    const results = [];
    
    for (let i = 0; i < testGames.length; i++) {
      const game = testGames[i];
      console.log(`${i + 1}/5 🚀 ${game.name} (BGG: ${game.bggId}) を登録中...`);
      
      try {
        const response = await fetch(`${API_BASE}/api/games`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            game: { bggId: game.bggId },
            auto_register: false,
            manual_registration: false
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.log(`❌ 失敗: ${errorText}`);
          results.push({ ...game, status: 'failed', error: errorText });
          continue;
        }
        
        const result = await response.json();
        console.log(`✅ 成功: ${result.name}`);
        console.log(`   カテゴリー: [${result.categories.join(', ')}]`);
        console.log(`   メカニクス: [${result.mechanics.join(', ')}]`);
        console.log('');
        
        results.push({
          ...game,
          status: 'success',
          actualName: result.name,
          categories: result.categories,
          mechanics: result.mechanics,
          id: result.id
        });
        
      } catch (error) {
        console.log(`❌ エラー: ${error.message}`);
        results.push({ ...game, status: 'error', error: error.message });
      }
    }
    
    console.log('📊 登録結果サマリー:');
    console.log('');
    
    const successful = results.filter(r => r.status === 'success');
    const failed = results.filter(r => r.status !== 'success');
    
    console.log(`✅ 成功: ${successful.length}件`);
    successful.forEach(game => {
      console.log(`   - ${game.actualName || game.name}`);
    });
    
    if (failed.length > 0) {
      console.log(`❌ 失敗: ${failed.length}件`);
      failed.forEach(game => {
        console.log(`   - ${game.name}: ${game.error}`);
      });
    }
    
    console.log('');
    console.log('🎯 登録完了！マッピング結果の詳細確認を実行してください。');
    
    return results;
    
  } catch (error) {
    console.error('❌ 全体エラー:', error.message);
  }
}

register5Games();