// 単一ゲームでマッピング詳細確認
console.log('🔍 単一ゲーム マッピング詳細テスト\n');

const API_BASE = 'http://localhost:3001';

// マッピングが多くありそうなゲーム
const testGame = { bggId: 167791, name: 'Terraforming Mars' };

async function testSingleGameMapping() {
  try {
    console.log(`🚀 ${testGame.name} (BGG: ${testGame.bggId}) を登録してマッピングを確認`);
    console.log('');
    
    const response = await fetch(`${API_BASE}/api/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        game: {
          bggId: testGame.bggId
        },
        auto_register: false,
        manual_registration: false
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ 登録失敗:', errorText);
      return;
    }
    
    const result = await response.json();
    console.log('✅ 登録成功！');
    console.log('');
    
    console.log('📊 登録されたデータ詳細:');
    console.log('名前:', result.name);
    console.log('BGG ID:', result.bgg_id);
    console.log('');
    
    console.log('🔍 カテゴリー分析:');
    console.log('全カテゴリー:', result.categories);
    const japaneseCategories = result.categories.filter(c => /[あ-ん|ア-ン|一-龯]/.test(c));
    const englishCategories = result.categories.filter(c => !/[あ-ん|ア-ン|一-龯]/.test(c));
    console.log('✅ 日本語カテゴリー:', japaneseCategories);
    console.log('🔤 英語カテゴリー:', englishCategories);
    console.log('');
    
    console.log('⚙️ メカニクス分析:');
    console.log('全メカニクス数:', result.mechanics.length);
    console.log('全メカニクス:', result.mechanics);
    const japaneseMechanics = result.mechanics.filter(m => /[あ-ん|ア-ン|一-龯]/.test(m));
    const englishMechanics = result.mechanics.filter(m => !/[あ-ん|ア-ン|一-龯]/.test(m));
    console.log('✅ 日本語メカニクス:', japaneseMechanics);
    console.log('🔤 英語メカニクス:', englishMechanics);
    console.log('');
    
    console.log('🎯 マッピング効果確認:');
    console.log(`カテゴリー変換率: ${japaneseCategories.length}/${result.categories.length} (${(japaneseCategories.length/result.categories.length*100).toFixed(1)}%)`);
    console.log(`メカニクス変換率: ${japaneseMechanics.length}/${result.mechanics.length} (${(japaneseMechanics.length/result.mechanics.length*100).toFixed(1)}%)`);
    
    // 期待されるマッピング
    console.log('');
    console.log('📋 期待されるマッピング例:');
    const expectedMappings = {
      'Card Game': 'カードゲーム',
      'Negotiation': '交渉',
      'Cooperative Game': '協力',
      'Worker Placement': 'ワカプレ',
      'Dice Rolling': 'ダイスロール',
      'Set Collection': 'セット収集',
      'Tile Placement': 'タイル配置',
      'Area Majority / Influence': 'エリア支配',
      'Deck, Bag, and Pool Building': 'デッキ/バッグビルド',
      'Solo / Solitaire Game': 'ソロ向き (カテゴリー)',
      'Legacy Game': 'レガシー・キャンペーン (カテゴリー)'
    };
    
    Object.entries(expectedMappings).forEach(([english, japanese]) => {
      const found = result.categories.includes(japanese) || result.mechanics.includes(japanese);
      console.log(`${found ? '✅' : '❌'} ${english} → ${japanese}`);
    });
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

testSingleGameMapping();