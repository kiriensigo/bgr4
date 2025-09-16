// BGG API から直接データを取得してマッピングをテスト
const { getBggGameDetails } = require('./src/lib/bgg.ts');

async function testBggRawData() {
  console.log('🔍 BGG API 直接データ取得テスト\n');
  
  try {
    // Pandemic の BGG データを直接取得
    console.log('📡 BGG API: Pandemic (ID: 30549) を取得中...');
    const bggData = await getBggGameDetails(30549);
    
    if (!bggData) {
      console.log('❌ BGG データが取得できませんでした');
      return;
    }
    
    console.log('✅ BGG データ取得成功！');
    console.log('');
    console.log('🔍 BGG 生データ:');
    console.log('名前:', bggData.name);
    console.log('カテゴリー:', bggData.categories);
    console.log('メカニクス:', bggData.mechanics?.slice(0, 10), bggData.mechanics?.length > 10 ? '...' : '');
    console.log('');
    
    // マッピング確認
    const categoryMapping = {
      'Animals': '動物',
      'Bluffing': 'ブラフ',
      'Card Game': 'カードゲーム',
      "Children's Game": '子供向け',
      'Deduction': '推理',
      'Memory': '記憶',
      'Negotiation': '交渉',
      'Party Game': 'パーティー',
      'Puzzle': 'パズル',
      'Wargame': 'ウォーゲーム',
      'Word Game': 'ワードゲーム'
    };
    
    const mechanicMapping = {
      'Area Majority / Influence': 'エリア支配',
      'Auction / Bidding': 'オークション',
      'Cooperative Game': '協力',
      'Deck, Bag, and Pool Building': 'デッキ/バッグビルド',
      'Dice Rolling': 'ダイスロール',
      'Hidden Roles': '正体隠匿',
      'Worker Placement': 'ワカプレ',
      'Set Collection': 'セット収集',
      'Tile Placement': 'タイル配置'
    };
    
    const mechanicCategoryMapping = {
      'Acting': '演技',
      'Legacy Game': 'レガシー・キャンペーン',
      'Solo / Solitaire Game': 'ソロ向き',
      'Pattern Building': 'パズル',
      'Trick-taking': 'トリテ'
    };
    
    console.log('🎯 マッピング結果予測:');
    console.log('');
    
    // カテゴリー変換
    console.log('📂 カテゴリー変換:');
    const convertedCategories = bggData.categories
      .map(cat => categoryMapping[cat])
      .filter(Boolean);
    
    bggData.categories.forEach(cat => {
      const converted = categoryMapping[cat];
      console.log(`  ${cat} → ${converted || 'マッピング対象外'}`);
    });
    console.log(`変換結果: [${convertedCategories.join(', ')}]`);
    console.log('');
    
    // メカニクス変換（メカニクス）
    console.log('⚙️ メカニクス → メカニクス変換:');
    const convertedMechanics = bggData.mechanics
      .map(mech => mechanicMapping[mech])
      .filter(Boolean);
    
    bggData.mechanics.forEach(mech => {
      const converted = mechanicMapping[mech];
      if (converted) {
        console.log(`  ✅ ${mech} → ${converted}`);
      }
    });
    console.log(`変換結果: [${convertedMechanics.join(', ')}]`);
    console.log('');
    
    // メカニクス変換（カテゴリー）
    console.log('⚙️ メカニクス → カテゴリー変換:');
    const mechanicCategories = bggData.mechanics
      .map(mech => mechanicCategoryMapping[mech])
      .filter(Boolean);
    
    bggData.mechanics.forEach(mech => {
      const converted = mechanicCategoryMapping[mech];
      if (converted) {
        console.log(`  ✅ ${mech} → ${converted} (カテゴリー)`);
      }
    });
    console.log(`変換結果: [${mechanicCategories.join(', ')}]`);
    
    console.log('');
    console.log('🎊 最終統合結果:');
    const allCategories = [...convertedCategories, ...mechanicCategories];
    console.log(`カテゴリー: [${allCategories.join(', ')}]`);
    console.log(`メカニクス: [${convertedMechanics.join(', ')}]`);
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

testBggRawData();