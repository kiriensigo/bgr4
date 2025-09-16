// テキスト処理ユーティリティ

/**
 * HTMLエンティティをデコードする
 */
export function decodeHtmlEntities(text: string): string {
  const htmlEntities: Record<string, string> = {
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
  
  // 数値文字参照をデコード（&#数値; の形式）
  decodedText = decodedText.replace(/&#(\d+);/g, (_match, num) => {
    return String.fromCharCode(parseInt(num, 10));
  });
  
  // 16進数文字参照をデコード（&#x16進数; の形式）
  decodedText = decodedText.replace(/&#x([0-9a-fA-F]+);/g, (_match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
  
  return decodedText;
}

/**
 * 改行文字を統一し、不要な空白を削除する
 */
export function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, '\n')  // Windows改行をUnix改行に統一
    .replace(/\r/g, '\n')    // Mac改行をUnix改行に統一
    .replace(/\n{3,}/g, '\n\n')  // 3つ以上の連続改行を2つに
    .replace(/[ \t]+/g, ' ')  // 連続スペース・タブを単一スペースに
    .replace(/[ \t]*\n[ \t]*/g, '\n')  // 改行前後の空白を削除
    .trim();  // 前後の空白を削除
}

/**
 * BGGの説明文をクリーンアップする
 */
export function cleanBggDescription(description: string): string {
  if (!description) return '';
  
  // HTMLエンティティをデコード
  let cleaned = decodeHtmlEntities(description);
  
  // 空白を正規化
  cleaned = normalizeWhitespace(cleaned);
  
  return cleaned;
}

/**
 * テキストを日本語に翻訳（模擬実装）
 * 実際の実装では外部翻訳APIを使用
 */
export async function translateToJapanese(text: string): Promise<string> {
  // 簡易的なボードゲーム用語の翻訳マッピング
  const gameTerms: Record<string, string> = {
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
    'tile placement': 'タイル配置',
    'dice rolling': 'ダイスロール',
    'card drafting': 'カードドラフト',
    'engine building': 'エンジンビルド',
    'victory points': '勝利点',
    'turn': 'ターン',
    'round': 'ラウンド',
    'game': 'ゲーム',
    'scenario': 'シナリオ',
    'campaign': 'キャンペーン',
    'expansion': '拡張',
    'miniatures': 'ミニチュア',
    'faction': '勢力',
    'civilization': '文明',
    'economic': '経済',
    'trading': '取引',
    'exploration': '探索',
    'farming': '農業',
    'industry': '産業',
    'railroad': '鉄道',
    'shipping': '海運'
  };

  let translatedText = text;
  
  // 基本的なゲーム用語を翻訳
  Object.entries(gameTerms).forEach(([english, japanese]) => {
    const regex = new RegExp(`\\b${english}\\b`, 'gi');
    translatedText = translatedText.replace(regex, japanese);
  });
  
  // 注記: 実際の実装では、Google Translate API、DeepL API、
  // または他の翻訳サービスを使用することを推奨
  
  return `【日本語翻訳】 ${translatedText}`;
}

/**
 * 説明文を処理（クリーンアップ + 翻訳）
 */
export async function processGameDescription(description: string): Promise<string> {
  if (!description) return '';
  
  // 1. HTMLエンティティをクリーンアップ
  const cleaned = cleanBggDescription(description);
  
  // 2. 短い説明の場合はそのまま返す
  if (cleaned.length < 100) {
    return cleaned;
  }
  
  // 3. 長い説明の場合は翻訳を試行
  try {
    const translated = await translateToJapanese(cleaned);
    return translated;
  } catch (error) {
    console.error('Translation failed:', error);
    // 翻訳に失敗した場合はクリーンアップ済みテキストを返す
    return cleaned;
  }
}