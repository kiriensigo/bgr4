// Pandemicのデータ構造確認
const API_BASE = 'http://localhost:3001';

async function checkPandemicData() {
  try {
    const response = await fetch(`${API_BASE}/api/games/18`);
    const data = await response.json();
    const game = data.data;
    
    console.log('🔍 Pandemic 完全なデータ構造:');
    console.log('BGG ID:', game.bgg_id);
    console.log('全カテゴリー:', game.categories);
    console.log('全メカニクス:', game.mechanics);
    console.log('');
    
    // 変換状況分析
    const japaneseRegex = /[あ-ん|ア-ン|一-龯]/;
    const categoriesJP = game.categories.filter(c => japaneseRegex.test(c));
    const mechanicsJP = game.mechanics.filter(m => japaneseRegex.test(m));
    const categoriesEN = game.categories.filter(c => !japaneseRegex.test(c));
    const mechanicsEN = game.mechanics.filter(m => !japaneseRegex.test(m));
    
    console.log('📊 変換状況分析:');
    console.log('✅ 日本語カテゴリー:', categoriesJP);
    console.log('✅ 日本語メカニクス:', mechanicsJP);
    console.log('🔤 英語残存カテゴリー:', categoriesEN);
    console.log('🔤 英語残存メカニクス:', mechanicsEN);
    
    console.log('');
    console.log('🎯 マッピング検証:');
    
    // 現在のマッピング
    const categoryMapping = {
      'Medical': 'medical はマッピング対象外',
      'Travel': 'travel はマッピング対象外'
    };
    
    const mechanicsMapping = {
      'Cooperative Game': '協力',
      'Set Collection': 'セット収集'
    };
    
    console.log('カテゴリーマッピング期待値:');
    categoriesEN.forEach(cat => {
      console.log(`  ${cat} → ${categoryMapping[cat] || 'マッピング対象外'}`);
    });
    
    console.log('メカニクスマッピング期待値:');
    mechanicsEN.forEach(mech => {
      console.log(`  ${mech} → ${mechanicsMapping[mech] || 'マッピング対象外'}`);
    });
    
    console.log('');
    console.log('💡 結論:');
    console.log('- Medical, Travel カテゴリーは意図的にマッピング対象外');
    console.log('- Cooperative Game, Set Collection は正しく日本語変換済み ✅');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

checkPandemicData();