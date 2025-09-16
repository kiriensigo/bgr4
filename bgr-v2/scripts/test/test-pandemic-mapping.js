// Pandemicでマッピング確認
const API_BASE = 'http://localhost:3001';

async function testPandemicMapping() {
  try {
    console.log('🧪 Pandemic (BGG: 30549) マッピングテスト');
    console.log('');
    
    const response = await fetch(`${API_BASE}/api/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game: { bggId: 30549 },
        auto_register: false,
        manual_registration: false
      })
    });
    
    if (!response.ok) {
      console.log('❌ 登録失敗:', await response.text());
      return;
    }
    
    const result = await response.json();
    console.log('✅ 登録完了: Pandemic');
    console.log('');
    
    console.log('📊 マッピング結果:');
    console.log('カテゴリー:', result.categories);
    console.log('メカニクス:', result.mechanics);
    console.log('');
    
    const japaneseRegex = /[あ-ん|ア-ン|一-龯]/;
    const jpCategories = result.categories.filter(c => japaneseRegex.test(c));
    const jpMechanics = result.mechanics.filter(m => japaneseRegex.test(m));
    const enCategories = result.categories.filter(c => !japaneseRegex.test(c));
    const enMechanics = result.mechanics.filter(m => !japaneseRegex.test(m));
    
    console.log('🎯 変換結果分析:');
    console.log('✅ 日本語カテゴリー:', jpCategories);
    console.log('✅ 日本語メカニクス:', jpMechanics);
    console.log('🔤 英語残存カテゴリー:', enCategories);
    console.log('🔤 英語残存メカニクス:', enMechanics);
    console.log('');
    
    console.log('📈 変換効果:');
    const totalCategories = result.categories.length;
    const totalMechanics = result.mechanics.length;
    const jpCategoryRate = totalCategories > 0 ? (jpCategories.length / totalCategories * 100).toFixed(1) : '0';
    const jpMechanicRate = totalMechanics > 0 ? (jpMechanics.length / totalMechanics * 100).toFixed(1) : '0';
    
    console.log(`カテゴリー変換率: ${jpCategories.length}/${totalCategories} (${jpCategoryRate}%)`);
    console.log(`メカニクス変換率: ${jpMechanics.length}/${totalMechanics} (${jpMechanicRate}%)`);
    
    // 期待されるマッピング確認
    console.log('');
    console.log('🔍 期待されるマッピング確認:');
    const expectedMappings = [
      'Cooperative Game → 協力',
      'Set Collection → セット収集',
      'Action Points → プレイヤー別能力 (可能性)',
      'Hand Management → セット収集 (可能性)'
    ];
    
    expectedMappings.forEach(mapping => {
      const [english, japanese] = mapping.split(' → ');
      const found = result.categories.includes(japanese.split(' (')[0]) || result.mechanics.includes(japanese.split(' (')[0]);
      console.log(`${found ? '✅' : '❌'} ${mapping}`);
    });
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

testPandemicMapping();