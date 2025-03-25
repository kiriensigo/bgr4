namespace :debug do
  desc "BGGマッピングテーブルの内容を確認する"
  task check_bgg_mapping: :environment do
    # ログファイルを設定
    log_file = Rails.root.join('log', 'bgg_mapping_debug.log')
    File.open(log_file, 'w') do |f|
      game = Game.find_by(name: "Scythe")
      
      if game.nil?
        f.puts "Scytheが見つかりません。"
        exit
      end
      
      f.puts "Scythe (BGG ID: #{game.bgg_id})のマッピングを確認します..."
      
      # BGGからゲーム情報を取得
      bgg_game_info = BggService.get_game_details(game.bgg_id)
      
      if bgg_game_info.nil?
        f.puts "BGGからゲーム情報を取得できませんでした。"
        exit
      end
      
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
        'Word Game' => 'ワードゲーム'
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
        'Worker Placement' => 'ワーカープレイスメント'
      }
      
      f.puts "\n=== BGGカテゴリー ==="
      if bgg_game_info[:categories].is_a?(Array)
        f.puts "BGGカテゴリー: #{bgg_game_info[:categories].inspect}"
        
        f.puts "\n変換マップに存在するカテゴリー:"
        bgg_game_info[:categories].each do |category|
          if bgg_category_to_site_mechanic.key?(category)
            f.puts "  #{category} => #{bgg_category_to_site_mechanic[category]}"
          end
        end
        
        f.puts "\n変換マップに存在しないカテゴリー:"
        bgg_game_info[:categories].each do |category|
          unless bgg_category_to_site_mechanic.key?(category)
            f.puts "  #{category} => なし"
          end
        end
      else
        f.puts "カテゴリー情報がありません"
      end
      
      f.puts "\n=== BGGメカニクス ==="
      if bgg_game_info[:mechanics].is_a?(Array)
        f.puts "BGGメカニクス: #{bgg_game_info[:mechanics].inspect}"
        
        f.puts "\n変換マップに存在するメカニクス:"
        bgg_game_info[:mechanics].each do |mechanic|
          if bgg_mechanic_to_site_category.key?(mechanic)
            f.puts "  #{mechanic} => #{bgg_mechanic_to_site_category[mechanic]}"
          end
        end
        
        f.puts "\n変換マップに存在しないメカニクス:"
        bgg_game_info[:mechanics].each do |mechanic|
          unless bgg_mechanic_to_site_category.key?(mechanic)
            f.puts "  #{mechanic} => なし"
          end
        end
      else
        f.puts "メカニクス情報がありません"
      end
      
      # 現在のレビュー情報を表示
      review = Review.where(game_id: game.bgg_id).first
      if review
        f.puts "\n=== 現在のレビュー情報 ==="
        f.puts "カテゴリー: #{review.categories.inspect}"
        f.puts "メカニクス: #{review.mechanics.inspect}"
        f.puts "カスタムタグ: #{review.custom_tags.inspect}"
      else
        f.puts "\nレビュー情報はありません"
      end
      
      # Review モデルのカラム名を確認
      f.puts "\n=== Review モデルのカラム情報 ==="
      f.puts "全カラム: #{Review.column_names.inspect}"
      f.puts "categories カラム?: #{Review.column_names.include?('categories')}"
      f.puts "mechanics カラム?: #{Review.column_names.include?('mechanics')}"
      f.puts "custom_tags カラム?: #{Review.column_names.include?('custom_tags')}"
      f.puts "custom_custom_tags カラム?: #{Review.column_names.include?('custom_custom_tags')}"
    end
    
    puts "ログファイルにデバッグ情報を書き込みました: log/bgg_mapping_debug.log"
  end
end 