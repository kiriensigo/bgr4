// データベース完全クリーンアップスクリプト
const API_BASE = 'http://localhost:3001';

async function cleanAllGameData() {
  try {
    console.log('🧹 データベース完全クリーンアップ開始');
    console.log('='.repeat(50));
    console.log('');
    
    // 1. 全ゲーム取得
    console.log('📋 1. 現在のゲームデータ確認中...');
    const listResponse = await fetch(`${API_BASE}/api/games`);
    const listData = await listResponse.json();
    const games = listData.games || listData.data || [];
    
    console.log(`📊 削除対象: ${games.length}件のゲーム`);
    
    if (games.length === 0) {
      console.log('ℹ️ 削除対象のゲームはありません');
    } else {
      // 2. 各ゲームを個別に削除
      console.log('');
      console.log('🗑️ 2. ゲームデータ削除実行中...');
      
      for (const game of games) {
        console.log(`🔄 削除中: ${game.name} (ID: ${game.id})`);
        
        try {
          const deleteResponse = await fetch(`${API_BASE}/api/games/${game.id}`, {
            method: 'DELETE'
          });
          
          if (deleteResponse.ok) {
            console.log(`✅ 削除完了: ${game.name}`);
          } else {
            const errorText = await deleteResponse.text();
            console.log(`❌ 削除失敗: ${game.name} - ${errorText}`);
          }
        } catch (error) {
          console.log(`❌ エラー: ${game.name} - ${error.message}`);
        }
      }
    }
    
    // 3. 確認
    console.log('');
    console.log('🔍 3. クリーンアップ結果確認...');
    const checkResponse = await fetch(`${API_BASE}/api/games`);
    const checkData = await checkResponse.json();
    const remainingGames = checkData.games || checkData.data || [];
    
    console.log(`📈 残存ゲーム数: ${remainingGames.length}件`);
    
    if (remainingGames.length === 0) {
      console.log('✅ データベースクリーンアップ完了！');
      console.log('');
      console.log('🎯 次のステップ:');
      console.log('   - 新しいゲームを登録してマッピングテストを実行');
      console.log('   - BGG正式マッピング仕様の動作確認');
    } else {
      console.log('⚠️ 一部のゲームが残存しています:');
      remainingGames.forEach(game => {
        console.log(`   - ${game.name} (ID: ${game.id})`);
      });
    }
    
    console.log('');
    console.log('🏁 クリーンアップ処理完了');
    
  } catch (error) {
    console.error('❌ 全体エラー:', error.message);
  }
}

cleanAllGameData();