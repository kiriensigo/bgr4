import { http, HttpResponse } from 'msw'

// モックデータ
const mockGames = [
  {
    id: 1,
    name: 'モックゲーム1',
    description: 'テスト用のゲーム説明',
    year_published: 2023,
    min_players: 2,
    max_players: 4,
    playing_time: 60,
    image_url: '/mock-game1.jpg',
    thumbnail_url: '/mock-game1-thumb.jpg',
    rating_average: 8.5,
    rating_count: 150,
    mechanics: ['エリアコントロール', 'タイル配置'],
    categories: ['ストラテジー'],
    designers: ['テストデザイナー'],
    publishers: ['テスト出版社'],
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 2,
    name: 'モックゲーム2',
    description: '2番目のテスト用ゲーム',
    year_published: 2022,
    min_players: 1,
    max_players: 6,
    playing_time: 90,
    image_url: '/mock-game2.jpg',
    thumbnail_url: '/mock-game2-thumb.jpg',
    rating_average: 7.2,
    rating_count: 89,
    mechanics: ['協力', 'ダイスロール'],
    categories: ['協力ゲーム'],
    designers: ['テストデザイナー2'],
    publishers: ['テスト出版社2'],
    created_at: '2024-01-02T00:00:00.000Z',
    updated_at: '2024-01-02T00:00:00.000Z'
  }
]

const mockReviews = [
  {
    id: 1,
    title: 'すばらしいゲーム！',
    content: 'このゲームは本当に面白いです。戦略性が高く、何度でも遊べます。',
    overall_score: 9,
    fun_score: 9,
    component_quality: 8,
    rule_complexity: 6,
    replayability: 10,
    game_id: 1,
    user_id: 'user1',
    is_published: true,
    created_at: '2024-01-01T10:00:00.000Z',
    updated_at: '2024-01-01T10:00:00.000Z',
    game: mockGames[0],
    user: {
      id: 'user1',
      username: 'testuser1',
      full_name: 'テストユーザー1'
    }
  },
  {
    id: 2,
    title: 'まあまあのゲーム',
    content: '悪くはないが、特別すごいわけでもない。',
    overall_score: 6,
    fun_score: 6,
    component_quality: 7,
    rule_complexity: 4,
    replayability: 5,
    game_id: 2,
    user_id: 'user2',
    is_published: true,
    created_at: '2024-01-02T10:00:00.000Z',
    updated_at: '2024-01-02T10:00:00.000Z',
    game: mockGames[1],
    user: {
      id: 'user2',
      username: 'testuser2',
      full_name: 'テストユーザー2'
    }
  }
]

const mockUsers = [
  {
    id: 'user1',
    username: 'testuser1',
    email: 'test1@example.com',
    full_name: 'テストユーザー1',
    is_admin: false,
    created_at: '2024-01-01T00:00:00.000Z',
    last_sign_in_at: '2024-01-01T12:00:00.000Z'
  },
  {
    id: 'admin1',
    username: 'admin',
    email: 'admin@example.com',
    full_name: '管理者',
    is_admin: true,
    created_at: '2024-01-01T00:00:00.000Z',
    last_sign_in_at: '2024-01-01T12:00:00.000Z'
  }
]

export const handlers = [
  // ゲーム関連API
  http.get('/api/local/games', () => {
    return HttpResponse.json({
      success: true,
      data: mockGames,
      total: mockGames.length
    })
  }),

  http.get('/api/local/games/:id', ({ params }) => {
    const id = parseInt(params.id)
    const game = mockGames.find(g => g.id === id)
    
    if (!game) {
      return HttpResponse.json(
        { success: false, message: 'Game not found' },
        { status: 404 }
      )
    }
    
    return HttpResponse.json({
      success: true,
      data: game
    })
  }),

  // レビュー関連API
  http.get('/api/local/reviews', () => {
    return HttpResponse.json({
      success: true,
      data: mockReviews,
      total: mockReviews.length
    })
  }),

  http.get('/api/local/reviews/:id', ({ params }) => {
    const id = parseInt(params.id)
    const review = mockReviews.find(r => r.id === id)
    
    if (!review) {
      return HttpResponse.json(
        { success: false, message: 'Review not found' },
        { status: 404 }
      )
    }
    
    return HttpResponse.json({
      success: true,
      data: review
    })
  }),

  http.post('/api/local/reviews', async ({ request }) => {
    const body = await request.json()
    const newReview = {
      id: mockReviews.length + 1,
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      game: mockGames.find(g => g.id === body.game_id),
      user: mockUsers.find(u => u.id === body.user_id)
    }
    
    mockReviews.push(newReview)
    
    return HttpResponse.json({
      success: true,
      data: newReview
    }, { status: 201 })
  }),

  // 管理者関連API
  http.get('/api/admin/stats', () => {
    return HttpResponse.json({
      success: true,
      data: {
        totalUsers: mockUsers.length,
        totalGames: mockGames.length,
        totalReviews: mockReviews.length,
        averageRating: 7.8
      }
    })
  }),

  http.get('/api/admin/users', () => {
    return HttpResponse.json({
      success: true,
      data: {
        users: mockUsers,
        total: mockUsers.length,
        page: 1,
        totalPages: 1
      }
    })
  }),

  // 検索API
  http.get('/api/search', ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get('q') || ''
    const type = url.searchParams.get('type') || 'all'
    
    let results = []
    
    if (type === 'games' || type === 'all') {
      const gameResults = mockGames
        .filter(game => game.name.toLowerCase().includes(query.toLowerCase()))
        .map(game => ({ ...game, type: 'game' }))
      results.push(...gameResults)
    }
    
    if (type === 'reviews' || type === 'all') {
      const reviewResults = mockReviews
        .filter(review => 
          review.title.toLowerCase().includes(query.toLowerCase()) ||
          review.content.toLowerCase().includes(query.toLowerCase())
        )
        .map(review => ({ ...review, type: 'review' }))
      results.push(...reviewResults)
    }
    
    return HttpResponse.json({
      success: true,
      data: results,
      total: results.length
    })
  }),

  // エラーケースのテスト
  http.get('/api/error-test', () => {
    return HttpResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }),

  // BGG API モック
  http.get('https://boardgamegeek.com/xmlapi2/*', () => {
    const mockXMLResponse = `
      <?xml version="1.0" encoding="UTF-8"?>
      <items>
        <item type="boardgame" id="174430">
          <name type="primary" sortindex="1" value="Gloomhaven" />
          <description>Gloomhaven is a game of Euro-inspired tactical combat...</description>
          <yearpublished value="2017" />
          <minplayers value="1" />
          <maxplayers value="4" />
          <playingtime value="120" />
          <minage value="14" />
        </item>
      </items>
    `
    
    return HttpResponse.text(mockXMLResponse, {
      headers: {
        'Content-Type': 'application/xml'
      }
    })
  })
]