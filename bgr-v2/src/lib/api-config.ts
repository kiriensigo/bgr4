// API設定とエンドポイント管理

export const API_CONFIG = {
  // 環境に応じたベースURL
  baseUrl: process.env.NODE_ENV === 'production' 
    ? process.env['NEXT_PUBLIC_APP_URL'] || 'https://bgr-v2.netlify.app'
    : 'http://localhost:3000',
    
  // データソースの選択
  useSupabase: process.env['NEXT_PUBLIC_SUPABASE_URL'] !== 'https://example.supabase.co',
  
  // エンドポイント
  endpoints: {
    reviews: '/api/reviews',
    games: '/api/games',
    search: '/api/search',
    auth: '/api/auth'
  }
}

// 実際のAPIエンドポイントを取得
export function getApiEndpoint(endpoint: keyof typeof API_CONFIG.endpoints): string {
  const base = API_CONFIG.endpoints[endpoint]
  
  // Supabaseが利用可能な場合はSupabase APIを使用
  if (API_CONFIG.useSupabase && (endpoint === 'reviews' || endpoint === 'games')) {
    return `/api/supabase${base}`
  }
  
  // それ以外はローカル/モックAPIを使用
  return `/api/local${base}`
}

// 環境情報を取得
export function getEnvironmentInfo() {
  return {
    isProduction: process.env.NODE_ENV === 'production',
    useSupabase: API_CONFIG.useSupabase,
    supabaseUrl: process.env['NEXT_PUBLIC_SUPABASE_URL'],
    hasSupabaseKey: !!process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
  }
}

// APIクライアント設定
export const API_DEFAULTS = {
  timeout: 10000,
  retries: 3,
  headers: {
    'Content-Type': 'application/json'
  }
}

// データ型変換ヘルパー
export function transformReviewForApi(review: any) {
  return {
    ...review,
    // 必要に応じてデータ変換を行う
    overall_score: review.overall_score || review.rating,
    rating: review.rating || review.overall_score
  }
}

// エラーハンドリング
export function handleApiError(error: any, context: string) {
  console.error(`API Error [${context}]:`, error)
  
  // エラーの種類に応じた処理
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return new Error('ネットワークエラーが発生しました')
  }
  
  if (error.status === 404) {
    return new Error('データが見つかりません')
  }
  
  if (error.status >= 500) {
    return new Error('サーバーエラーが発生しました')
  }
  
  return error
}