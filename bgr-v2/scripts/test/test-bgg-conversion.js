// BGG変換機能テストスクリプト
import { convertBggToSiteData } from './src/lib/bgg-mapping.js';

console.log('🧪 BGG変換機能テスト開始...\n');

// テストデータ1: 協力ゲーム系
console.log('📋 テスト1: 協力ゲーム系カテゴリー・メカニクス');
const test1 = convertBggToSiteData(
  ['Adventure', 'Exploration', 'Fantasy', 'Fighting', 'Miniatures'],
  ['Action Queue', 'Cooperative Game', 'Deck Construction', 'Grid Movement', 'Hand Management'],
  ['Cephalofair Games', 'ホビージャパン', 'arclight'],
  [],
  []
);

console.log('入力カテゴリー:', ['Adventure', 'Exploration', 'Fantasy', 'Fighting', 'Miniatures']);
console.log('→ 変換後:', test1.siteCategories);
console.log('入力メカニクス:', ['Action Queue', 'Cooperative Game', 'Deck Construction', 'Grid Movement', 'Hand Management']);
console.log('→ 変換後:', test1.siteMechanics);
console.log('入力パブリッシャー:', ['Cephalofair Games', 'ホビージャパン', 'arclight']);
console.log('→ 変換後:', test1.normalizedPublishers);
console.log('');

// テストデータ2: 戦略ゲーム系
console.log('📋 テスト2: 戦略ゲーム系カテゴリー・メカニクス');
const test2 = convertBggToSiteData(
  ['Civilization', 'Economic', 'Miniatures', 'Science Fiction', 'Space Exploration', 'Territory Building'],
  ['End Game Bonuses', 'Hexagon Grid', 'Income', 'Modular Board', 'Network and Route Building', 'Solo / Solitaire Game'],
  ['New Games Order', 'すごろくや', 'bandai'],
  [],
  []
);

console.log('入力カテゴリー:', ['Civilization', 'Economic', 'Miniatures', 'Science Fiction', 'Space Exploration', 'Territory Building']);
console.log('→ 変換後:', test2.siteCategories);
console.log('入力メカニクス:', ['End Game Bonuses', 'Hexagon Grid', 'Income', 'Modular Board', 'Network and Route Building', 'Solo / Solitaire Game']);
console.log('→ 変換後:', test2.siteMechanics);
console.log('入力パブリッシャー:', ['New Games Order', 'すごろくや', 'bandai']);
console.log('→ 変換後:', test2.normalizedPublishers);
console.log('');

// テストデータ3: パーティーゲーム系
console.log('📋 テスト3: パーティーゲーム系カテゴリー・メカニクス');
const test3 = convertBggToSiteData(
  ['Animals', 'Bluffing', 'Card Game', "Children's Game", 'Deduction', 'Memory', 'Negotiation', 'Party Game', 'Puzzle'],
  ['Tags', 'Tech Trees / Tech Tracks', 'Turn Order: Pass Order', 'Variable Player Powers', 'Variable Set-up', 'Victory Points as a Resource'],
  ['oink games', 'Hobby Japan', 'Group SNE'],
  [],
  []
);

console.log('入力カテゴリー:', ['Animals', 'Bluffing', 'Card Game', "Children's Game", 'Deduction', 'Memory', 'Negotiation', 'Party Game', 'Puzzle']);
console.log('→ 変換後:', test3.siteCategories);
console.log('入力メカニクス:', ['Tags', 'Tech Trees / Tech Tracks', 'Turn Order: Pass Order', 'Variable Player Powers', 'Variable Set-up', 'Victory Points as a Resource']);
console.log('→ 変換後:', test3.siteMechanics);
console.log('入力パブリッシャー:', ['oink games', 'Hobby Japan', 'Group SNE']);
console.log('→ 変換後:', test3.normalizedPublishers);
console.log('');

console.log('✅ BGG変換機能テスト完了');
console.log('');
console.log('💡 期待される結果:');
console.log('- 膨大なBGGカテゴリーが11種類の分かりやすいカテゴリーに変換');
console.log('- 複雑なBGGメカニクスが9種類の主要メカニクスに変換');
console.log('- 日本のパブリッシャー名が正規化');
console.log('- 対象外のカテゴリー・メカニクスは除外される');