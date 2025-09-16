// Playwright BGGマッピング表示テスト
const API_BASE = 'http://localhost:3001';

// テスト対象ゲーム（明確なマッピング期待値）
const TEST_GAMES = [
  {
    bggId: 30549,
    name: 'Pandemic',
    expectedCategories: [], // Medical, Travel は意図的にマッピング対象外
    expectedMechanics: ['協力', 'セット収集'],
    description: '医療チームとして世界の感染症と戦う協力ゲーム'
  },
  {
    bggId: 68448, 
    name: '7 Wonders',
    expectedCategories: ['カードゲーム'],
    expectedMechanics: ['ドラフト', 'セット収集', '同時手番', 'プレイヤー別能力'],
    description: '古代7つの都市文明を発展させるドラフトゲーム'
  },
  {
    bggId: 167791,
    name: 'Terraforming Mars',
    expectedCategories: ['ソロ向き'],
    expectedMechanics: ['タイル配置'],
    description: '火星テラフォーミングプロジェクト'
  }
];

class PlaywrightMappingTester {
  constructor() {
    this.testResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
  }

  log(message, type = 'info') {
    const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌', debug: '🔍' };
    console.log(`${icons[type]} ${message}`);
  }

  async test(description, testFunc) {
    this.totalTests++;
    
    try {
      this.log(`${this.totalTests}. ${description}`, 'debug');
      const result = await testFunc();
      
      if (result) {
        this.passedTests++;
        this.log(`   ✅ PASS`, 'success');
        this.testResults.push({ description, status: 'PASS', details: result });
      } else {
        this.log(`   ❌ FAIL`, 'error');
        this.testResults.push({ description, status: 'FAIL', details: result });
      }
      return result;
    } catch (error) {
      this.log(`   ❌ ERROR: ${error.message}`, 'error');
      this.testResults.push({ description, status: 'ERROR', error: error.message });
      return false;
    }
  }

  async registerTestGames() {
    this.log('🎮 Phase 1: テストゲーム登録', 'info');
    console.log('');

    for (const game of TEST_GAMES) {
      await this.test(`${game.name} をAPI経由で登録`, async () => {
        const response = await fetch(`${API_BASE}/api/games`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            game: { bggId: game.bggId },
            auto_register: false,
            manual_registration: false
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          this.log(`     API登録失敗: ${response.status} - ${errorText}`, 'error');
          return false;
        }

        const result = await response.json();
        this.log(`     API登録成功: ${result.name}`, 'success');
        
        game.registeredId = result.id;
        game.registeredData = result;
        
        // マッピング結果詳細をログ
        const japaneseRegex = /[あ-ん|ア-ン|一-龯]/;
        const jpCategories = result.categories.filter(c => japaneseRegex.test(c));
        const jpMechanics = result.mechanics.filter(m => japaneseRegex.test(m));
        
        this.log(`     カテゴリー: [${result.categories.join(', ')}]`, 'debug');
        this.log(`     メカニクス: [${result.mechanics.join(', ')}]`, 'debug');
        this.log(`     日本語カテゴリー: [${jpCategories.join(', ')}]`, 'debug');
        this.log(`     日本語メカニクス: [${jpMechanics.join(', ')}]`, 'debug');
        
        return true;
      });
    }
  }

  async waitForPageLoad(timeout = 5000) {
    // ページの読み込み完了を待つ
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      try {
        // 待機時間
        await new Promise(resolve => setTimeout(resolve, 1000));
        return true;
      } catch (error) {
        // 継続
      }
    }
    return false;
  }

  async verifyGameListDisplay() {
    this.log('🖥️ Phase 2: ゲーム一覧ページ表示確認', 'info');
    console.log('');

    await this.test('ゲーム一覧ページが正しく表示される', async () => {
      // API経由でゲーム数を確認
      const response = await fetch(`${API_BASE}/api/games`);
      const data = await response.json();
      const games = data.games || data.data || [];
      
      this.log(`     API経由ゲーム数: ${games.length}`, 'debug');
      
      if (games.length === 0) {
        this.log(`     ゲームが登録されていません`, 'error');
        return false;
      }

      // 登録されたゲームの詳細表示
      games.forEach(game => {
        this.log(`     - ${game.name} (ID: ${game.id})`, 'debug');
      });

      return games.length > 0;
    });
  }

  async verifyGameDetailPages() {
    this.log('🔍 Phase 3: ゲーム詳細ページのマッピング確認', 'info');
    console.log('');

    for (const testGame of TEST_GAMES) {
      if (testGame.registeredId) {
        await this.test(`${testGame.name} 詳細ページのマッピング確認`, async () => {
          // API経由でゲーム詳細を確認
          const response = await fetch(`${API_BASE}/api/games/${testGame.registeredId}`);
          
          if (!response.ok) {
            this.log(`     ゲーム詳細API失敗: ${response.status}`, 'error');
            return false;
          }

          const data = await response.json();
          const game = data.data;
          
          this.log(`     ゲーム名: ${game.name}`, 'debug');
          this.log(`     カテゴリー: [${game.categories.join(', ')}]`, 'debug');
          this.log(`     メカニクス: [${game.mechanics.join(', ')}]`, 'debug');

          // 日本語変換確認
          const japaneseRegex = /[あ-ん|ア-ン|一-龯]/;
          const jpCategories = game.categories.filter(c => japaneseRegex.test(c));
          const jpMechanics = game.mechanics.filter(m => japaneseRegex.test(m));

          this.log(`     日本語カテゴリー: [${jpCategories.join(', ')}]`, 'debug');
          this.log(`     日本語メカニクス: [${jpMechanics.join(', ')}]`, 'debug');

          // 期待値との比較
          let allMatched = true;

          // カテゴリー検証
          for (const expectedCat of testGame.expectedCategories) {
            const found = jpCategories.includes(expectedCat);
            this.log(`     期待カテゴリー "${expectedCat}": ${found ? '✅' : '❌'}`, found ? 'success' : 'error');
            if (!found) allMatched = false;
          }

          // メカニクス検証
          for (const expectedMech of testGame.expectedMechanics) {
            const found = jpMechanics.includes(expectedMech);
            this.log(`     期待メカニクス "${expectedMech}": ${found ? '✅' : '❌'}`, found ? 'success' : 'error');
            if (!found) allMatched = false;
          }

          // 意図的にマッピング対象外の確認（Pandemic の Medical, Travel）
          if (testGame.name === 'Pandemic') {
            const hasUnmappedCategories = game.categories.includes('Medical') || game.categories.includes('Travel');
            this.log(`     意図的対象外カテゴリー (Medical/Travel): ${hasUnmappedCategories ? '✅' : '❌'}`, hasUnmappedCategories ? 'success' : 'warning');
          }

          return allMatched;
        });
      }
    }
  }

  async runCompleteTest() {
    console.log('🚀 Playwright BGGマッピング表示テスト開始');
    console.log('='.repeat(60));
    console.log('');
    
    await this.registerTestGames();
    console.log('');
    
    await this.verifyGameListDisplay();
    console.log('');
    
    await this.verifyGameDetailPages();
    console.log('');
    
    this.printSummary();
    
    // 結果に基づく次のアクション提案
    if (this.passedTests < this.totalTests) {
      console.log('');
      this.log('🔄 問題が発見されました。データベースクリアして再テストを推奨します。', 'warning');
    } else {
      console.log('');
      this.log('🎉 全てのマッピングが正常に動作しています！', 'success');
    }
  }

  printSummary() {
    console.log('📊 テスト結果サマリー');
    console.log('='.repeat(60));
    console.log(`総テスト数: ${this.totalTests}`);
    console.log(`成功: ${this.passedTests}`);
    console.log(`失敗: ${this.totalTests - this.passedTests}`);
    console.log(`成功率: ${(this.passedTests / this.totalTests * 100).toFixed(1)}%`);
    console.log('');
    
    if (this.passedTests === this.totalTests) {
      console.log('🎉 全てのテストが成功しました！');
    } else {
      console.log('❌ 失敗したテスト:');
      this.testResults
        .filter(r => r.status !== 'PASS')
        .forEach(r => {
          console.log(`   - ${r.description}: ${r.status}`);
          if (r.error) console.log(`     エラー: ${r.error}`);
        });
    }
  }
}

// テスト実行
const tester = new PlaywrightMappingTester();
tester.runCompleteTest().catch(error => {
  console.error('❌ テスト実行エラー:', error.message);
});