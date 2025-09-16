// BGGプレイ時間範囲テストスクリプト
import xml2js from 'xml2js';

async function testPlaytimeRange() {
  console.log('⏱️ BGGプレイ時間範囲テスト開始...\n');
  
  const testGames = [
    { id: 220308, name: "Gaia Project" },     // 期待値: 60-150分
    { id: 174430, name: "Gloomhaven" },       // 期待値: 60-120分
    { id: 169786, name: "Scythe" },           // 期待値: 90-115分
  ];
  
  for (const game of testGames) {
    try {
      console.log(`🎲 ${game.name} (BGG ID: ${game.id}) のプレイ時間を取得中...`);
      
      const response = await fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${game.id}&stats=1`);
      const xmlData = await response.text();
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(xmlData);
      
      const item = result.items.item[0];
      
      const minPlaytime = item.minplaytime?.[0]?.$.value ? parseInt(item.minplaytime[0].$.value) : null;
      const maxPlaytime = item.maxplaytime?.[0]?.$.value ? parseInt(item.maxplaytime[0].$.value) : null;
      const playingtime = item.playingtime?.[0]?.$.value ? parseInt(item.playingtime[0].$.value) : null;
      
      console.log(`   - 最小プレイ時間: ${minPlaytime || 'なし'}分`);
      console.log(`   - 最大プレイ時間: ${maxPlaytime || 'なし'}分`);
      console.log(`   - プレイ時間: ${playingtime || 'なし'}分`);
      
      if (minPlaytime && maxPlaytime) {
        console.log(`   ✅ 範囲表示: ${minPlaytime}分～${maxPlaytime}分`);
      } else if (playingtime) {
        const estimatedMin = Math.max(15, Math.floor(playingtime * 0.4));
        console.log(`   📊 推定範囲: ${estimatedMin}分～${playingtime}分`);
      }
      
      console.log('');
      
      // レート制限
      await new Promise(resolve => setTimeout(resolve, 1100));
      
    } catch (error) {
      console.error(`❌ エラー: ${error.message}`);
    }
  }
}

testPlaytimeRange();