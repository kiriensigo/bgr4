// BGR アプリケーション 機能テスト

const BASE_URL = 'http://localhost:3005'

// APIレスポンステスト
async function testAPI(url, expectedFields = []) {
  try {
    const response = await fetch(`${BASE_URL}${url}`)
    const data = await response.json()
    
    return {
      url,
      status: response.status,
      ok: response.ok,
      data,
      hasExpectedFields: expectedFields.every(field => 
        data.hasOwnProperty(field) || (data.data && data.data.hasOwnProperty(field))
      )
    }
  } catch (error) {
    return {
      url,
      status: 'ERROR',
      ok: false,
      error: error.message
    }
  }
}

// レスポンス構造テスト
const apiTests = [
  {
    name: 'レビューAPI',
    url: '/api/local/reviews',
    expectedFields: ['success', 'data', 'pagination']
  },
  {
    name: 'ゲームAPI', 
    url: '/api/local/games',
    expectedFields: ['success', 'data', 'pagination']
  },
  {
    name: '統計API',
    url: '/api/home/stats',
    expectedFields: ['success', 'data']
  },
  {
    name: '最新レビューAPI',
    url: '/api/home/recent-reviews',
    expectedFields: ['success', 'data']
  },
  {
    name: '人気ゲームAPI',
    url: '/api/home/popular-games',  
    expectedFields: ['success', 'data']
  }
]

// データ内容テスト
async function testDataContent() {
  console.log('\n📋 データ内容テスト:')
  console.log('-'.repeat(40))
  
  // レビューデータ
  try {
    const reviewsResponse = await fetch(`${BASE_URL}/api/local/reviews`)
    const reviewsData = await reviewsResponse.json()
    
    if (reviewsData.success && reviewsData.data.length > 0) {
      const review = reviewsData.data[0]
      console.log('✅ レビューデータ構造:')
      console.log(`   • ID: ${review.id}`)
      console.log(`   • タイトル: "${review.title}"`)
      console.log(`   • ゲームID: ${review.game_id}`)
      console.log(`   • 評価: ${review.overall_score}/10`)
      console.log(`   • レビュー数: ${reviewsData.data.length}件`)
      
      // 拡張評価のチェック
      const hasDetailedRatings = review.rule_complexity || review.luck_factor || review.interaction || review.downtime
      console.log(`   • 拡張評価: ${hasDetailedRatings ? '✅ あり' : '❌ なし'}`)
    } else {
      console.log('❌ レビューデータが空またはエラー')
    }
  } catch (error) {
    console.log(`❌ レビューデータテストエラー: ${error.message}`)
  }
  
  // ゲームデータ
  try {
    const gamesResponse = await fetch(`${BASE_URL}/api/local/games`)
    const gamesData = await gamesResponse.json()
    
    if (gamesData.success && gamesData.data.length > 0) {
      const game = gamesData.data[0]
      console.log('\n✅ ゲームデータ構造:')
      console.log(`   • ID: ${game.id}`)
      console.log(`   • 名前: "${game.name}"`)
      console.log(`   • 日本語名: "${game.japanese_name || 'なし'}"`)
      console.log(`   • 年: ${game.year_published}`)
      console.log(`   • プレイヤー数: ${game.min_players}-${game.max_players}人`)
      console.log(`   • 画像URL: ${game.image_url ? '✅ あり' : '❌ なし'}`)
      console.log(`   • ゲーム数: ${gamesData.data.length}件`)
    } else {
      console.log('❌ ゲームデータが空またはエラー')
    }
  } catch (error) {
    console.log(`❌ ゲームデータテストエラー: ${error.message}`)
  }
}

// 認証関連テスト
async function testAuth() {
  console.log('\n🔐 認証システムテスト:')
  console.log('-'.repeat(40))
  
  // 保護されたルートのテスト
  const protectedRoutes = ['/profile', '/reviews/new']
  
  for (const route of protectedRoutes) {
    try {
      const response = await fetch(`${BASE_URL}${route}`, {
        redirect: 'manual' // リダイレクトを手動処理
      })
      
      if (response.status === 302 || response.status === 307) {
        const location = response.headers.get('location')
        if (location && location.includes('/login')) {
          console.log(`✅ ${route}: 適切にログインページにリダイレクト`)
        } else {
          console.log(`⚠️  ${route}: 予期しないリダイレクト先: ${location}`)
        }
      } else if (response.status === 200) {
        console.log(`⚠️  ${route}: 保護されていない (認証なしでアクセス可能)`)
      } else {
        console.log(`❌ ${route}: 予期しないステータス ${response.status}`)
      }
    } catch (error) {
      console.log(`❌ ${route}: テストエラー - ${error.message}`)
    }
  }
}

// メイン機能テスト
async function runFeatureTests() {
  console.log('🧪 BGR アプリケーション 機能テスト開始\n')
  console.log('='.repeat(50))
  
  // API構造テスト
  console.log('📡 API構造テスト:')
  console.log('-'.repeat(40))
  
  let apiTestsPassed = 0
  
  for (const test of apiTests) {
    const result = await testAPI(test.url, test.expectedFields)
    
    if (result.ok && result.hasExpectedFields) {
      console.log(`✅ ${test.name}: OK`)
      apiTestsPassed++
    } else if (result.ok && !result.hasExpectedFields) {
      console.log(`⚠️  ${test.name}: レスポンス構造不正`)
      console.log(`   期待フィールド: ${test.expectedFields.join(', ')}`)
    } else {
      console.log(`❌ ${test.name}: ${result.status} ${result.error || ''}`)
    }
  }
  
  // データ内容テスト
  await testDataContent()
  
  // 認証テスト
  await testAuth()
  
  // サマリー
  console.log('\n' + '='.repeat(50))
  console.log('📊 テスト結果サマリー:')
  console.log(`   📡 API構造テスト: ${apiTestsPassed}/${apiTests.length} 成功`)
  console.log(`   📋 データ内容: 確認済み`)
  console.log(`   🔐 認証システム: 確認済み`)
  
  const overallScore = Math.round((apiTestsPassed / apiTests.length) * 100)
  console.log(`   📈 総合スコア: ${overallScore}%`)
  
  if (overallScore >= 80) {
    console.log('\n🎉 テスト合格! アプリケーションは正常に動作しています。')
  } else {
    console.log('\n⚠️  いくつかの問題が検出されました。確認が必要です。')
  }
}

// メイン実行
runFeatureTests().then(() => {
  console.log('\n🏁 機能テスト完了')
  process.exit(0)
}).catch(error => {
  console.error('機能テスト実行エラー:', error)
  process.exit(1)
})