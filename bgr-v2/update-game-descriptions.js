// ゲーム説明文一括更新スクリプト

// HTMLエンティティをデコードする関数
function decodeHtmlEntities(text) {
  const htmlEntities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'",
    '&ldquo;': '"',
    '&rdquo;': '"',
    '&lsquo;': "'",
    '&rsquo;': "'",
    '&nbsp;': ' ',
    '&ndash;': '–',
    '&mdash;': '—',
    '&hellip;': '…',
    '&#10;': '\n',
    '&#13;': '\r',
    '&pound;': '£',
    '&euro;': '€',
    '&yen;': '¥',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™',
  };

  let decodedText = text;
  
  // HTMLエンティティを置換
  Object.entries(htmlEntities).forEach(([entity, char]) => {
    decodedText = decodedText.replace(new RegExp(entity, 'g'), char);
  });
  
  // 数値文字参照をデコード
  decodedText = decodedText.replace(/&#(\d+);/g, (match, num) => {
    return String.fromCharCode(parseInt(num, 10));
  });
  
  // 16進数文字参照をデコード
  decodedText = decodedText.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
  
  return decodedText;
}

// 空白を正規化する関数
function normalizeWhitespace(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .trim();
}

// BGG説明文をクリーンアップする関数
function cleanBggDescription(description) {
  if (!description) return '';
  
  let cleaned = decodeHtmlEntities(description);
  cleaned = normalizeWhitespace(cleaned);
  
  return cleaned;
}

// 簡易翻訳機能
function translateGameTerms(text) {
  const gameTerms = {
    'board game': 'ボードゲーム',
    'players': 'プレイヤー',
    'strategy': '戦略',
    'tactical': '戦術的',
    'combat': '戦闘',
    'adventure': '冒険',
    'cooperative': '協力',
    'competitive': '競争',
    'Euro-inspired': 'ユーロゲーム風',
    'deck building': 'デッキ構築',
    'worker placement': 'ワーカープレイスメント',
    'area control': 'エリア支配',
    'resource management': 'リソース管理',
    'victory points': '勝利点',
    'turn': 'ターン',
    'round': 'ラウンド',
    'game': 'ゲーム',
    'scenario': 'シナリオ',
    'campaign': 'キャンペーン',
    'expansion': '拡張',
    'faction': '勢力',
    'civilization': '文明',
    'economic': '経済',
    'trading': '取引',
    'exploration': '探索',
    'farming': '農業'
  };

  let translatedText = text;
  
  Object.entries(gameTerms).forEach(([english, japanese]) => {
    const regex = new RegExp(`\\b${english}\\b`, 'gi');
    translatedText = translatedText.replace(regex, japanese);
  });
  
  return translatedText;
}

async function updateGameDescriptions() {
  console.log('📝 ゲーム説明文の更新開始...\n');
  
  try {
    // 全ゲームの説明文を取得
    const response = await fetch('http://localhost:3001/api/games?limit=50');
    const data = await response.json();
    
    if (!data.games || data.games.length === 0) {
      console.log('❌ ゲームが見つかりません');
      return;
    }
    
    console.log(`📊 処理対象: ${data.games.length}件のゲーム\n`);
    
    let updatedCount = 0;
    
    for (const game of data.games) {
      if (!game.description) {
        console.log(`⏭️  ${game.name}: 説明文なし`);
        continue;
      }
      
      console.log(`🔄 ${game.name} を処理中...`);
      
      // 元の説明文
      const originalLength = game.description.length;
      const hasEntities = /&#|&[a-z]+;/i.test(game.description);
      
      // クリーンアップ
      const cleaned = cleanBggDescription(game.description);
      
      // 基本的な用語翻訳
      const withTranslation = translateGameTerms(cleaned);
      
      console.log(`   📏 文字数: ${originalLength} → ${cleaned.length}`);
      console.log(`   🧹 HTMLエンティティ: ${hasEntities ? '修正済み' : 'なし'}`);
      console.log(`   🌏 用語翻訳: ${withTranslation !== cleaned ? '適用済み' : 'なし'}`);
      
      if (cleaned.length < 200) {
        console.log(`   📃 プレビュー: ${cleaned.substring(0, 100)}...`);
      }
      
      updatedCount++;
      console.log('');
    }
    
    console.log(`✅ 処理完了: ${updatedCount}件のゲーム説明文を確認`);
    console.log('💡 実際のデータベース更新は手動で行ってください');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

updateGameDescriptions();