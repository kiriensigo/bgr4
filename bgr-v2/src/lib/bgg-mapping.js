// BGGマッピング定義（JavaScript版）
export const BGG_CATEGORY_TO_SITE_CATEGORY = {
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

// BGGカテゴリー → サイトメカニクス
export const BGG_CATEGORY_TO_SITE_MECHANIC = {
  'Dice': 'ダイスロール'
};

export const BGG_MECHANIC_TO_SITE_CATEGORY = {
  'Acting': '演技',
  'Deduction': '推理',
  'Legacy Game': 'レガシー・キャンペーン',
  'Memory': '記憶',
  'Negotiation': '交渉',
  'Paper-and-Pencil': '紙ペン',
  'Scenario / Mission / Campaign Game': 'レガシー・キャンペーン',
  'Solo / Solitaire Game': 'ソロ向き',
  'Pattern Building': 'パズル',
  'Trick-taking': 'トリテ'
};

export const BGG_MECHANIC_TO_SITE_MECHANIC = {
  'Area Majority / Influence': 'エリア支配',
  'Auction / Bidding': 'オークション',
  'Auction Compensation': 'オークション',
  'Auction: Dexterity': 'オークション',
  'Auction: Dutch': 'オークション',
  'Auction: Dutch Priority': 'オークション',
  'Auction: English': 'オークション',
  'Auction: Fixed Placement': 'オークション',
  'Auction: Multiple Lot': 'オークション',
  'Auction: Once Around': 'オークション',
  'Auction: Sealed Bid': 'オークション',
  'Auction: Turn Order Until Pass': 'オークション',
  'Betting and Bluffing': '賭け',
  'Closed Drafting': 'ドラフト',
  'Cooperative Game': '協力',
  'Deck Construction': 'デッキ/バッグビルド',
  'Deck, Bag, and Pool Building': 'デッキ/バッグビルド',
  'Dice Rolling': 'ダイスロール',
  'Hidden Roles': '正体隠匿',
  'Modular Board': 'モジュラーボード',
  'Network and Route Building': 'ルート構築',
  'Open Drafting': 'ドラフト',
  'Push Your Luck': 'バースト',
  'Set Collection': 'セット収集',
  'Simultaneous Action Selection': '同時手番',
  'Tile Placement': 'タイル配置',
  'Variable Player Powers': 'プレイヤー別能力',
  'Variable Set-up': 'プレイヤー別能力',
  'Worker Placement': 'ワカプレ',
  'Worker Placement with Dice Workers': 'ワカプレ',
  'Worker Placement, Different Worker Types': 'ワカプレ'
};

export const BGG_PLAYER_COUNT_TO_SITE_CATEGORY = {
  '1': 'ソロ向き',
  '2': 'ペア向き',
  '6': '多人数向き',
  '7': '多人数向き',
  '8': '多人数向き',
  '9': '多人数向き',
  '10': '多人数向き'
};

export const JAPANESE_PUBLISHER_MAPPING = {
  // ホビージャパン系
  'hobby japan': 'ホビージャパン',
  'hobbyjapan': 'ホビージャパン',
  'hobby-japan': 'ホビージャパン',
  'hj': 'ホビージャパン',
  
  // アークライト系
  'arclight': 'アークライト',
  'arclightgames': 'アークライト',
  'arc light': 'アークライト',
  'arclight games': 'アークライト',
  
  // グループSNE系
  'グループSNE': 'グループSNE',
  'groupsne': 'グループSNE',
  'group sne': 'グループSNE',
  'グループsne': 'グループSNE',
  
  // カナイ製作所系
  'カナイ製作所': 'カナイ製作所',
  'kanai': 'カナイ製作所',
  'カナイファクトリー': 'カナイ製作所',
  'kanai factory': 'カナイ製作所',
  'kanai seisaku-sho': 'カナイ製作所',
  
  // ニューゲームズオーダー系
  'ニューゲームズオーダー': 'ニューゲームズオーダー',
  'new games order': 'ニューゲームズオーダー',
  'ngo': 'ニューゲームズオーダー',
  'newgamesorder': 'ニューゲームズオーダー',
  
  // オインクゲームズ系
  'オインクゲームズ': 'オインクゲームズ',
  'oink games': 'オインクゲームズ',
  'oinkgames': 'オインクゲームズ',
  
  // その他日本のパブリッシャー（公式仕様追加分）
  'コロンアーク': 'コロンアーク',
  'colon arc': 'コロンアーク',
  '数寄ゲームズ': '数寄ゲームズ',
  'suki games': '数寄ゲームズ',
  'ダイスタワー': 'ダイスタワー',
  'dice tower': 'ダイスタワー',
  'ボードゲームジャパン': 'ボードゲームジャパン',
  'board game japan': 'ボードゲームジャパン',
  'bgj': 'ボードゲームジャパン',
  'ゲームマーケット': 'ゲームマーケット',
  'game market': 'ゲームマーケット',
  'ジーピー': 'ジーピー',
  'gp': 'ジーピー',
  'ハコニワ': 'ハコニワ',
  'hakoniwagames': 'ハコニワ',
  'グラウンディング': 'グラウンディング',
  'grounding inc.': 'グラウンディング',
  'grounding': 'グラウンディング',
  'アズモデージャパン': 'アズモデージャパン',
  'asmodee japan': 'アズモデージャパン',
  'asmodee': 'アズモデージャパン',
  '株式会社ケンビル': 'ケンビル',
  'kenbill': 'ケンビル',
  
  // 既存の追加パブリッシャー
  'cosaic': 'コザイク',
  'コザイク': 'コザイク',
  'すごろくや': 'すごろくや',
  'sugorokuya': 'すごろくや',
  'テンデイズゲームズ': 'テンデイズゲームズ',
  'tendays games': 'テンデイズゲームズ',
  'tendaysgames': 'テンデイズゲームズ',
  'ワンドロー': 'ワンドロー',
  'one draw': 'ワンドロー',
  'onedraw': 'ワンドロー',
  'クロノノーツゲームズ': 'クロノノーツゲームズ',
  'chrono nauts games': 'クロノノーツゲームズ',
  'chrono nauts': 'クロノノーツゲームズ',
  'バンダイ': 'バンダイ',
  'bandai': 'バンダイ',
  'タカラトミー': 'タカラトミー',
  'takara tomy': 'タカラトミー',
  'takaratomy': 'タカラトミー',
  'エポック社': 'エポック社',
  'epoch': 'エポック社',
  'メガハウス': 'メガハウス',
  'megahouse': 'メガハウス',
  'やのまん': 'やのまん',
  'yanoman': 'やのまん'
};

export function convertBggToSiteData(
  bggCategories,
  bggMechanics,
  bggPublishers,
  bestPlayerCounts = [],
  recommendedPlayerCounts = []
) {
  const siteCategories = new Set();
  const siteMechanics = new Set();
  const playerCountCategories = new Set();
  
  // Convert BGG categories to site categories
  bggCategories.forEach(category => {
    const siteCategory = BGG_CATEGORY_TO_SITE_CATEGORY[category];
    if (siteCategory) {
      siteCategories.add(siteCategory);
    }
  });
  
  // Convert BGG categories to site mechanics
  bggCategories.forEach(category => {
    const siteMechanic = BGG_CATEGORY_TO_SITE_MECHANIC[category];
    if (siteMechanic) {
      siteMechanics.add(siteMechanic);
    }
  });
  
  // Convert BGG mechanics to site categories and mechanics
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
  
  // Convert player counts to categories
  [...bestPlayerCounts, ...recommendedPlayerCounts].forEach(count => {
    const playerCountCategory = BGG_PLAYER_COUNT_TO_SITE_CATEGORY[count.toString()];
    if (playerCountCategory) {
      playerCountCategories.add(playerCountCategory);
    }
  });
  
  // Normalize Japanese publishers
  const normalizedPublishers = bggPublishers
    .map(publisher => {
      const lowerPublisher = publisher.toLowerCase().trim();
      return JAPANESE_PUBLISHER_MAPPING[lowerPublisher] || publisher;
    })
    .filter(Boolean);
  
  return {
    siteCategories: Array.from(siteCategories),
    siteMechanics: Array.from(siteMechanics),
    playerCountCategories: Array.from(playerCountCategories),
    normalizedPublishers
  };
}

export function calculateWeightedScore(
  userReviewsSum,
  userReviewsCount,
  baselineScore = 7.5,
  baselineWeight = 10
) {
  return (userReviewsSum + baselineScore * baselineWeight) / (userReviewsCount + baselineWeight);
}

export function calculatePlayerCountRecommendation(
  userVotes,
  bggRecommended,
  bggWeight = 10
) {
  const bggVotes = bggRecommended ? bggWeight : 0;
  return (userVotes + bggVotes) / (userVotes + bggWeight);
}