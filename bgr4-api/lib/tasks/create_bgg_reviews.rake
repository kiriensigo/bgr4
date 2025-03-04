namespace :reviews do
  desc "BGGからのデータを使用して初期レビューを作成する"
  task create_bgg_review: :environment do
    # システムユーザーが存在することを確認
    Rake::Task["system_user:ensure_exists"].invoke
    
    # システムユーザーを取得
    system_user = User.find_by(email: 'system@boardgamereview.com')
    
    if system_user.nil?
      puts "システムユーザーが見つかりません。タスクを中止します。"
      exit
    end
    
    # BGGカテゴリーからサイトのメカニクスへの変換マップ（指定されたもののみ）
    bgg_category_to_site_mechanic = {
      'Animals' => '動物',
      'Bluffing' => 'ブラフ',
      'Card Game' => 'カードゲーム',
      "Children's Game" => '子供向け',
      'Deduction' => '推理',
      'Dice' => 'ダイス',
      'Memory' => '記憶',
      'Negotiation' => '交渉',
      'Party Game' => 'パーティー',
      'Puzzle' => 'パズル',
      'Wargame' => 'ウォーゲーム',
      'Word Game' => 'ワードゲーム'
    }
    
    # BGGメカニクスからサイトのカテゴリーへの変換マップ（指定されたもののみ）
    bgg_mechanic_to_site_category = {
      'Acting' => '演技',
      'Area Majority / Influence' => 'エリア支配',
      'Auction / Bidding' => 'オークション',
      'Auction Compensation' => 'オークション',
      'Auction: Dexterity' => 'オークション',
      'Auction: Dutch' => 'オークション',
      'Auction: Dutch Priority' => 'オークション',
      'Auction: English' => 'オークション',
      'Auction: Fixed Placement' => 'オークション',
      'Auction: Multiple Lot' => 'オークション',
      'Auction: Once Around' => 'オークション',
      'Auction: Sealed Bid' => 'オークション',
      'Auction: Turn Order Until Pass' => 'オークション',
      'Betting and Bluffing' => '賭け',
      'Closed Drafting' => 'ドラフト',
      'Cooperative Game' => '協力ゲーム',
      'Deck Construction' => 'デッキ構築',
      'Deck, Bag, and Pool Building' => 'デッキ/バッグビルド',
      'Deduction' => '推理',
      'Dice Rolling' => 'ダイス',
      'Hidden Roles' => '正体隠匿',
      'Legacy Game' => 'レガシー・キャンペーン',
      'Memory' => '記憶',
      'Modular Board' => 'モジュラーボード',
      'Negotiation' => '交渉',
      'Network and Route Building' => 'ルート構築',
      'Open Drafting' => 'ドラフト',
      'Paper-and-Pencil' => '紙ペン',
      'Push Your Luck' => 'バースト',
      'Scenario / Mission / Campaign Game' => 'レガシー・キャンペーン',
      'Set Collection' => 'セット収集',
      'Simultaneous Action Selection' => '同時手番',
      'Solo / Solitaire Game' => 'ソロ向き',
      'Pattern Building' => 'パズル',
      'Tile Placement' => 'タイル配置',
      'Trick-taking' => 'トリテ',
      'Variable Player Powers' => 'プレイヤー別能力',
      'Variable Set-up' => 'プレイヤー別能力',
      'Worker Placement' => 'ワカプレ',
      'Worker Placement with Dice Workers' => 'ワカプレ',
      'Worker Placement, Different Worker Types' => 'ワカプレ',
      'Hand Management' => 'ハンドマネジメント'
    }
    
    # BGGのベストプレイ人数からサイトのタグへの変換マップ
    bgg_best_player_to_site_tag = {
      '1' => 'ソロ向き',
      '2' => 'ペア向き',
      '6' => '多人数向き',
      '7' => '多人数向き',
      '8' => '多人数向き',
      '9' => '多人数向き',
      '10' => '多人数向き'
    }
    
    # Slay the Spire: The Board Gameを取得
    game = Game.find_by(bgg_id: '338960')
    
    if game.nil?
      puts "Slay the Spire: The Board Game (BGG ID: 338960)が見つかりません。タスクを中止します。"
      exit
    end
    
    puts "ゲーム「#{game.name}」(BGG ID: #{game.bgg_id})の初期レビューを作成中..."
    
    # BGGからゲーム情報を取得
    bgg_game_info = BggService.get_game_details(game.bgg_id)
    
    if bgg_game_info.nil?
      puts "  BGGからゲーム情報を取得できませんでした。スキップします。"
      exit
    end
    
    # 既存のシステムユーザーのレビューを削除
    game.reviews.where(user: system_user).destroy_all
    puts "  既存のシステムレビューを削除しました。"
    
    # BGGの評価を当サイトの評価に変換（BGGも10点満点）
    bgg_rating = bgg_game_info[:average_score].to_f
    # 5点以上10点以下に制限
    overall_score = [5.0, [bgg_rating, 10.0].min].max
    
    # BGGの重さを当サイトのルール複雑さに変換（5点満点に正規化）
    weight = bgg_game_info[:weight].to_f
    # 1点以上5点以下に制限
    rule_complexity = [1.0, [weight, 5.0].min].max
    
    # その他の評価項目は固定値3に設定
    luck_factor = 3
    interaction = 3
    downtime = 3
    
    # おすすめプレイ人数を設定
    recommended_players = []
    
    # BGGのベストプレイ人数を変換
    if bgg_game_info[:best_num_players].is_a?(Array)
      bgg_game_info[:best_num_players].each do |num|
        recommended_players << num if num.present?
      end
    end
    
    # BGGのレコメンドプレイ人数も追加
    if bgg_game_info[:recommended_num_players].is_a?(Array)
      bgg_game_info[:recommended_num_players].each do |num|
        recommended_players << num if num.present? && !recommended_players.include?(num)
      end
    end
    
    # 最低でも1つはプレイ人数を設定
    if recommended_players.empty?
      if game.min_players == game.max_players
        recommended_players << game.min_players.to_s
      else
        # 最小と最大の間でランダムに選択
        recommended_players << rand(game.min_players..game.max_players).to_s
      end
    end
    
    # タグを設定（BGGのベストプレイ人数から）
    tags = []
    
    # BGGのベストプレイ人数からタグを追加
    recommended_players.each do |num|
      site_tag = bgg_best_player_to_site_tag[num.to_s]
      tags << site_tag if site_tag.present? && !tags.include?(site_tag)
    end
    
    # カテゴリーを設定（BGGのメカニクスから）
    categories = []
    
    # BGGのメカニクスを変換（指定されたもののみ）
    if bgg_game_info[:mechanics].is_a?(Array)
      bgg_game_info[:mechanics].each do |mechanic|
        site_category = bgg_mechanic_to_site_category[mechanic]
        categories << site_category if site_category.present? && !categories.include?(site_category)
      end
    end
    
    # メカニクスを設定（BGGのカテゴリーから）
    mechanics = []
    
    # BGGのカテゴリーを変換（指定されたもののみ）
    if bgg_game_info[:categories].is_a?(Array)
      bgg_game_info[:categories].each do |category|
        site_mechanic = bgg_category_to_site_mechanic[category]
        mechanics << site_mechanic if site_mechanic.present? && !mechanics.include?(site_mechanic)
      end
    end
    
    # 短いコメントを生成
    short_comments = [
      "戦略性が高く、何度でも遊びたくなるゲームです。",
      "シンプルなルールながら奥深い戦略性があります。",
      "テーマと機構がうまく融合した素晴らしいゲームです。",
      "初心者から上級者まで楽しめる万能な一作。",
      "コンポーネントの質が高く、見た目も美しいゲームです。",
      "プレイ時間の割に得られる満足感が大きいです。",
      "テーブルに出すと必ず盛り上がる名作です。",
      "戦略の幅が広く、リプレイ性に優れています。",
      "バランスが取れた素晴らしいデザインのゲームです。",
      "テンポよく進み、ダウンタイムが少ないのが魅力です。"
    ]
    
    # 10件のレビューを作成
    created_count = 0
    10.times do |i|
      # 各レビューで異なるコメントを使用
      short_comment = short_comments[i % short_comments.length]
      
      review = Review.create(
        user_id: system_user.id,
        game_id: game.bgg_id,
        overall_score: overall_score,
        rule_complexity: rule_complexity,
        luck_factor: luck_factor,
        interaction: interaction,
        downtime: downtime,
        recommended_players: recommended_players,
        mechanics: mechanics,
        tags: tags,
        short_comment: short_comment
      )
      
      if review.persisted?
        created_count += 1
      end
    end
    
    puts "  #{created_count}件のシステムレビューを作成しました: 総合評価 #{overall_score.round(1)}, ルール複雑さ #{rule_complexity.round(1)}"
    puts "  おすすめプレイ人数: #{recommended_players.join(', ')}"
    puts "  カテゴリー: #{categories.join(', ')}"
    puts "  メカニクス: #{mechanics.join(', ')}"
    puts "  タグ: #{tags.join(', ')}"
    
    puts "初期レビューの作成が完了しました。"
  end
  
  desc "すべてのゲームに対してBGGからのデータを使用して初期レビューを作成する"
  task create_all_bgg_reviews: :environment do
    # システムユーザーが存在することを確認
    Rake::Task["system_user:ensure_exists"].invoke
    
    # システムユーザーを取得
    system_user = User.find_by(email: 'system@boardgamereview.com')
    
    if system_user.nil?
      puts "システムユーザーが見つかりません。タスクを中止します。"
      exit
    end
    
    # BGGカテゴリーからサイトのメカニクスへの変換マップ（指定されたもののみ）
    bgg_category_to_site_mechanic = {
      'Animals' => '動物',
      'Bluffing' => 'ブラフ',
      'Card Game' => 'カードゲーム',
      "Children's Game" => '子供向け',
      'Deduction' => '推理',
      'Dice' => 'ダイス',
      'Memory' => '記憶',
      'Negotiation' => '交渉',
      'Party Game' => 'パーティー',
      'Puzzle' => 'パズル',
      'Wargame' => 'ウォーゲーム',
      'Word Game' => 'ワードゲーム'
    }
    
    # BGGメカニクスからサイトのカテゴリーへの変換マップ（指定されたもののみ）
    bgg_mechanic_to_site_category = {
      'Acting' => '演技',
      'Area Majority / Influence' => 'エリア支配',
      'Auction / Bidding' => 'オークション',
      'Auction Compensation' => 'オークション',
      'Auction: Dexterity' => 'オークション',
      'Auction: Dutch' => 'オークション',
      'Auction: Dutch Priority' => 'オークション',
      'Auction: English' => 'オークション',
      'Auction: Fixed Placement' => 'オークション',
      'Auction: Multiple Lot' => 'オークション',
      'Auction: Once Around' => 'オークション',
      'Auction: Sealed Bid' => 'オークション',
      'Auction: Turn Order Until Pass' => 'オークション',
      'Betting and Bluffing' => '賭け',
      'Closed Drafting' => 'ドラフト',
      'Cooperative Game' => '協力ゲーム',
      'Deck Construction' => 'デッキ構築',
      'Deck, Bag, and Pool Building' => 'デッキ/バッグビルド',
      'Deduction' => '推理',
      'Dice Rolling' => 'ダイス',
      'Hidden Roles' => '正体隠匿',
      'Legacy Game' => 'レガシー・キャンペーン',
      'Memory' => '記憶',
      'Modular Board' => 'モジュラーボード',
      'Negotiation' => '交渉',
      'Network and Route Building' => 'ルート構築',
      'Open Drafting' => 'ドラフト',
      'Paper-and-Pencil' => '紙ペン',
      'Push Your Luck' => 'バースト',
      'Scenario / Mission / Campaign Game' => 'レガシー・キャンペーン',
      'Set Collection' => 'セット収集',
      'Simultaneous Action Selection' => '同時手番',
      'Solo / Solitaire Game' => 'ソロ向き',
      'Pattern Building' => 'パズル',
      'Tile Placement' => 'タイル配置',
      'Trick-taking' => 'トリテ',
      'Variable Player Powers' => 'プレイヤー別能力',
      'Variable Set-up' => 'プレイヤー別能力',
      'Worker Placement' => 'ワカプレ',
      'Worker Placement with Dice Workers' => 'ワカプレ',
      'Worker Placement, Different Worker Types' => 'ワカプレ',
      'Hand Management' => 'ハンドマネジメント'
    }
    
    # BGGのベストプレイ人数からサイトのタグへの変換マップ
    bgg_best_player_to_site_tag = {
      '1' => 'ソロ向き',
      '2' => 'ペア向き',
      '6' => '多人数向き',
      '7' => '多人数向き',
      '8' => '多人数向き',
      '9' => '多人数向き',
      '10' => '多人数向き'
    }
    
    # 短いコメントのリスト
    short_comments = [
      "戦略性が高く、何度でも遊びたくなるゲームです。",
      "シンプルなルールながら奥深い戦略性があります。",
      "テーマと機構がうまく融合した素晴らしいゲームです。",
      "初心者から上級者まで楽しめる万能な一作。",
      "コンポーネントの質が高く、見た目も美しいゲームです。",
      "プレイ時間の割に得られる満足感が大きいです。",
      "テーブルに出すと必ず盛り上がる名作です。",
      "戦略の幅が広く、リプレイ性に優れています。",
      "バランスが取れた素晴らしいデザインのゲームです。",
      "テンポよく進み、ダウンタイムが少ないのが魅力です。"
    ]
    
    # すべてのゲームを取得
    games = Game.all
    total_games = games.count
    processed_games = 0
    success_games = 0
    
    puts "#{total_games}件のゲームに対して初期レビューを作成します..."
    
    games.each do |game|
      processed_games += 1
      puts "[#{processed_games}/#{total_games}] ゲーム「#{game.name}」(BGG ID: #{game.bgg_id})の初期レビューを作成中..."
      
      # BGGからゲーム情報を取得
      bgg_game_info = BggService.get_game_details(game.bgg_id)
      
      if bgg_game_info.nil?
        puts "  BGGからゲーム情報を取得できませんでした。スキップします。"
        next
      end
      
      # 既存のシステムユーザーのレビューを削除
      game.reviews.where(user: system_user).destroy_all
      
      # BGGの評価を当サイトの評価に変換（BGGも10点満点）
      bgg_rating = bgg_game_info[:average_score].to_f
      if bgg_rating <= 0
        puts "  BGGの評価が取得できませんでした。スキップします。"
        next
      end
      
      # 5点以上10点以下に制限
      overall_score = [5.0, [bgg_rating, 10.0].min].max
      
      # BGGの重さを当サイトのルール複雑さに変換（5点満点に正規化）
      weight = bgg_game_info[:weight].to_f
      # 1点以上5点以下に制限
      rule_complexity = [1.0, [weight, 5.0].min].max
      
      # その他の評価項目は固定値3に設定
      luck_factor = 3
      interaction = 3
      downtime = 3
      
      # おすすめプレイ人数を設定
      recommended_players = []
      
      # BGGのベストプレイ人数を変換
      if bgg_game_info[:best_num_players].is_a?(Array)
        bgg_game_info[:best_num_players].each do |num|
          recommended_players << num if num.present?
        end
      end
      
      # BGGのレコメンドプレイ人数も追加
      if bgg_game_info[:recommended_num_players].is_a?(Array)
        bgg_game_info[:recommended_num_players].each do |num|
          recommended_players << num if num.present? && !recommended_players.include?(num)
        end
      end
      
      # 最低でも1つはプレイ人数を設定
      if recommended_players.empty?
        if game.min_players == game.max_players
          recommended_players << game.min_players.to_s
        elsif game.min_players.present? && game.max_players.present?
          # 最小と最大の間でランダムに選択
          recommended_players << rand(game.min_players..game.max_players).to_s
        end
      end
      
      # タグを設定（BGGのベストプレイ人数から）
      tags = []
      
      # BGGのベストプレイ人数からタグを追加
      recommended_players.each do |num|
        site_tag = bgg_best_player_to_site_tag[num.to_s]
        tags << site_tag if site_tag.present? && !tags.include?(site_tag)
      end
      
      # カテゴリーを設定（BGGのメカニクスから）
      categories = []
      
      # BGGのメカニクスを変換（指定されたもののみ）
      if bgg_game_info[:mechanics].is_a?(Array)
        bgg_game_info[:mechanics].each do |mechanic|
          site_category = bgg_mechanic_to_site_category[mechanic]
          categories << site_category if site_category.present? && !categories.include?(site_category)
        end
      end
      
      # メカニクスを設定（BGGのカテゴリーから）
      mechanics = []
      
      # BGGのカテゴリーを変換（指定されたもののみ）
      if bgg_game_info[:categories].is_a?(Array)
        bgg_game_info[:categories].each do |category|
          site_mechanic = bgg_category_to_site_mechanic[category]
          mechanics << site_mechanic if site_mechanic.present? && !mechanics.include?(site_mechanic)
        end
      end
      
      # 10件のレビューを作成
      created_count = 0
      10.times do |i|
        # 各レビューで異なるコメントを使用
        short_comment = short_comments[i % short_comments.length]
        
        review = Review.create(
          user_id: system_user.id,
          game_id: game.bgg_id,
          overall_score: overall_score,
          rule_complexity: rule_complexity,
          luck_factor: luck_factor,
          interaction: interaction,
          downtime: downtime,
          recommended_players: recommended_players,
          mechanics: mechanics,
          tags: tags,
          short_comment: short_comment
        )
        
        if review.persisted?
          created_count += 1
        end
      end
      
      if created_count > 0
        success_games += 1
        puts "  #{created_count}件のシステムレビューを作成しました: 総合評価 #{overall_score.round(1)}, ルール複雑さ #{rule_complexity.round(1)}"
      else
        puts "  レビューの作成に失敗しました。"
      end
      
      # APIの負荷軽減のために少し待機
      if processed_games % 5 == 0
        puts "APIの負荷軽減のために3秒待機します..."
        sleep 3
      end
    end
    
    puts "初期レビューの作成が完了しました。"
    puts "処理したゲーム数: #{processed_games}"
    puts "レビューを作成したゲーム数: #{success_games}"
  end
end 