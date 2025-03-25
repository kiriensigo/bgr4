namespace :bgg do
  desc "BGGのカテゴリーとメカニクスのマッピングを拡張する"
  task add_mappings: :environment do
    puts "BGGのカテゴリーとメカニクスのマッピングを拡張します..."
    
    # Rake::Task["reviews:create_bgg_review"].invoke
    
    # BGGカテゴリーからサイトのメカニクスへの変換マップ
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
      'Word Game' => 'ワードゲーム',
      # 以下を追加
      'Economic' => '経済',
      'Fighting' => '戦闘',
      'Science Fiction' => 'SF',
      'Territory Building' => 'テリトリー構築'
    }
    
    # BGGメカニクスからサイトのカテゴリーへの変換マップ
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
      'Player Elimination' => 'プレイヤー脱落',
      'Set Collection' => 'セット収集',
      'Storytelling' => 'ストーリーテリング',
      'Trading' => '交渉',
      'Trick-taking' => 'トリックテイキング',
      'Worker Placement' => 'ワーカープレイスメント',
      # 以下を追加
      'Card Play Conflict Resolution' => 'カード対決',
      'Contracts' => '契約',
      'End Game Bonuses' => 'エンドゲームボーナス',
      'Force Commitment' => '兵力配置',
      'Grid Movement' => 'グリッド移動',
      'Hexagon Grid' => 'ヘクスマップ',
      'King of the Hill' => '陣取り',
      'Movement Points' => '移動ポイント',
      'Narrative Choice / Paragraph' => 'ナラティブ選択',
      'Solo / Solitaire Game' => 'ソロプレイ',
      'Take That' => '妨害',
      'Tech Trees / Tech Tracks' => '技術ツリー',
      'Variable Player Powers' => '可変プレイヤー能力',
      'Variable Set-up' => '可変セットアップ',
      'Victory Points as a Resource' => 'VP資源',
      'Zone of Control' => '支配領域'
    }
    
    # 確認用のゲーム
    game = Game.find_by(name: "Scythe")
    
    if game.nil?
      puts "Scytheが見つかりません。タスクを中止します。"
      exit
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
    
    # カテゴリーを設定（BGGのメカニクスから）
    categories = []
    
    # BGGのメカニクスを変換
    if bgg_game_info[:mechanics].is_a?(Array)
      bgg_game_info[:mechanics].each do |mechanic|
        site_category = bgg_mechanic_to_site_category[mechanic]
        if site_category.present?
          puts "BGGメカニクス「#{mechanic}」 → サイトカテゴリー「#{site_category}」"
          categories << site_category if !categories.include?(site_category)
        else
          puts "BGGメカニクス「#{mechanic}」のマッピングがありません"
        end
      end
    end
    
    puts "変換後のカテゴリー: #{categories.inspect}"
    
    # メカニクスを設定（BGGのカテゴリーから）
    mechanics = []
    
    # BGGのカテゴリーを変換
    if bgg_game_info[:categories].is_a?(Array)
      bgg_game_info[:categories].each do |category|
        site_mechanic = bgg_category_to_site_mechanic[category]
        if site_mechanic.present?
          puts "BGGカテゴリー「#{category}」 → サイトメカニクス「#{site_mechanic}」"
          mechanics << site_mechanic if !mechanics.include?(site_mechanic)
        else
          puts "BGGカテゴリー「#{category}」のマッピングがありません"
        end
      end
    end
    
    puts "変換後のメカニクス: #{mechanics.inspect}"
    
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
      
      if review.save
        updated_count += 1
      else
        puts "レビュー(ID: #{review.id})の更新に失敗しました: #{review.errors.full_messages.join(', ')}"
      end
    end
    
    puts "#{updated_count}/#{reviews.size}件のシステムレビューを更新しました。"
  end
end 