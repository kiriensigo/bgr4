import { NextRequest, NextResponse } from 'next/server'

// In-memory モックデータ（開発用）
let games: any[] = []
let reviews: any[] = []
let gameIdCounter = 1
let reviewIdCounter = 1

// モックゲームデータ
const mockGames = [
  {
    bgg_id: 174430,
    name: 'Gloomhaven',
    japanese_name: 'グルームヘイヴン',
    year_published: 2017,
    min_players: 1,
    max_players: 4,
    playing_time: 120,
    min_playing_time: 60,
    max_playing_time: 120,
    image_url: '/images/games/gloomhaven.jpg',
    description: '協力型戦術RPGボードゲーム',
    mechanics: ['協力', 'RPG要素', 'カードドリブン', 'モジュラーボード'],
    categories: ['アドベンチャー', 'ファンタジー', '協力'],
    publishers: ['Cephalofair Games'],
    designers: ['Isaac Childres']
  },
  {
    bgg_id: 220308,
    name: 'Gaia Project',
    japanese_name: 'ガイアプロジェクト',
    year_published: 2017,
    min_players: 1,
    max_players: 4,
    playing_time: 150,
    min_playing_time: 90,
    max_playing_time: 150,
    image_url: '/images/games/gaia-project.jpg',
    description: 'テラミスティカの後継作、銀河系開発ゲーム',
    mechanics: ['エリア支配', 'ワーカープレイスメント', '拡大再生産'],
    categories: ['宇宙', 'SF', '文明'],
    publishers: ['Z-Man Games'],
    designers: ['Jens Drögemüller', 'Helge Ostertag']
  },
  {
    bgg_id: 266192,
    name: 'Wingspan',
    japanese_name: 'ウイングスパン',
    year_published: 2019,
    min_players: 1,
    max_players: 5,
    playing_time: 70,
    min_playing_time: 70,
    max_playing_time: 70,
    image_url: '/images/games/wingspan.jpg',
    description: '美しい鳥をテーマにしたエンジンビルディングゲーム',
    mechanics: ['エンジンビルド', 'カードドラフト', 'セット収集'],
    categories: ['動物', '環境', 'ファミリー'],
    publishers: ['Stonemaier Games'],
    designers: ['Elizabeth Hargrave']
  }
]

// モックレビューデータ  
const mockReviews = [
  {
    game_bgg_id: 174430,
    title: 'グルームヘイヴンの魅力と挑戦',
    content: 'グルームヘイヴンは間違いなく傑作です。150回以上のシナリオによる圧倒的なボリューム、戦略性の高い戦闘システム、そして選択に応じて変化するストーリーライン。ただし、セットアップの複雑さと膨大なルール量は覚悟が必要です。真剣にボードゲームに取り組みたい方には最高の体験を提供してくれるでしょう。',
    rating: 9,
    overall_score: 9.2,
    rule_complexity: 5,
    luck_factor: 2,
    interaction: 4,
    downtime: 3,
    recommended_players: ['3', '4'],
    mechanics: ['協力', 'RPG要素', 'カードドリブン'],
    categories: ['アドベンチャー', 'ファンタジー'],
    custom_tags: ['協力', 'デッキ/バッグビルド', 'タイル配置'],
    play_time_actual: 180,
    player_count_played: 4,
    pros: ['圧倒的なボリューム', '戦略性が高い', 'ストーリーが面白い'],
    cons: ['セットアップが大変', 'ルールが複雑', '収納が困難'],
    is_published: true,
    user_id: 'test-user-1'
  },
  {
    game_bgg_id: 220308,
    title: 'ガイアプロジェクト：テラミスティカを超えた傑作',
    content: 'テラミスティカの完璧な進化形。宇宙を舞台にしたテーマ性の向上、より洗練されたメカニクス、そして14の異なる種族による高いリプレイ性。初回プレイでも楽しめますが、真の面白さは繰り返しプレイすることで見えてきます。重ゲーマーには心からオススメします。',
    rating: 8,
    overall_score: 8.7,
    rule_complexity: 4,
    luck_factor: 2,
    interaction: 3,
    downtime: 3,
    recommended_players: ['3', '4'],
    mechanics: ['エリア支配', 'ワーカープレイスメント'],
    categories: ['宇宙', 'SF'],
    custom_tags: ['エリア支配', 'ワカプレ', 'プレイヤー別能力'],
    play_time_actual: 150,
    player_count_played: 3,
    pros: ['戦略性抜群', 'テーマ性向上', 'リプレイ性高い'],
    cons: ['学習コストが高い', 'ダウンタイムがある', 'AP起こしやすい'],
    is_published: true,
    user_id: 'test-user-2'
  },
  {
    game_bgg_id: 266192,
    title: 'ウイングスパン：美しさと戦略のハーモニー',
    content: 'ウイングスパンは本当に美しいゲームです。鳥の美麗なイラスト、テーマに合致したメカニクス、そして程よい戦略性。エンジンが回り始める快感は格別です。ファミリーゲームとしても、ゲーマーゲームとしても楽しめる稀有な作品。鳥好きでなくても必ず気に入るはずです。',
    rating: 8,
    overall_score: 8.4,
    rule_complexity: 2,
    luck_factor: 3,
    interaction: 2,
    downtime: 2,
    recommended_players: ['3', '4', '5'],
    mechanics: ['エンジンビルド', 'カードドラフト'],
    categories: ['動物', 'ファミリー'],
    custom_tags: ['ドラフト', 'セット収集', 'ダイスロール'],
    play_time_actual: 75,
    player_count_played: 4,
    pros: ['美しいアートワーク', 'テーマとメカニクスが合致', 'ほど良い戦略性'],
    cons: ['やや単調', 'カード運', 'インタラクション少なめ'],
    is_published: true,
    user_id: 'test-user-3'
  }
]

// 統計情報取得
function getStats() {
  const totalGames = games.length
  const totalReviews = reviews.length
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.overall_score, 0) / reviews.length 
    : 0

  return {
    totalReviews,
    totalGames,
    activeReviewers: 3, // モック値
    averageRating: Math.round(averageRating * 10) / 10,
    reviewsThisMonth: Math.floor(totalReviews * 0.8),
    detailedReviews: reviews.filter(r => r.rule_complexity && r.luck_factor).length
  }
}

// 最新レビュー取得
function getRecentReviews() {
  return reviews
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6)
}

// 人気ゲーム取得
function getPopularGames() {
  const gamesWithStats = games.map(game => {
    const gameReviews = reviews.filter(r => r.game_id === game.id)
    const avgRating = gameReviews.length > 0 
      ? gameReviews.reduce((sum, r) => sum + r.overall_score, 0) / gameReviews.length 
      : 0
    
    return {
      ...game,
      stats: {
        review_count: gameReviews.length,
        avg_rating: Math.round(avgRating * 10) / 10,
        popularity_score: gameReviews.length * avgRating
      }
    }
  })

  return gamesWithStats
    .sort((a, b) => b.stats.popularity_score - a.stats.popularity_score)
    .slice(0, 6)
}

// 統合GET エンドポイント
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const seed = searchParams.get('seed')

    // シードデータ生成
    if (seed === 'true') {
      // ゲームデータを作成
      games = mockGames.map((game, index) => ({
        id: gameIdCounter++,
        ...game,
        created_at: new Date(Date.now() - (10 - index) * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }))

      // レビューデータを作成
      reviews = mockReviews.map((review, index) => {
        const game = games.find(g => g.bgg_id === review.game_bgg_id)
        return {
          id: reviewIdCounter++,
          ...review,
          game_id: game?.id || 1,
          game,
          user_id: 'test-user-' + ((index % 3) + 1),
          created_at: new Date(Date.now() - (5 - index) * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          _count: {
            comments: Math.floor(Math.random() * 10)
          }
        }
      })

      return NextResponse.json({
        success: true,
        message: 'シードデータを作成しました',
        data: {
          games: games.length,
          reviews: reviews.length
        }
      })
    }

    // データタイプ別の取得
    if (type === 'games') {
      return NextResponse.json({
        success: true,
        data: games
      })
    }

    if (type === 'reviews') {
      return NextResponse.json({
        success: true,
        data: reviews
      })
    }

    if (type === 'stats') {
      return NextResponse.json({
        success: true,
        data: getStats()
      })
    }

    if (type === 'recent-reviews') {
      return NextResponse.json({
        success: true,
        data: getRecentReviews()
      })
    }

    if (type === 'popular-games') {
      return NextResponse.json({
        success: true,
        data: getPopularGames()
      })
    }

    // デフォルト: 基本情報
    return NextResponse.json({
      success: true,
      message: 'Seed API - 利用可能なオプション',
      options: [
        '?seed=true - シードデータ生成',
        '?type=games - ゲーム一覧',
        '?type=reviews - レビュー一覧',
        '?type=stats - 統計情報',
        '?type=recent-reviews - 最新レビュー',
        '?type=popular-games - 人気ゲーム'
      ],
      current_data: {
        games: games.length,
        reviews: reviews.length
      }
    })

  } catch (error) {
    console.error('Seed API Error:', error)
    return NextResponse.json(
      { success: false, message: 'API実行中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

