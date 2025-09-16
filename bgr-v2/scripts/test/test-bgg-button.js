// BGGボタンテストスクリプト
async function testBggButton() {
  console.log('🔗 BGGボタンテスト開始...\n');
  
  try {
    // ゲーム一覧を取得
    const response = await fetch('http://localhost:3001/api/games?limit=5');
    const data = await response.json();
    
    if (!data.games || data.games.length === 0) {
      console.log('❌ ゲームが見つかりません');
      return;
    }
    
    console.log('📋 登録済みゲームとBGGリンク:');
    
    data.games.forEach((game, index) => {
      const bggUrl = getBggUrl(game.bgg_id);
      console.log(`${index + 1}. ${game.name}`);
      console.log(`   BGG ID: ${game.bgg_id}`);
      console.log(`   BGGリンク: ${bggUrl || 'なし（手動登録）'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

function getBggUrl(bggId) {
  if (!bggId) return null;
  // bgg_idが数値の場合とjp-で始まる手動登録の場合を判別
  if (typeof bggId === 'number' || !bggId.toString().startsWith('jp-')) {
    return `https://boardgamegeek.com/boardgame/${bggId}`;
  }
  return null;
}

testBggButton();