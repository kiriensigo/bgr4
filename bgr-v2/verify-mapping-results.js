// マッピング結果詳細確認スクリプト
const API_BASE = 'http://localhost:3001';

async function verifyMappingResults() {
  try {
    console.log('🔍 BGGマッピング結果詳細確認');
    console.log('='.repeat(50));
    console.log('');
    
    // 全ゲーム取得
    const response = await fetch(`${API_BASE}/api/games`);
    const data = await response.json();
    const games = data.data || [];
    
    console.log(`📊 登録ゲーム数: ${games.length}件`);
    console.log('');
    
    const japaneseRegex = /[あ-ん|ア-ン|一-龯]/;
    let totalCategories = 0;
    let totalMechanics = 0;
    let japaneseCategories = 0;
    let japaneseMechanics = 0;
    
    games.forEach((game, index) => {
      console.log(`${index + 1}. ${game.name} (BGG: ${game.bgg_id})`);
      console.log('-'.repeat(30));
      
      // カテゴリー分析
      const jpCats = game.categories.filter(c => japaneseRegex.test(c));
      const enCats = game.categories.filter(c => !japaneseRegex.test(c));
      
      console.log(`📂 カテゴリー (${game.categories.length}件):`);
      console.log(`   ✅ 日本語: [${jpCats.join(', ')}]`);
      console.log(`   🔤 英語残存: [${enCats.join(', ')}]`);
      
      // メカニクス分析
      const jpMechs = game.mechanics.filter(m => japaneseRegex.test(m));
      const enMechs = game.mechanics.filter(m => !japaneseRegex.test(m));
      
      console.log(`⚙️ メカニクス (${game.mechanics.length}件):`);
      console.log(`   ✅ 日本語: [${jpMechs.join(', ')}]`);
      if (enMechs.length > 0) {
        console.log(`   🔤 英語残存: [${enMechs.slice(0, 5).join(', ')}${enMechs.length > 5 ? '...' : ''}]`);
      }
      
      // 変換率計算
      const catRate = game.categories.length > 0 ? (jpCats.length / game.categories.length * 100).toFixed(1) : '0';
      const mechRate = game.mechanics.length > 0 ? (jpMechs.length / game.mechanics.length * 100).toFixed(1) : '0';
      
      console.log(`📈 変換率: カテゴリー ${catRate}% | メカニクス ${mechRate}%`);
      console.log('');
      
      // 統計用カウント
      totalCategories += game.categories.length;
      totalMechanics += game.mechanics.length;
      japaneseCategories += jpCats.length;
      japaneseMechanics += jpMechs.length;
    });
    
    // 全体統計
    console.log('📊 全体統計');
    console.log('='.repeat(50));
    console.log(`総カテゴリー数: ${totalCategories}件`);
    console.log(`日本語カテゴリー: ${japaneseCategories}件 (${(japaneseCategories/totalCategories*100).toFixed(1)}%)`);
    console.log(`総メカニクス数: ${totalMechanics}件`);
    console.log(`日本語メカニクス: ${japaneseMechanics}件 (${(japaneseMechanics/totalMechanics*100).toFixed(1)}%)`);
    console.log('');
    
    // 期待されるマッピング確認
    console.log('🎯 期待されるマッピング確認');
    console.log('='.repeat(50));
    
    const expectedMappings = [
      { game: 'Pandemic', expected: ['協力', 'セット収集'] },
      { game: 'Terraforming Mars', expected: ['ソロ向き', 'タイル配置'] },
      { game: 'Dominion', expected: ['カードゲーム', 'デッキ/バッグビルド'] },
      { game: '7 Wonders', expected: ['カードゲーム', 'ドラフト', 'セット収集', '同時手番'] },
      { game: 'Gloomhaven', expected: ['協力', 'レガシー・キャンペーン', 'ソロ向き'] }
    ];
    
    expectedMappings.forEach(({ game: gameName, expected }) => {
      const game = games.find(g => g.name === gameName);
      if (game) {
        console.log(`🎮 ${gameName}:`);
        expected.forEach(expectedItem => {
          const found = game.categories.includes(expectedItem) || game.mechanics.includes(expectedItem);
          console.log(`   ${found ? '✅' : '❌'} ${expectedItem}`);
        });
        console.log('');
      }
    });
    
    console.log('🏁 マッピング結果確認完了');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

verifyMappingResults();