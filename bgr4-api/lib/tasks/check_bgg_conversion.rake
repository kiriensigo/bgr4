namespace :bgg do
  desc "BGGのカテゴリーとメカニクスからサイトのカテゴリーとメカニクスへの変換マップを確認する"
  task check_conversion: :environment do
    puts "BGGカテゴリーからサイトのカテゴリーへの変換マップ:"
    bgg_category_to_site_category = {
      'Animals' => '動物',
      'Bluffing' => 'ブラフ',
      'Card Game' => 'カードゲーム',
      "Children's Game" => '子供',
      'Deduction' => '推理',
      'Dice' => 'ダイス',
      'Memory' => '記憶',
      'Negotiation' => '交渉',
      'Party Game' => 'パーティー',
      'Puzzle' => 'パズル',
      'Wargame' => 'ウォーゲーム',
      'Word Game' => 'ワードゲーム',
      'Fantasy' => 'ファンタジー',
      'Adventure' => 'アドベンチャー',
      'Video Game Theme' => 'ビデオゲーム'
    }
    puts bgg_category_to_site_category.inspect
    
    puts "\nBGGメカニクスからサイトのメカニクスへの変換マップ:"
    bgg_mechanic_to_site_mechanic = {
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
      'Cooperative Game' => '協力',
      'Deck Construction' => 'デッキ/バッグビルド',
      'Deck, Bag, and Pool Building' => 'デッキ/バッグビルド',
      'Deduction' => '推理',
      'Dice Rolling' => 'ダイスロール',
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
    puts bgg_mechanic_to_site_mechanic.inspect
    
    puts "\nBGGのベストプレイ人数からサイトのカテゴリーへの変換マップ:"
    bgg_best_player_to_site_category = {
      '1' => 'ソロ向き',
      '2' => 'ペア向き',
      '6' => '多人数向き',
      '7' => '多人数向き',
      '8' => '多人数向き',
      '9' => '多人数向き',
      '10' => '多人数向き'
    }
    puts bgg_best_player_to_site_category.inspect
    
    # Slay the Spire: The Board Gameの情報を確認
    game = Game.find_by(bgg_id: '338960')
    if game
      puts "\nSlay the Spire: The Board Gameの情報:"
      puts "BGG ID: #{game.bgg_id}"
      puts "名前: #{game.name}"
      puts "ベストプレイ人数: #{game.best_num_players.inspect}"
      puts "おすすめプレイ人数: #{game.recommended_num_players.inspect}"
      puts "カテゴリー: #{game.categories.inspect}"
      puts "メカニクス: #{game.mechanics.inspect}"
      
      # BGGのカテゴリーをサイトのカテゴリーに変換
      site_categories = []
      if game.categories.is_a?(Array)
        game.categories.each do |category|
          site_category = bgg_category_to_site_category[category]
          site_categories << site_category if site_category.present?
        end
      end
      puts "変換後のカテゴリー: #{site_categories.inspect}"
      
      # BGGのメカニクスをサイトのメカニクスに変換
      site_mechanics = []
      if game.mechanics.is_a?(Array)
        game.mechanics.each do |mechanic|
          site_mechanic = bgg_mechanic_to_site_mechanic[mechanic]
          site_mechanics << site_mechanic if site_mechanic.present?
        end
      end
      puts "変換後のメカニクス: #{site_mechanics.inspect}"
      
      # BGGのベストプレイ人数からカテゴリーを追加
      player_categories = []
      if game.best_num_players.is_a?(Array)
        game.best_num_players.each do |num|
          site_category = bgg_best_player_to_site_category[num]
          player_categories << site_category if site_category.present?
        end
      end
      puts "プレイ人数から変換したカテゴリー: #{player_categories.inspect}"
    else
      puts "\nSlay the Spire: The Board Gameが見つかりません。"
    end
  end
end 