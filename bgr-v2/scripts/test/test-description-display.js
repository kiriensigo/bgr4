// 説明文表示テストスクリプト
import { readFileSync } from 'fs';
import { join } from 'path';

// テキスト処理関数をインポート（内容をコピー）
function decodeHtmlEntities(text) {
  const htmlEntities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&ldquo;': '"',
    '&rdquo;': '"',
    '&nbsp;': ' ',
    '&#10;': '\n',
    '&pound;': '£',
  };

  let decodedText = text;
  Object.entries(htmlEntities).forEach(([entity, char]) => {
    decodedText = decodedText.replace(new RegExp(entity, 'g'), char);
  });
  
  decodedText = decodedText.replace(/&#(\d+);/g, (match, num) => {
    return String.fromCharCode(parseInt(num, 10));
  });
  
  return decodedText;
}

function normalizeWhitespace(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .trim();
}

function cleanBggDescription(description) {
  if (!description) return '';
  let cleaned = decodeHtmlEntities(description);
  cleaned = normalizeWhitespace(cleaned);
  return cleaned;
}

async function testDescriptionDisplay() {
  console.log('📖 説明文表示テスト開始...\n');
  
  try {
    const response = await fetch('http://localhost:3001/api/games?limit=3');
    const data = await response.json();
    
    if (!data.games || data.games.length === 0) {
      console.log('❌ ゲームが見つかりません');
      return;
    }
    
    data.games.forEach((game, index) => {
      if (!game.description) return;
      
      console.log(`🎲 ${game.name}`);
      console.log('─'.repeat(50));
      
      // 元の説明文（最初の200文字）
      const original = game.description.substring(0, 200);
      console.log('📄 元の説明文:');
      console.log(original + '...\n');
      
      // クリーンアップ後
      const cleaned = cleanBggDescription(game.description);
      const cleanedPreview = cleaned.substring(0, 200);
      console.log('✨ クリーンアップ後:');
      console.log(cleanedPreview + '...\n');
      
      // HTMLエンティティの検出
      const hasEntities = /&#|&[a-z]+;/i.test(game.description);
      console.log(`🔍 HTMLエンティティ: ${hasEntities ? '検出されました' : 'なし'}`);
      console.log(`📏 文字数変化: ${game.description.length} → ${cleaned.length}`);
      console.log('\n' + '='.repeat(60) + '\n');
    });
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

testDescriptionDisplay();