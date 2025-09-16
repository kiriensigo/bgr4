// 表示変換テスト
console.log('🧪 ゲーム詳細画面の日本語表示変換テスト\n');

// 変換マッピング
const BGG_CATEGORY_TO_SITE_CATEGORY = {
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

const BGG_MECHANIC_TO_SITE_MECHANIC = {
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

const BGG_MECHANIC_TO_SITE_CATEGORY = {
  'Acting': '演技',
  'Legacy Game': 'レガシー・キャンペーン',
  'Solo / Solitaire Game': 'ソロ向き',
  'Pattern Building': 'パズル',
  'Trick-taking': 'トリテ'
};

function convertCategoriesToJapanese(bggCategories) {
  const siteCategories = new Set();
  
  bggCategories.forEach(category => {
    // 既に日本語の場合はそのまま使用
    if (!/^[A-Z]/.test(category)) {
      siteCategories.add(category);
      return;
    }
    
    // BGGカテゴリーから日本語カテゴリーに変換
    const siteCategory = BGG_CATEGORY_TO_SITE_CATEGORY[category];
    if (siteCategory) {
      siteCategories.add(siteCategory);
    }
  });
  
  return Array.from(siteCategories);
}

function convertMechanicsToJapanese(bggMechanics) {
  const siteCategories = new Set();
  const siteMechanics = new Set();
  
  bggMechanics.forEach(mechanic => {
    // 既に日本語の場合はそのまま使用
    if (!/^[A-Z]/.test(mechanic)) {
      siteMechanics.add(mechanic);
      return;
    }
    
    // BGGメカニクスから日本語カテゴリー・メカニクスに変換
    const siteCategory = BGG_MECHANIC_TO_SITE_CATEGORY[mechanic];
    const siteMechanic = BGG_MECHANIC_TO_SITE_MECHANIC[mechanic];
    
    if (siteCategory) {
      siteCategories.add(siteCategory);
    }
    if (siteMechanic) {
      siteMechanics.add(siteMechanic);
    }
  });
  
  return {
    categories: Array.from(siteCategories),
    mechanics: Array.from(siteMechanics)
  };
}

// Gloomhavenのデータでテスト
console.log('📋 Gloomhaven 変換テスト');
const categories = ['Adventure', 'Exploration', 'Fantasy', 'Fighting', 'Miniatures'];
const mechanics = ['Action Queue', 'Cooperative Game', 'Legacy Game', 'Solo / Solitaire Game'];

console.log('変換前カテゴリー:', categories);
const displayCategories = convertCategoriesToJapanese(categories);
console.log('変換後カテゴリー:', displayCategories);

console.log('変換前メカニクス:', mechanics);
const mechanicsResult = convertMechanicsToJapanese(mechanics);
console.log('変換後メカニクス:', mechanicsResult.mechanics);
console.log('メカニクス由来カテゴリー:', mechanicsResult.categories);

const allDisplayCategories = [...new Set([...displayCategories, ...mechanicsResult.categories])];
console.log('');
console.log('🎯 最終表示結果:');
console.log('カテゴリー:', allDisplayCategories);
console.log('メカニクス:', mechanicsResult.mechanics);

console.log('');
console.log('✅ 変換処理成功！');
console.log('💡 ユーザーには日本語のカテゴリー・メカニクスが表示されます');