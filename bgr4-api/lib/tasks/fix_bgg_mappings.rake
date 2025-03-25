namespace :bgg do
  desc "BGGのカテゴリーとメカニクスのマッピングを@bgg_api.mdcに合わせて修正する"
  task fix_mappings: :environment do
    puts "BGGのカテゴリーとメカニクスのマッピングを@bgg_api.mdcに合わせて修正します..."
    
    # 正しいマッピング（@bgg_api.mdcより）
    # BGGカテゴリーから当サイトのカテゴリーへの変換
    bgg_category_to_site_category = {
      'Animals' => '動物',
      'Bluffing' => 'ブラフ',
      'Card Game' => 'カードゲーム',
      "Children's Game" => '子供向け',
      'Deduction' => '推理',
      'Memory' => '記憶',
      'Negotiation' => '交渉',
      'Party Game' => 'パーティー',
      'Puzzle' => 'パズル',
      'Wargame' => 'ウォーゲーム',
      'Word Game' => 'ワードゲーム'
    }
    
    # BGGカテゴリーから当サイトのメカニクスへの変換
    bgg_category_to_site_mechanic = {
      'Dice' => 'ダイスロール'
    }
    
    # BGGメカニクスから当サイトのカテゴリーへの変換
    bgg_mechanic_to_site_category = {
      'Acting' => '演技',
      'Deduction' => '推理',
      'Legacy Game' => 'レガシー・キャンペーン',
      'Memory' => '記憶',
      'Negotiation' => '交渉',
      'Paper-and-Pencil' => '紙ペン',
      'Scenario / Mission / Campaign Game' => 'レガシー・キャンペーン',
      'Solo / Solitaire Game' => 'ソロ向き',
      'Pattern Building' => 'パズル',
      'Trick-taking' => 'トリテ'
    }
    
    # BGGメカニクスから当サイトのメカニクスへの変換
    bgg_mechanic_to_site_mechanic = {
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
      'Cooperative Game' => '協力',
      'Deck Construction' => 'デッキ/バッグビルド',
      'Deck, Bag, and Pool Building' => 'デッキ/バッグビルド',
      'Dice Rolling' => 'ダイスロール',
      'Hidden Roles' => '正体隠匿',
      'Modular Board' => 'モジュラーボード',
      'Network and Route Building' => 'ルート構築',
      'Open Drafting' => 'ドラフト',
      'Push Your Luck' => 'バースト',
      'Set Collection' => 'セット収集',
      'Simultaneous Action Selection' => '同時手番',
      'Tile Placement' => 'タイル配置',
      'Variable Player Powers' => 'プレイヤー別能力',
      'Variable Set-up' => 'プレイヤー別能力',
      'Worker Placement' => 'ワカプレ',
      'Worker Placement with Dice Workers' => 'ワカプレ',
      'Worker Placement, Different Worker Types' => 'ワカプレ'
    }
    
    # BGGのベストプレイ人数からサイトのカテゴリーへの変換マップ
    bgg_best_player_to_site_category = {
      '1' => 'ソロ向き',
      '2' => 'ペア向き',
      '6' => '多人数向き',
      '7' => '多人数向き',
      '8' => '多人数向き',
      '9' => '多人数向き',
      '10' => '多人数向き'
    }
    
    # 確認用のゲーム
    game = Game.find_by(name: "Scythe")
    
    if game.nil?
      puts "Scytheが見つかりません。他のゲームで試します..."
      game = Game.first
      
      if game.nil?
        puts "ゲームが見つかりません。タスクを中止します。"
        exit
      end
    end
    
    puts "ゲーム「#{game.name}」(BGG ID: #{game.bgg_id})の情報を取得中..."
    
    # BGGからゲーム情報を取得
    bgg_game_info = BggService.get_game_details(game.bgg_id)
    
    if bgg_game_info.nil?
      puts "BGGからゲーム情報を取得できませんでした。タスクを中止します。"
      exit
    end
    
    puts "BGGカテゴリー: #{bgg_game_info[:categories].inspect}"
    puts "BGGメカニクス: #{bgg_game_info[:mechanics].inspect}"
    
    # カテゴリーを設定
    categories = []
    
    # BGGのカテゴリーを当サイトのカテゴリーに変換
    if bgg_game_info[:categories].is_a?(Array)
      bgg_game_info[:categories].each do |category|
        site_category = bgg_category_to_site_category[category]
        if site_category.present?
          puts "BGGカテゴリー「#{category}」→ サイトカテゴリー「#{site_category}」"
          categories << site_category if !categories.include?(site_category)
        else
          puts "BGGカテゴリー「#{category}」はマッピングにありません"
        end
      end
    end
    
    # BGGのメカニクスを当サイトのカテゴリーに変換
    if bgg_game_info[:mechanics].is_a?(Array)
      bgg_game_info[:mechanics].each do |mechanic|
        site_category = bgg_mechanic_to_site_category[mechanic]
        if site_category.present?
          puts "BGGメカニクス「#{mechanic}」→ サイトカテゴリー「#{site_category}」"
          categories << site_category if !categories.include?(site_category)
        else
          puts "BGGメカニクス「#{mechanic}」はカテゴリーマッピングにありません"
        end
      end
    end
    
    puts "変換後のカテゴリー: #{categories.inspect}"
    
    # メカニクスを設定
    mechanics = []
    
    # BGGのカテゴリーを当サイトのメカニクスに変換
    if bgg_game_info[:categories].is_a?(Array)
      bgg_game_info[:categories].each do |category|
        site_mechanic = bgg_category_to_site_mechanic[category]
        if site_mechanic.present?
          puts "BGGカテゴリー「#{category}」→ サイトメカニクス「#{site_mechanic}」"
          mechanics << site_mechanic if !mechanics.include?(site_mechanic)
        else
          puts "BGGカテゴリー「#{category}」はメカニクスマッピングにありません"
        end
      end
    end
    
    # BGGのメカニクスを当サイトのメカニクスに変換
    if bgg_game_info[:mechanics].is_a?(Array)
      bgg_game_info[:mechanics].each do |mechanic|
        site_mechanic = bgg_mechanic_to_site_mechanic[mechanic]
        if site_mechanic.present?
          puts "BGGメカニクス「#{mechanic}」→ サイトメカニクス「#{site_mechanic}」"
          mechanics << site_mechanic if !mechanics.include?(site_mechanic)
        else
          puts "BGGメカニクス「#{mechanic}」はメカニクスマッピングにありません"
        end
      end
    end
    
    puts "変換後のメカニクス: #{mechanics.inspect}"
    
    # カスタムタグを設定（BGGのベストプレイ人数から）
    custom_tags = []
    
    # BGGのベストプレイ人数をサイトのカスタムタグに変換
    if bgg_game_info[:best_num_players].is_a?(Array)
      bgg_game_info[:best_num_players].each do |num|
        site_category = bgg_best_player_to_site_category[num.to_s]
        if site_category.present?
          puts "BGGベストプレイ人数「#{num}」→ サイトカテゴリー「#{site_category}」"
          custom_tags << site_category if !custom_tags.include?(site_category) && !categories.include?(site_category)
        end
      end
    end
    
    puts "変換後のカスタムタグ: #{custom_tags.inspect}"
    
    # 既存のシステムユーザーのレビューを取得して更新
    system_user = User.find_by(email: 'system@boardgamereview.com')
    
    if system_user.nil?
      puts "システムユーザーが見つかりません。タスクを中止します。"
      exit
    end
    
    reviews = Review.where(user_id: system_user.id, game_id: game.bgg_id)
    
    if reviews.empty?
      puts "ゲーム「#{game.name}」のシステムレビューが見つかりません。"
      exit
    end
    
    updated_count = 0
    reviews.each do |review|
      review.mechanics = mechanics
      review.categories = categories
      review.custom_tags = custom_tags
      
      if review.save
        updated_count += 1
      else
        puts "レビュー(ID: #{review.id})の更新に失敗しました: #{review.errors.full_messages.join(', ')}"
      end
    end
    
    puts "#{updated_count}/#{reviews.size}件のシステムレビューを更新しました。"
    
    puts "全システムレビューを@bgg_api.mdcのマッピングに従って更新するには以下を実行してください:"
    puts "bundle exec rails bgg:fix_all_reviews"
  end
  
  desc "全システムレビューのBGGマッピングを@bgg_api.mdcに合わせて修正する"
  task fix_all_reviews: :environment do
    puts "全システムレビューのBGGマッピングを@bgg_api.mdcに合わせて修正します..."
    
    # 正しいマッピング（@bgg_api.mdcより）
    # BGGカテゴリーから当サイトのカテゴリーへの変換
    bgg_category_to_site_category = {
      'Animals' => '動物',
      'Bluffing' => 'ブラフ',
      'Card Game' => 'カードゲーム',
      "Children's Game" => '子供向け',
      'Deduction' => '推理',
      'Memory' => '記憶',
      'Negotiation' => '交渉',
      'Party Game' => 'パーティー',
      'Puzzle' => 'パズル',
      'Wargame' => 'ウォーゲーム',
      'Word Game' => 'ワードゲーム'
    }
    
    # BGGカテゴリーから当サイトのメカニクスへの変換
    bgg_category_to_site_mechanic = {
      'Dice' => 'ダイスロール'
    }
    
    # BGGメカニクスから当サイトのカテゴリーへの変換
    bgg_mechanic_to_site_category = {
      'Acting' => '演技',
      'Deduction' => '推理',
      'Legacy Game' => 'レガシー・キャンペーン',
      'Memory' => '記憶',
      'Negotiation' => '交渉',
      'Paper-and-Pencil' => '紙ペン',
      'Scenario / Mission / Campaign Game' => 'レガシー・キャンペーン',
      'Solo / Solitaire Game' => 'ソロ向き',
      'Pattern Building' => 'パズル',
      'Trick-taking' => 'トリテ'
    }
    
    # BGGメカニクスから当サイトのメカニクスへの変換
    bgg_mechanic_to_site_mechanic = {
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
      'Cooperative Game' => '協力',
      'Deck Construction' => 'デッキ/バッグビルド',
      'Deck, Bag, and Pool Building' => 'デッキ/バッグビルド',
      'Dice Rolling' => 'ダイスロール',
      'Hidden Roles' => '正体隠匿',
      'Modular Board' => 'モジュラーボード',
      'Network and Route Building' => 'ルート構築',
      'Open Drafting' => 'ドラフト',
      'Push Your Luck' => 'バースト',
      'Set Collection' => 'セット収集',
      'Simultaneous Action Selection' => '同時手番',
      'Tile Placement' => 'タイル配置',
      'Variable Player Powers' => 'プレイヤー別能力',
      'Variable Set-up' => 'プレイヤー別能力',
      'Worker Placement' => 'ワカプレ',
      'Worker Placement with Dice Workers' => 'ワカプレ',
      'Worker Placement, Different Worker Types' => 'ワカプレ'
    }
    
    # BGGのベストプレイ人数からサイトのカテゴリーへの変換マップ
    bgg_best_player_to_site_category = {
      '1' => 'ソロ向き',
      '2' => 'ペア向き',
      '6' => '多人数向き',
      '7' => '多人数向き',
      '8' => '多人数向き',
      '9' => '多人数向き',
      '10' => '多人数向き'
    }
    
    # システムユーザーを取得
    system_user = User.find_by(email: 'system@boardgamereview.com')
    
    if system_user.nil?
      puts "システムユーザーが見つかりません。タスクを中止します。"
      exit
    end
    
    # 全ゲームを取得
    games = Game.all
    
    total_games = games.count
    processed_games = 0
    success_games = 0
    
    games.each do |game|
      processed_games += 1
      puts "[#{processed_games}/#{total_games}] ゲーム「#{game.name}」(BGG ID: #{game.bgg_id})の処理中..."
      
      # BGGからゲーム情報を取得
      bgg_game_info = BggService.get_game_details(game.bgg_id)
      
      if bgg_game_info.nil?
        puts "  BGGからゲーム情報を取得できませんでした。スキップします。"
        next
      end
      
      # カテゴリーを設定
      categories = []
      
      # BGGのカテゴリーを当サイトのカテゴリーに変換
      if bgg_game_info[:categories].is_a?(Array)
        bgg_game_info[:categories].each do |category|
          site_category = bgg_category_to_site_category[category]
          if site_category.present?
            categories << site_category if !categories.include?(site_category)
          end
        end
      end
      
      # BGGのメカニクスを当サイトのカテゴリーに変換
      if bgg_game_info[:mechanics].is_a?(Array)
        bgg_game_info[:mechanics].each do |mechanic|
          site_category = bgg_mechanic_to_site_category[mechanic]
          if site_category.present?
            categories << site_category if !categories.include?(site_category)
          end
        end
      end
      
      # メカニクスを設定
      mechanics = []
      
      # BGGのカテゴリーを当サイトのメカニクスに変換
      if bgg_game_info[:categories].is_a?(Array)
        bgg_game_info[:categories].each do |category|
          site_mechanic = bgg_category_to_site_mechanic[category]
          if site_mechanic.present?
            mechanics << site_mechanic if !mechanics.include?(site_mechanic)
          end
        end
      end
      
      # BGGのメカニクスを当サイトのメカニクスに変換
      if bgg_game_info[:mechanics].is_a?(Array)
        bgg_game_info[:mechanics].each do |mechanic|
          site_mechanic = bgg_mechanic_to_site_mechanic[mechanic]
          if site_mechanic.present?
            mechanics << site_mechanic if !mechanics.include?(site_mechanic)
          end
        end
      end
      
      # カスタムタグを設定（BGGのベストプレイ人数から）
      custom_tags = []
      
      # BGGのベストプレイ人数をサイトのカスタムタグに変換
      if bgg_game_info[:best_num_players].is_a?(Array)
        bgg_game_info[:best_num_players].each do |num|
          site_category = bgg_best_player_to_site_category[num.to_s]
          if site_category.present?
            custom_tags << site_category if !custom_tags.include?(site_category) && !categories.include?(site_category)
          end
        end
      end
      
      # システムユーザーのレビューを更新
      reviews = Review.where(user_id: system_user.id, game_id: game.bgg_id)
      
      if reviews.empty?
        puts "  ゲーム「#{game.name}」のシステムレビューが見つかりません。スキップします。"
        next
      end
      
      updated_count = 0
      reviews.each do |review|
        review.mechanics = mechanics
        review.categories = categories
        review.custom_tags = custom_tags
        
        if review.save
          updated_count += 1
        else
          puts "  レビュー(ID: #{review.id})の更新に失敗しました: #{review.errors.full_messages.join(', ')}"
        end
      end
      
      if updated_count > 0
        success_games += 1
        puts "  #{updated_count}/#{reviews.size}件のシステムレビューを更新しました。"
      end
      
      # APIの負荷軽減のために少し待機
      if processed_games % 5 == 0
        puts "APIの負荷軽減のために3秒待機します..."
        sleep 3
      end
    end
    
    puts "処理が完了しました。"
    puts "処理したゲーム数: #{processed_games}"
    puts "レビューを更新したゲーム数: #{success_games}"
  end
end 