// フロントエンド表示用のBGGデータ変換
export const BGG_CATEGORY_TO_SITE_CATEGORY: Record<string, string> = {
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

export const BGG_MECHANIC_TO_SITE_MECHANIC: Record<string, string> = {
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

export const BGG_MECHANIC_TO_SITE_CATEGORY: Record<string, string> = {
  'Acting': '演技',
  'Legacy Game': 'レガシー・キャンペーン',
  'Solo / Solitaire Game': 'ソロ向き',
  'Pattern Building': 'パズル',
  'Trick-taking': 'トリテ'
};

/**
 * BGGカテゴリーを日本語表示用に変換
 */
export function convertCategoriesToJapanese(bggCategories: string[]): string[] {
  const siteCategories = new Set<string>();
  
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

/**
 * BGGメカニクスを日本語表示用に変換
 */
export function convertMechanicsToJapanese(bggMechanics: string[]): {
  categories: string[];
  mechanics: string[];
} {
  const siteCategories = new Set<string>();
  const siteMechanics = new Set<string>();
  
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