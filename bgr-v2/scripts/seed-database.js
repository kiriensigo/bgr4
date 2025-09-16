const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// 環境変数を読み込み
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase環境変数が設定されていません')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedDatabase() {
  try {
    console.log('🌱 データベースにモックデータを挿入開始...')
    
    // ゲームデータを挿入
    console.log('📚 ゲームデータを挿入中...')
    const gamesSQL = fs.readFileSync(path.join(__dirname, '../db/seed_games.sql'), 'utf8')
    
    // SQLを個別のINSERT文に分割
    const gameInserts = gamesSQL
      .split('VALUES')[1]
      .split(/,(?=\s*\()/g)
      .filter(insert => insert.trim())
    
    for (let i = 0; i < gameInserts.length; i++) {
      const insertStatement = `INSERT INTO games (
        bgg_id, name, japanese_name, description, 
        year_published, min_players, max_players, playing_time, min_age,
        image_url, thumbnail_url,
        mechanics, categories, designers, publishers,
        created_at, updated_at
      ) VALUES ${gameInserts[i].replace(/;$/, '')}`
      
      const { error } = await supabase.rpc('exec_sql', { sql: insertStatement })
      
      if (error) {
        console.warn(`⚠️  ゲーム ${i + 1} の挿入でエラー:`, error.message)
      } else {
        console.log(`✅ ゲーム ${i + 1}/10 挿入完了`)
      }
    }
    
    // レビューデータを挿入
    console.log('📝 レビューデータを挿入中...')
    
    // まず、モックユーザーを作成
    const mockUsers = [
      { id: '11111111-1111-1111-1111-111111111111', username: 'boardgame_lover', full_name: '田中太郎' },
      { id: '22222222-2222-2222-2222-222222222222', username: 'strategy_master', full_name: '佐藤花子' },
      { id: '33333333-3333-3333-3333-333333333333', username: 'family_gamer', full_name: '鈴木次郎' },
      { id: '44444444-4444-4444-4444-444444444444', username: 'euro_fan', full_name: '高橋美咲' },
      { id: '55555555-5555-5555-5555-555555555555', username: 'dice_roller', full_name: '山田健太' },
    ]
    
    for (const user of mockUsers) {
      const { error } = await supabase
        .from('profiles')
        .upsert(user, { onConflict: 'id' })
      
      if (error) {
        console.warn(`⚠️  ユーザー ${user.username} の作成でエラー:`, error.message)
      } else {
        console.log(`✅ ユーザー ${user.username} 作成完了`)
      }
    }
    
    // レビューを個別に挿入
    const mockReviews = [
      {
        user_id: '11111111-1111-1111-1111-111111111111',
        game_bgg_id: 230802,
        title: '美しくて戦略的なタイル配置ゲーム',
        content: 'アズールは見た目の美しさと戦略性を兼ね備えた素晴らしいゲームです。タイルの質感も良く、配置パズルとしても楽しめます。相手の動きを読みながらタイルを取る駆け引きが面白く、毎回違った展開が楽しめます。',
        overall_score: 9,
        rule_complexity: 2,
        luck_factor: 2,
        interaction: 4,
        downtime: 1,
        pros: ['美しいコンポーネント', '理解しやすいルール', '適度な戦略性'],
        cons: ['運要素が少し物足りない'],
        mechanics: ['タイル配置', 'パターン構築', 'セット収集'],
        categories: ['抽象戦略', 'ファミリー']
      },
      {
        user_id: '22222222-2222-2222-2222-222222222222',
        game_bgg_id: 13,
        title: '交渉と運のバランスが絶妙な名作',
        content: 'カタンは今でも色褪せない名作だと思います。ダイスによる運要素がありながらも、交渉や建設場所の選択で戦略性も十分あります。',
        overall_score: 8,
        rule_complexity: 3,
        luck_factor: 4,
        interaction: 5,
        downtime: 2,
        pros: ['優れた交渉システム', 'リプレイ性が高い'],
        cons: ['運要素が強すぎることがある'],
        mechanics: ['ダイス', '交渉', '建設'],
        categories: ['文明', 'ファミリー']
      },
      {
        user_id: '33333333-3333-3333-3333-333333333333',
        game_bgg_id: 266192,
        title: '美しいアートと滑らかなエンジンビルド',
        content: 'ウイングスパンは本当に美しいゲームです。鳥のイラストはどれも素晴らしく、見ているだけでも楽しめます。',
        overall_score: 9,
        rule_complexity: 3,
        luck_factor: 3,
        interaction: 2,
        downtime: 2,
        pros: ['圧倒的に美しいアートワーク', '気持ちの良いエンジンビルド'],
        cons: ['インタラクションが少ない'],
        mechanics: ['エンジンビルディング', 'カードドラフト'],
        categories: ['動物', 'カードゲーム']
      }
    ]
    
    for (const review of mockReviews) {
      // ゲームIDを取得
      const { data: game } = await supabase
        .from('games')
        .select('id')
        .eq('bgg_id', review.game_bgg_id)
        .single()
      
      if (!game) {
        console.warn(`⚠️  BGG ID ${review.game_bgg_id} のゲームが見つかりません`)
        continue
      }
      
      const { error } = await supabase
        .from('reviews')
        .insert({
          user_id: review.user_id,
          game_id: game.id,
          title: review.title,
          content: review.content,
          overall_score: review.overall_score,
          rule_complexity: review.rule_complexity,
          luck_factor: review.luck_factor,
          interaction: review.interaction,
          downtime: review.downtime,
          pros: review.pros,
          cons: review.cons,
          mechanics: review.mechanics,
          categories: review.categories,
          is_published: true
        })
      
      if (error) {
        console.warn(`⚠️  レビュー "${review.title}" の挿入でエラー:`, error.message)
      } else {
        console.log(`✅ レビュー "${review.title}" 挿入完了`)
      }
    }
    
    console.log('🎉 モックデータの挿入が完了しました！')
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  }
}

// スクリプト実行
seedDatabase()