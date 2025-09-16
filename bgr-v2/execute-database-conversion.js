// 実際にデータベースに変換処理を適用
console.log('🚀 データベース日本語変換実行...\n');

const API_BASE = 'http://localhost:3001';

// 変換対象ゲーム（前のスクリプトの結果）
const gameUpdates = [
  {
    id: 10,
    name: 'Brass: Birmingham',
    categories: [],
    mechanics: ['タイル配置']
  },
  {
    id: 7,
    name: 'Gloomhaven',
    categories: ['レガシー・キャンペーン', 'ソロ向き'],
    mechanics: ['協力']
  },
  {
    id: 12,
    name: 'Pandemic Legacy: Season 1',
    categories: ['レガシー・キャンペーン'],
    mechanics: ['協力', 'セット収集']
  },
  {
    id: 8,
    name: 'Gaia Project',
    categories: ['ソロ向き'],
    mechanics: []
  },
  {
    id: 13,
    name: 'Through the Ages: A New Story of Civilization',
    categories: ['カードゲーム'],
    mechanics: ['オークション']
  },
  {
    id: 16,
    name: 'Twilight Struggle',
    categories: ['ウォーゲーム'],
    mechanics: ['エリア支配', 'ダイスロール']
  },
  {
    id: 9,
    name: 'Scythe',
    categories: ['ソロ向き'],
    mechanics: ['エリア支配']
  },
  {
    id: 11,
    name: 'Agricola',
    categories: ['動物', 'ソロ向き'],
    mechanics: ['ワカプレ']
  },
  {
    id: 15,
    name: 'Dominion',
    categories: ['カードゲーム'],
    mechanics: ['デッキ/バッグビルド']
  }
];

async function updateGameInDatabase(game) {
  try {
    console.log(`🔄 ${game.name} (ID: ${game.id}) を更新中...`);
    
    const response = await fetch(`${API_BASE}/api/games/${game.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        categories: game.categories,
        mechanics: game.mechanics
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`   ✅ 更新成功`);
      console.log(`   📝 カテゴリー: ${game.categories.join(', ') || '(なし)'}`);
      console.log(`   📝 メカニクス: ${game.mechanics.join(', ') || '(なし)'}`);
      return { success: true, game: game.name };
    } else {
      const error = await response.json();
      console.log(`   ❌ 更新失敗: ${error.message}`);
      return { success: false, game: game.name, error: error.message };
    }
  } catch (error) {
    console.log(`   ❌ 接続エラー: ${error.message}`);
    return { success: false, game: game.name, error: error.message };
  }
}

async function executeAllUpdates() {
  console.log(`📊 ${gameUpdates.length}個のゲームを更新します...\n`);
  
  const results = [];
  
  for (const game of gameUpdates) {
    const result = await updateGameInDatabase(game);
    results.push(result);
    console.log(''); // 空行
    
    // レート制限を避けるため少し待機
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // 結果サマリー
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log('🎯 更新結果サマリー:');
  console.log(`✅ 成功: ${successful.length}個`);
  console.log(`❌ 失敗: ${failed.length}個`);
  
  if (failed.length > 0) {
    console.log('\n❌ 失敗したゲーム:');
    failed.forEach(f => console.log(`   - ${f.game}: ${f.error}`));
  }
  
  if (successful.length === gameUpdates.length) {
    console.log('\n🎉 全ての更新が完了しました！');
    console.log('📋 次のステップ:');
    console.log('1. ブラウザでゲーム詳細ページを確認');
    console.log('2. 日本語表示されていることを確認');
    console.log('3. フロントエンド変換ロジックを削除');
  }
}

executeAllUpdates();