// 既存ゲームの日本語変換処理
console.log('🔄 既存ゲームの日本語変換処理を開始...\n');

const API_BASE = 'http://localhost:3001';

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

function convertBggToSiteData(bggCategories, bggMechanics) {
  const siteCategories = new Set();
  const siteMechanics = new Set();
  
  // カテゴリー変換
  bggCategories.forEach(category => {
    const siteCategory = BGG_CATEGORY_TO_SITE_CATEGORY[category];
    if (siteCategory) {
      siteCategories.add(siteCategory);
    }
  });
  
  // メカニクス変換
  bggMechanics.forEach(mechanic => {
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
    siteCategories: Array.from(siteCategories),
    siteMechanics: Array.from(siteMechanics)
  };
}

async function updateExistingGames() {
  try {
    // 全ゲーム取得
    const response = await fetch(`${API_BASE}/api/games?limit=100`);
    const data = await response.json();
    
    console.log(`📊 処理対象: ${data.games.length}個のゲーム\n`);
    
    for (const game of data.games) {
      // BGG原データかどうか判定（英語データが残っている場合）
      const hasEnglishData = game.categories.some(cat => /^[A-Z]/.test(cat)) || 
                            game.mechanics.some(mech => /^[A-Z]/.test(mech));
      
      if (hasEnglishData) {
        console.log(`🔄 ${game.name} (ID: ${game.id}) の変換処理...`);
        console.log(`   変換前カテゴリー: ${game.categories.slice(0, 3).join(', ')}${game.categories.length > 3 ? '...' : ''}`);
        console.log(`   変換前メカニクス: ${game.mechanics.slice(0, 3).join(', ')}${game.mechanics.length > 3 ? '...' : ''}`);
        
        // データ変換
        const converted = convertBggToSiteData(game.categories, game.mechanics);
        
        console.log(`   変換後カテゴリー: ${converted.siteCategories.join(', ') || '(なし)'}`);
        console.log(`   変換後メカニクス: ${converted.siteMechanics.join(', ') || '(なし)'}`);
        
        // 変換されたデータがある場合のみ更新
        if (converted.siteCategories.length > 0 || converted.siteMechanics.length > 0) {
          // NOTE: 実際の更新処理は手動で実行する必要があります
          console.log(`   ✅ 変換完了 (カテゴリー: ${converted.siteCategories.length}, メカニクス: ${converted.siteMechanics.length})`);
        } else {
          console.log(`   ⚠️ 変換対象データなし（意図的に対象外）`);
        }
        console.log('');
      } else {
        console.log(`✅ ${game.name} は既に日本語変換済み`);
      }
    }
    
    console.log('🎯 変換処理完了！');
    console.log('📝 次の手順: 管理画面またはAPIで実際のデータ更新を実行してください');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

updateExistingGames();