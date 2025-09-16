// マッピング結果詳細確認スクリプト（修正版）
const API_BASE = 'http://localhost:3001';

async function verifyMappingResults() {
  try {
    console.log('🔍 BGGマッピング結果詳細確認');
    console.log('='.repeat(50));
    console.log('');
    
    // 全ゲーム取得
    const response = await fetch(`${API_BASE}/api/games`);
    const data = await response.json();
    const games = data.games || data.data || []; // 両方のフォーマットに対応
    
    console.log(`📊 登録ゲーム数: ${games.length}件`);
    console.log('');
    
    if (games.length === 0) {
      console.log('⚠️ ゲームが見つかりません。登録を確認してください。');
      return;
    }
    
    const japaneseRegex = /[あ-ん|ア-ン|一-龯]/;
    let totalCategories = 0;
    let totalMechanics = 0;
    let japaneseCategories = 0;
    let japaneseMechanics = 0;
    
    games.forEach((game, index) => {
      console.log(`${index + 1}. ${game.name} (BGG: ${game.bgg_id})`);
      console.log('-'.repeat(30));
      
      // カテゴリー分析
      const categories = Array.isArray(game.categories) ? game.categories : [];
      const jpCats = categories.filter(c => japaneseRegex.test(c));
      const enCats = categories.filter(c => !japaneseRegex.test(c));
      
      console.log(`📂 カテゴリー (${categories.length}件):`);
      console.log(`   ✅ 日本語: [${jpCats.join(', ')}]`);
      console.log(`   🔤 英語残存: [${enCats.join(', ')}]`);
      
      // メカニクス分析
      const mechanics = Array.isArray(game.mechanics) ? game.mechanics : [];
      const jpMechs = mechanics.filter(m => japaneseRegex.test(m));
      const enMechs = mechanics.filter(m => !japaneseRegex.test(m));
      
      console.log(`⚙️ メカニクス (${mechanics.length}件):`);
      console.log(`   ✅ 日本語: [${jpMechs.join(', ')}]`);
      if (enMechs.length > 0) {
        console.log(`   🔤 英語残存: [${enMechs.slice(0, 5).join(', ')}${enMechs.length > 5 ? '...' : ''}]`);
      }
      
      // 変換率計算
      const catRate = categories.length > 0 ? (jpCats.length / categories.length * 100).toFixed(1) : '0';
      const mechRate = mechanics.length > 0 ? (jpMechs.length / mechanics.length * 100).toFixed(1) : '0';
      
      console.log(`📈 変換率: カテゴリー ${catRate}% | メカニクス ${mechRate}%`);
      console.log('');
      
      // 統計用カウント
      totalCategories += categories.length;
      totalMechanics += mechanics.length;
      japaneseCategories += jpCats.length;
      japaneseMechanics += jpMechs.length;
    });
    
    // 全体統計
    console.log('📊 全体統計');
    console.log('='.repeat(50));
    console.log(`総カテゴリー数: ${totalCategories}件`);
    console.log(`日本語カテゴリー: ${japaneseCategories}件 (${totalCategories > 0 ? (japaneseCategories/totalCategories*100).toFixed(1) : '0'}%)`);
    console.log(`総メカニクス数: ${totalMechanics}件`);
    console.log(`日本語メカニクス: ${japaneseMechanics}件 (${totalMechanics > 0 ? (japaneseMechanics/totalMechanics*100).toFixed(1) : '0'}%)`);
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
        const categories = Array.isArray(game.categories) ? game.categories : [];
        const mechanics = Array.isArray(game.mechanics) ? game.mechanics : [];
        
        console.log(`🎮 ${gameName}:`);
        expected.forEach(expectedItem => {
          const found = categories.includes(expectedItem) || mechanics.includes(expectedItem);
          console.log(`   ${found ? '✅' : '❌'} ${expectedItem}`);
        });
        console.log('');
      } else {
        console.log(`⚠️ ${gameName}: ゲームが見つかりません`);
      }
    });
    
    console.log('🏁 マッピング結果確認完了');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

verifyMappingResults();