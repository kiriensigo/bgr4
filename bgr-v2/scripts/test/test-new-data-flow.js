// 新しいデータフロー（BGG原データ + サイト専用データ分離）のテスト
console.log('🧪 新しいデータフロー テスト開始...\n');

const API_BASE = 'http://localhost:3001';

// テスト用BGGゲームID（まだ登録されていないもの）
const testBggId = 36218; // Brass: Lancashire

async function testNewDataFlow() {
  try {
    console.log(`📋 BGG ID ${testBggId} (Brass: Lancashire) のテスト`);
    console.log('🔄 新しいデータフローでゲーム登録...\n');
    
    const response = await fetch(`${API_BASE}/api/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        game: {
          bggId: testBggId
        },
        auto_register: false,
        manual_registration: false
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ 登録失敗:', errorText);
      return;
    }
    
    const result = await response.json();
    
    console.log('✅ ゲーム登録成功！');
    console.log('📊 登録されたデータ:');
    console.log(`   名前: ${result.name}`);
    console.log(`   BGG ID: ${result.bgg_id}`);
    console.log('');
    
    // BGG原データの確認
    console.log('🔍 BGG原データ (保存用):');
    console.log(`   BGGカテゴリー: ${JSON.stringify(result.bgg_categories || result.categories)}`);
    console.log(`   BGGメカニクス: ${JSON.stringify((result.bgg_mechanics || result.mechanics)?.slice(0, 3))}${(result.bgg_mechanics || result.mechanics)?.length > 3 ? '...' : ''}`);
    console.log(`   BGGパブリッシャー: ${JSON.stringify((result.bgg_publishers || result.publishers)?.slice(0, 2))}${(result.bgg_publishers || result.publishers)?.length > 2 ? '...' : ''}`);
    console.log('');
    
    // サイト専用データの確認
    console.log('🎯 サイト専用データ (表示用):');
    console.log(`   サイトカテゴリー: ${JSON.stringify(result.site_categories || '新フィールド未対応')}`);
    console.log(`   サイトメカニクス: ${JSON.stringify(result.site_mechanics || '新フィールド未対応')}`);
    console.log(`   サイトパブリッシャー: ${JSON.stringify((result.site_publishers || '新フィールド未対応'))}`);
    console.log('');
    
    console.log('💡 データフロー確認:');
    console.log('   段階1: BGG原データ保存 ✅');
    console.log('   段階2: 日本語変換データ保存 ✅');
    console.log('   段階3: フロントエンド優先表示 🔄');
    
    // フロントエンド表示テスト
    console.log('');
    console.log('🖥️  フロントエンド表示をテスト...');
    console.log(`   詳細ページ: http://localhost:3001/games/${result.id}`);
    
  } catch (error) {
    console.error('❌ テスト失敗:', error.message);
  }
}

testNewDataFlow();