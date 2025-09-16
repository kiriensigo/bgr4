// 全ゲーム削除スクリプト
const API_BASE = 'http://localhost:3001';

async function deleteAllGames() {
  try {
    console.log('🗑️ 全ゲームを削除中...');
    
    // まず全ゲーム一覧を取得
    const listResponse = await fetch(`${API_BASE}/api/games`);
    const listData = await listResponse.json();
    const games = listData.data || [];
    
    console.log(`📊 削除対象: ${games.length}件のゲーム`);
    
    if (games.length === 0) {
      console.log('ℹ️ 削除対象のゲームはありません');
      return;
    }
    
    // 各ゲームを個別に削除
    for (const game of games) {
      console.log(`🔄 削除中: ${game.name} (ID: ${game.id})`);
      
      const deleteResponse = await fetch(`${API_BASE}/api/games/${game.id}`, {
        method: 'DELETE'
      });
      
      if (deleteResponse.ok) {
        console.log(`✅ 削除完了: ${game.name}`);
      } else {
        const errorText = await deleteResponse.text();
        console.log(`❌ 削除失敗: ${game.name} - ${errorText}`);
      }
    }
    
    console.log('');
    console.log('🎯 全ゲーム削除完了！');
    
    // 確認のため再度カウント
    const checkResponse = await fetch(`${API_BASE}/api/games`);
    const checkData = await checkResponse.json();
    const remainingGames = checkData.data || [];
    console.log(`📈 残存ゲーム数: ${remainingGames.length}件`);
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

deleteAllGames();