// プレイ時間表示テストスクリプト
async function testPlaytimeDisplay() {
  console.log('⏱️ プレイ時間表示テスト開始...\n');
  
  try {
    // ゲーム一覧を取得
    const response = await fetch('http://localhost:3001/api/games?limit=5');
    const data = await response.json();
    
    if (!data.games || data.games.length === 0) {
      console.log('❌ ゲームが見つかりません');
      return;
    }
    
    console.log('🎮 登録済みゲームのプレイ時間表示:');
    
    data.games.forEach((game, index) => {
      const maxTime = game.playing_time;
      if (!maxTime) {
        console.log(`${index + 1}. ${game.name}: プレイ時間不明`);
        return;
      }
      
      // 同じロジックでプレイ時間範囲を計算
      let minTime;
      if (maxTime <= 60) {
        minTime = Math.max(15, Math.floor(maxTime * 0.7));
      } else if (maxTime <= 120) {
        minTime = Math.max(30, Math.floor(maxTime * 0.5));
      } else {
        minTime = Math.max(60, Math.floor(maxTime * 0.6));
      }
      
      const formatTime = (minutes) => {
        if (minutes < 60) return `${minutes}分`;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return remainingMinutes > 0 ? `${hours}時間${remainingMinutes}分` : `${hours}時間`;
      };
      
      let displayTime;
      if (maxTime - minTime <= 15) {
        displayTime = formatTime(maxTime);
      } else {
        displayTime = `${formatTime(minTime)}～${formatTime(maxTime)}`;
      }
      
      console.log(`${index + 1}. ${game.name}`);
      console.log(`   最大プレイ時間: ${maxTime}分`);
      console.log(`   表示: ${displayTime}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

testPlaytimeDisplay();