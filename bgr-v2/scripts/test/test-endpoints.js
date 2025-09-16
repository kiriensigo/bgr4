// BGR アプリケーション エンドポイントテスト

const BASE_URL = 'http://localhost:3005'

const endpoints = [
  // Pages
  { url: '/', name: 'ホームページ' },
  { url: '/login', name: 'ログインページ' },
  { url: '/register', name: '登録ページ' },
  { url: '/reviews', name: 'レビューページ' },
  { url: '/search', name: '検索ページ' },
  
  // API endpoints
  { url: '/api/local/reviews', name: 'レビューAPI' },
  { url: '/api/local/games', name: 'ゲームAPI' },
  { url: '/api/seed', name: 'シードAPI' },
  { url: '/api/home/stats', name: '統計API' },
  { url: '/api/home/recent-reviews', name: '最新レビューAPI' },
  { url: '/api/home/popular-games', name: '人気ゲームAPI' },
]

async function testEndpoint(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint.url}`)
    return {
      ...endpoint,
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    }
  } catch (error) {
    return {
      ...endpoint,
      status: 'ERROR',
      ok: false,
      statusText: error.message
    }
  }
}

async function runTests() {
  console.log('🧪 BGR アプリケーション エンドポイントテスト開始\n')
  console.log('=' .repeat(60))
  
  const results = []
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint)
    results.push(result)
    
    const status = result.ok ? '✅' : '❌'
    const statusCode = result.status === 'ERROR' ? 'ERROR' : result.status
    
    console.log(`${status} ${result.name.padEnd(20)} | ${statusCode} | ${result.url}`)
    
    if (!result.ok && result.status !== 'ERROR') {
      console.log(`   └─ ${result.statusText}`)
    }
  }
  
  console.log('\n' + '=' .repeat(60))
  
  // サマリー
  const passed = results.filter(r => r.ok).length
  const failed = results.filter(r => !r.ok).length
  
  console.log(`\n📊 テスト結果サマリー:`)
  console.log(`   ✅ 成功: ${passed}`)
  console.log(`   ❌ 失敗: ${failed}`)
  console.log(`   📈 成功率: ${Math.round((passed / results.length) * 100)}%`)
  
  // 失敗したエンドポイントの詳細
  if (failed > 0) {
    console.log(`\n❌ 失敗したエンドポイント:`)
    results.filter(r => !r.ok).forEach(result => {
      console.log(`   • ${result.name}: ${result.status} - ${result.url}`)
    })
  }
  
  return results
}

// メイン実行
if (typeof window === 'undefined') {
  // Node.js環境
  runTests().then(() => {
    console.log('\n🏁 テスト完了')
    process.exit(0)
  }).catch(error => {
    console.error('テスト実行エラー:', error)
    process.exit(1)
  })
} else {
  // ブラウザ環境
  window.runBGRTests = runTests
  console.log('ブラウザのコンソールで window.runBGRTests() を実行してテストを開始してください')
}