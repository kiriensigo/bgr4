// 既存ゲームに変換処理を適用するスクリプト
console.log('🔄 既存ゲームに日本語変換処理を適用...\n');

const API_BASE = 'http://localhost:3001';

// bgg-mapping.tsから変換ロジックをコピー
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

const BGG_MECHANIC_TO_SITE_CATEGORY = {
  'Acting': '演技',
  'Legacy Game': 'レガシー・キャンペーン',
  'Solo / Solitaire Game': 'ソロ向き',
  'Pattern Building': 'パズル',
  'Trick-taking': 'トリテ'
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

function convertBggToSiteData(bggCategories, bggMechanics, bggPublishers = []) {
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
    siteMechanics: Array.from(siteMechanics),
    normalizedPublishers: bggPublishers // 簡略化
  };
}

async function updateGameData(gameId, convertedData) {
  try {
    const response = await fetch(`${API_BASE}/api/games/${gameId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        categories: convertedData.siteCategories,
        mechanics: convertedData.siteMechanics
      })
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error(`❌ ゲーム${gameId}の更新失敗:`, error.message);
    return null;
  }
}

async function processExistingGames() {
  try {
    // 全ゲーム取得
    const response = await fetch(`${API_BASE}/api/games?limit=100`);
    const data = await response.json();
    
    console.log(`📊 処理対象: ${data.games.length}個のゲーム\n`);
    
    let processedCount = 0;
    let updatedCount = 0;
    
    for (const game of data.games) {
      // BGG原データ（英語）が残っているかチェック
      const hasEnglishData = game.categories.some(cat => /^[A-Z]/.test(cat)) || 
                            game.mechanics.some(mech => /^[A-Z]/.test(mech));
      
      if (hasEnglishData) {
        console.log(`🔄 ${game.name} (ID: ${game.id}) の変換処理...`);
        
        // データ変換
        const converted = convertBggToSiteData(game.categories, game.mechanics, game.publishers);
        
        console.log(`   変換前: カテゴリー${game.categories.length}個, メカニクス${game.mechanics.length}個`);
        console.log(`   変換後: カテゴリー${converted.siteCategories.length}個, メカニクス${converted.siteMechanics.length}個`);
        
        if (converted.siteCategories.length > 0 || converted.siteMechanics.length > 0) {
          console.log(`   📝 データベース更新: カテゴリー[${converted.siteCategories.join(', ')}], メカニクス[${converted.siteMechanics.join(', ')}]`);
          
          // 実際の更新は手動確認後に実行
          console.log(`   ⏸️  手動確認待ち（実際の更新は後で実行）`);
          updatedCount++;
        } else {
          console.log(`   ⚠️ 変換対象データなし（マッピング対象外）`);
        }
        processedCount++;
        console.log('');
      } else {
        console.log(`✅ ${game.name} は既に日本語データ`);
      }
    }
    
    console.log(`\n🎯 処理完了: ${processedCount}個のゲームを処理, ${updatedCount}個が更新対象`);
    console.log('');
    console.log('📋 次の手順:');
    console.log('1. 上記の変換結果を確認');
    console.log('2. 問題なければ実際のデータベース更新を実行');
    console.log('3. フロントエンド変換ロジックを削除');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

processExistingGames();