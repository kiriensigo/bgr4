// BGGマッピング包括テストスイート
const API_BASE = 'http://localhost:3001';

// テスト対象ゲーム (明確なマッピング期待値あり)
const TEST_GAMES = [
  {
    bggId: 30549,
    name: 'Pandemic',
    expectedCategories: [], // Medical, Travel は意図的にマッピング対象外
    expectedMechanics: ['協力', 'セット収集'],
    expectedBggCategories: ['Medical', 'Travel'],
    expectedBggMechanics: ['Cooperative Game', 'Set Collection']
  },
  {
    bggId: 68448,
    name: '7 Wonders',
    expectedCategories: ['カードゲーム'],
    expectedMechanics: ['ドラフト', 'セット収集', '同時手番', 'プレイヤー別能力'],
    expectedBggCategories: ['Card Game', 'Civilization'],
    expectedBggMechanics: ['Open Drafting', 'Set Collection', 'Simultaneous Action Selection', 'Variable Player Powers']
  }
];

class BGGMappingTester {
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
    const testId = `test_${this.totalTests}`;
    
    try {
      this.log(`${this.totalTests}. ${description}`, 'debug');
      const result = await testFunc();
      
      if (result) {
        this.passedTests++;
        this.log(`   ✅ PASS`, 'success');
        this.testResults.push({ id: testId, description, status: 'PASS', details: result });
      } else {
        this.log(`   ❌ FAIL`, 'error');
        this.testResults.push({ id: testId, description, status: 'FAIL', details: result });
      }
      return result;
    } catch (error) {
      this.log(`   ❌ ERROR: ${error.message}`, 'error');
      this.testResults.push({ id: testId, description, status: 'ERROR', error: error.message });
      return false;
    }
  }

  async testBggApiDirectAccess() {
    this.log('🔧 Phase 1: BGG API 直接アクセステスト', 'info');
    console.log('');

    for (const testGame of TEST_GAMES) {
      await this.test(`BGG API から ${testGame.name} (${testGame.bggId}) のデータ取得`, async () => {
        // BGG APIから直接データを取得してテスト
        const response = await fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${testGame.bggId}&stats=1`);
        const text = await response.text();
        
        if (!response.ok || !text.includes('<name')) {
          this.log(`     BGG API レスポンス失敗: ${response.status}`, 'error');
          return false;
        }
        
        this.log(`     BGG API レスポンス成功: ${text.length} characters`, 'debug');
        return true;
      });
    }
  }

  async testMappingLogic() {
    this.log('🔧 Phase 2: マッピングロジック単体テスト', 'info');
    console.log('');

    // マッピング関数を直接テスト
    await this.test('BGG_CATEGORY_TO_SITE_CATEGORY マッピング確認', async () => {
      const { convertBggToSiteData } = await import('./src/lib/bgg-mapping.js');
      
      const testResult = convertBggToSiteData(
        ['Card Game'], // bggCategories
        [], // bggMechanics
        [], // bggPublishers
        [] // bestPlayerCounts
      );
      
      const hasCardGame = testResult.siteCategories.includes('カードゲーム');
      this.log(`     Card Game → カードゲーム: ${hasCardGame}`, hasCardGame ? 'success' : 'error');
      return hasCardGame;
    });

    await this.test('BGG_MECHANIC_TO_SITE_MECHANIC マッピング確認', async () => {
      const { convertBggToSiteData } = await import('./src/lib/bgg-mapping.js');
      
      const testResult = convertBggToSiteData(
        [], // bggCategories
        ['Cooperative Game', 'Set Collection'], // bggMechanics
        [], // bggPublishers
        [] // bestPlayerCounts
      );
      
      const hasCooperative = testResult.siteMechanics.includes('協力');
      const hasSetCollection = testResult.siteMechanics.includes('セット収集');
      
      this.log(`     Cooperative Game → 協力: ${hasCooperative}`, hasCooperative ? 'success' : 'error');
      this.log(`     Set Collection → セット収集: ${hasSetCollection}`, hasSetCollection ? 'success' : 'error');
      
      return hasCooperative && hasSetCollection;
    });

    await this.test('BGG_MECHANIC_TO_SITE_CATEGORY マッピング確認', async () => {
      const { convertBggToSiteData } = await import('./src/lib/bgg-mapping.js');
      
      const testResult = convertBggToSiteData(
        [], // bggCategories
        ['Solo / Solitaire Game'], // bggMechanics
        [], // bggPublishers
        [] // bestPlayerCounts
      );
      
      const hasSolo = testResult.siteCategories.includes('ソロ向き');
      this.log(`     Solo / Solitaire Game → ソロ向き: ${hasSolo}`, hasSolo ? 'success' : 'error');
      return hasSolo;
    });
  }

  async testApiIntegration() {
    this.log('🔧 Phase 3: API統合テスト', 'info');
    console.log('');

    for (const testGame of TEST_GAMES) {
      await this.test(`${testGame.name} をAPI経由で登録`, async () => {
        const response = await fetch(`${API_BASE}/api/games`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            game: { bggId: testGame.bggId },
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
        
        // 登録されたゲームのIDを保存
        testGame.registeredId = result.id;
        testGame.registeredData = result;
        
        return true;
      });

      if (testGame.registeredData) {
        await this.test(`${testGame.name} のマッピング結果検証`, async () => {
          const data = testGame.registeredData;
          const japaneseRegex = /[あ-ん|ア-ン|一-龯]/;
          
          // カテゴリー検証
          const actualJpCategories = data.categories.filter(c => japaneseRegex.test(c));
          const actualEnCategories = data.categories.filter(c => !japaneseRegex.test(c));
          
          this.log(`     実際のカテゴリー: [${data.categories.join(', ')}]`, 'debug');
          this.log(`     日本語カテゴリー: [${actualJpCategories.join(', ')}]`, 'debug');
          this.log(`     英語残存カテゴリー: [${actualEnCategories.join(', ')}]`, 'debug');
          
          // メカニクス検証
          const actualJpMechanics = data.mechanics.filter(m => japaneseRegex.test(m));
          const actualEnMechanics = data.mechanics.filter(m => !japaneseRegex.test(m));
          
          this.log(`     実際のメカニクス: [${data.mechanics.join(', ')}]`, 'debug');
          this.log(`     日本語メカニクス: [${actualJpMechanics.join(', ')}]`, 'debug');
          this.log(`     英語残存メカニクス: [${actualEnMechanics.slice(0, 3).join(', ')}${actualEnMechanics.length > 3 ? '...' : ''}]`, 'debug');
          
          // 期待値と比較
          let allMatched = true;
          
          for (const expectedCat of testGame.expectedCategories) {
            const found = actualJpCategories.includes(expectedCat);
            this.log(`     期待カテゴリー "${expectedCat}": ${found ? '✅' : '❌'}`, found ? 'success' : 'error');
            if (!found) allMatched = false;
          }
          
          for (const expectedMech of testGame.expectedMechanics) {
            const found = actualJpMechanics.includes(expectedMech);
            this.log(`     期待メカニクス "${expectedMech}": ${found ? '✅' : '❌'}`, found ? 'success' : 'error');
            if (!found) allMatched = false;
          }
          
          return allMatched;
        });
      }
    }
  }

  async testDatabaseConsistency() {
    this.log('🔧 Phase 4: データベース整合性テスト', 'info');
    console.log('');

    await this.test('登録されたゲームがデータベースから取得可能', async () => {
      const response = await fetch(`${API_BASE}/api/games`);
      const data = await response.json();
      const games = data.games || data.data || [];
      
      this.log(`     データベース内ゲーム数: ${games.length}`, 'debug');
      
      for (const testGame of TEST_GAMES) {
        const found = games.find(g => g.bgg_id === testGame.bggId);
        const foundStatus = found ? '✅' : '❌';
        this.log(`     ${testGame.name} (BGG: ${testGame.bggId}): ${foundStatus}`, found ? 'success' : 'error');
        
        if (!found) return false;
      }
      
      return true;
    });
  }

  async runAllTests() {
    console.log('🚀 BGG マッピング包括テストスイート開始');
    console.log('='.repeat(60));
    console.log('');
    
    await this.testBggApiDirectAccess();
    console.log('');
    
    await this.testMappingLogic();
    console.log('');
    
    await this.testApiIntegration();
    console.log('');
    
    await this.testDatabaseConsistency();
    console.log('');
    
    this.printSummary();
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
const tester = new BGGMappingTester();
tester.runAllTests().catch(error => {
  console.error('❌ テストスイート実行エラー:', error.message);
});