// ゲーム全削除 → 新規5件登録テスト
console.log('🗑️  ゲームデータベース リセット & 新規登録テスト\n');

const API_BASE = 'http://localhost:3001';

// テスト用ゲーム5件（人気ゲーム）
const testGames = [
  { bggId: 174430, name: 'Gloomhaven' },
  { bggId: 224517, name: 'Brass: Birmingham' },
  { bggId: 13, name: 'CATAN' },
  { bggId: 30549, name: 'Pandemic' },
  { bggId: 36218, name: 'Dominion' }
];

async function deleteAllGames() {
  console.log('🗑️  既存ゲームを全削除中...');
  
  try {
    // 全ゲーム取得
    const listResponse = await fetch(`${API_BASE}/api/games?limit=100`);
    const listData = await listResponse.json();
    
    if (!listData.games || listData.games.length === 0) {
      console.log('📭 削除対象のゲームはありません');
      return;
    }
    
    console.log(`📊 ${listData.games.length}個のゲームを削除します...`);
    
    // 各ゲームを削除
    let deletedCount = 0;
    for (const game of listData.games) {
      try {
        const deleteResponse = await fetch(`${API_BASE}/api/games/${game.id}`, {
          method: 'DELETE'
        });
        
        if (deleteResponse.ok) {
          console.log(`   ✅ ${game.name} (ID: ${game.id}) 削除完了`);
          deletedCount++;
        } else {
          console.log(`   ❌ ${game.name} (ID: ${game.id}) 削除失敗`);
        }
      } catch (error) {
        console.log(`   ❌ ${game.name} 削除エラー: ${error.message}`);
      }
      
      // API負荷軽減のため少し待機
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`🎯 削除完了: ${deletedCount}/${listData.games.length}個\n`);
    
  } catch (error) {
    console.error('❌ 削除処理エラー:', error.message);
  }
}

async function registerNewGame(game, index) {
  console.log(`🔄 ${index + 1}/5: ${game.name} (BGG: ${game.bggId}) 登録中...`);
  
  try {
    const response = await fetch(`${API_BASE}/api/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        game: {
          bggId: game.bggId
        },
        auto_register: false,
        manual_registration: false
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   ❌ 登録失敗: ${errorText}`);
      return null;
    }
    
    const result = await response.json();
    console.log(`   ✅ 登録成功 (ID: ${result.id})`);
    
    // データ構造確認
    const hasNewFields = result.bgg_categories !== undefined || result.site_categories !== undefined;
    console.log(`   📊 新フィールド対応: ${hasNewFields ? '✅' : '❌'}`);
    
    if (hasNewFields) {
      console.log(`   🔍 BGGカテゴリー: ${result.bgg_categories?.length || 0}個`);
      console.log(`   🎯 サイトカテゴリー: ${result.site_categories?.length || 0}個`);
      console.log(`   🔍 BGGメカニクス: ${result.bgg_mechanics?.length || 0}個`);
      console.log(`   🎯 サイトメカニクス: ${result.site_mechanics?.length || 0}個`);
    } else {
      console.log(`   📋 既存フィールド: カテゴリー${result.categories?.length || 0}個, メカニクス${result.mechanics?.length || 0}個`);
    }
    
    console.log('');
    return result;
    
  } catch (error) {
    console.log(`   ❌ 接続エラー: ${error.message}`);
    return null;
  }
}

async function runFullTest() {
  console.log('🚀 ゲームデータベース フルリセット & テスト開始\n');
  
  // ステップ1: 全削除
  await deleteAllGames();
  
  // ステップ2: 新規登録
  console.log('📝 新規ゲーム登録開始...\n');
  
  const results = [];
  for (let i = 0; i < testGames.length; i++) {
    const result = await registerNewGame(testGames[i], i);
    if (result) {
      results.push(result);
    }
    
    // API負荷軽減
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // ステップ3: 結果サマリー
  console.log('🎯 登録結果サマリー:');
  console.log(`✅ 成功: ${results.length}/${testGames.length}個`);
  
  if (results.length > 0) {
    console.log('');
    console.log('📋 登録済みゲーム:');
    results.forEach((game, index) => {
      console.log(`   ${index + 1}. ${game.name} (ID: ${game.id})`);
    });
    
    console.log('');
    console.log('🖥️  確認用URL:');
    results.slice(0, 3).forEach((game, index) => {
      console.log(`   ${index + 1}. http://localhost:3001/games/${game.id}`);
    });
    
    console.log('');
    console.log('✅ テスト完了！ブラウザで確認してください。');
  }
}

runFullTest();