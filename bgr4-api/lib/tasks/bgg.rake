namespace :bgg do
  desc "BGGからランキング上位のゲームを取得してデータベースに登録する"
  task import_top_games: :environment do
    require 'net/http'
    require 'rexml/document'
    require 'cgi'

    # BGG APIのエンドポイント
    BGG_API_BASE_URL = "https://www.boardgamegeek.com/xmlapi2"

    def fetch_bgg_hot_items
      url = URI("#{BGG_API_BASE_URL}/hot?type=boardgame")
      puts "Fetching hot items from: #{url}"
      
      response_xml = nil
      # BGG APIは時々空のレスポンスを返すため、リトライ処理を入れる
      5.times do |i|
        response = Net::HTTP.get(url)
        # 202 Acceptedは処理中を示すため、リトライする
        if response.include?('<items termsofuse="https://boardgamegeek.com/xmlapi/termsofuse">') && !response.strip.end_with?("</items>")
            puts "BGG API is processing... Retrying in #{i + 1} seconds."
            sleep(i + 1)
            next
        end
        response_xml = response
        break
      end

      if response_xml.nil?
        puts "Failed to get a valid response from BGG API after multiple retries."
        return []
      end

      doc = REXML::Document.new(response_xml)
      
      game_ids = []
      doc.elements.each('items/item') do |item_element|
        game_ids << item_element.attributes['id']
      end
      puts "Found #{game_ids.length} hot game IDs."
      game_ids
    rescue => e
      puts "Error fetching hot items: #{e.message}"
      []
    end

    def create_game_from_bgg(bgg_id)
      puts "Processing BGG ID: #{bgg_id}..."
      
      # 既に存在するか確認
      if Game.exists?(bgg_id: bgg_id)
        puts "Game with BGG ID #{bgg_id} already exists. Skipping."
        return
      end

      # BGGからゲーム情報を取得するサービスを呼び出す (既存のロジックを再利用)
      bgg_game_info = BggService.get_game_details(bgg_id)
      
      if bgg_game_info.nil?
        puts "Failed to fetch details for BGG ID #{bgg_id}."
        return
      end

      # ゲームを作成
      game = Game.new(
        bgg_id: bgg_id,
        name: bgg_game_info[:name],
        description: bgg_game_info[:description],
        image_url: bgg_game_info[:image_url],
        min_players: bgg_game_info[:min_players],
        max_players: bgg_game_info[:max_players],
        play_time: bgg_game_info[:play_time],
        min_play_time: bgg_game_info[:min_play_time],
        weight: bgg_game_info[:weight],
        publisher: bgg_game_info[:publisher],
        designer: bgg_game_info[:designer],
        release_date: bgg_game_info[:release_date],
        registered_on_site: true # サイトに登録済みとしてマーク
      )
      
      if game.save
        puts "Successfully created game: #{game.name} (BGG ID: #{bgg_id})"
        # BGGからの詳細情報（日本語名など）を取得・更新する
        game.update_from_bgg(true)
        puts "Updated details for #{game.name}."
      else
        puts "Failed to create game for BGG ID #{bgg_id}. Errors: #{game.errors.full_messages.join(", ")}"
      end
    rescue => e
      puts "An error occurred while processing BGG ID #{bgg_id}: #{e.message}"
    end

    puts "Starting to import top games from BGG..."
    
    # BGGの"hot"リストはランキング上位約50件を取得
    # 1000件を取得するにはより複雑なスクレイピング等が必要になるため、
    # まずはhotリストのゲームでテストします。
    game_ids = fetch_bgg_hot_items
    
    game_ids.each do |id|
      create_game_from_bgg(id)
      # API制限を避けるために少し待つ
      sleep(2)
    end

    puts "Finished importing games."
  end

  desc "BGG Top3000ランキングゲームを登録する"
  task register_top_1000: :environment do
    puts "🎲 BGG Top3000ゲーム登録を開始します..."
    puts "⚠️  APIレート制限対策でディレイを設けています"
    
    start_time = Time.current
    total_games = 0
    successful_games = 0
    failed_games = 0
    skipped_games = 0

    begin
      # BGGブラウズページから3000位までのゲームIDを収集
      all_game_ids = []
      pages_to_fetch = 30 # 1ページあたり約100件なので30ページで3000件カバー

      puts "📖 BGGブラウズページからゲームIDを収集中..."
      
      (1..pages_to_fetch).each do |page|
        puts "  📄 ページ #{page}/#{pages_to_fetch} を処理中..."
        
        game_ids = BggService.get_top_games_from_browse(page)
        all_game_ids.concat(game_ids)
        
        puts "    ✅ #{game_ids.count}件のゲームIDを取得"
        
        # ページ間のディレイ（BGGサーバー負荷軽減）
        sleep 3
      end

      # 重複除去
      unique_game_ids = all_game_ids.uniq
      puts "📊 合計 #{unique_game_ids.count}件のユニークなゲームIDを収集"

      # バッチ処理でゲーム詳細を取得・登録
      batch_size = 10 # BGG APIの制限を考慮
      batches = unique_game_ids.each_slice(batch_size).to_a

      puts "🔄 #{batches.count}バッチでゲーム詳細を取得・登録中..."

      batches.each_with_index do |batch_ids, batch_index|
        puts "  📦 バッチ #{batch_index + 1}/#{batches.count} (#{batch_ids.count}件)..."
        
        begin
          # バッチでゲーム詳細を取得
          games_data = BggService.get_games_details_batch(batch_ids)
          
          games_data.each do |game_data|
            total_games += 1
            
            begin
              # 既に存在するかチェック
              existing_game = Game.find_by(bgg_id: game_data[:bgg_id])
              
              if existing_game
                puts "    ⏭️  ゲーム #{game_data[:name]} (ID: #{game_data[:bgg_id]}) は既に登録済み"
                skipped_games += 1
                next
              end

              # ゲームを新規作成
              game = Game.new(
                bgg_id: game_data[:bgg_id],
                name: game_data[:name],
                japanese_name: game_data[:japanese_name],
                description: game_data[:description],
                image_url: game_data[:image_url],
                min_players: game_data[:min_players],
                max_players: game_data[:max_players],
                play_time: game_data[:play_time],
                min_play_time: game_data[:min_play_time],
                weight: game_data[:weight],
                publisher: game_data[:publisher],
                japanese_publisher: game_data[:japanese_publisher],
                designer: game_data[:designer],
                release_date: game_data[:release_date],
                japanese_release_date: game_data[:japanese_release_date],
                registered_on_site: true,
                # BGGスコア関連
                bgg_score: game_data[:average_score] || 7.5,
                average_score: game_data[:average_score] || 7.5
              )

              if game.save
                puts "    ✅ ゲーム作成成功: #{game.name} (ID: #{game.bgg_id})"
                successful_games += 1
                
                # BGG情報から重み付けデータを登録（システムレビューは廃止）
                register_bgg_weighted_data(game, game_data)
                
              else
                puts "    ❌ ゲーム作成失敗: #{game_data[:name]} - #{game.errors.full_messages.join(', ')}"
                failed_games += 1
              end

            rescue => e
              puts "    ❌ ゲーム処理エラー (ID: #{game_data[:bgg_id]}): #{e.message}"
              failed_games += 1
            end
          end

        rescue => e
          puts "    ❌ バッチ処理エラー: #{e.message}"
          failed_games += batch_ids.count
          total_games += batch_ids.count
        end

        # バッチ間のディレイ（BGG API制限対策）
        puts "    ⏱️  APIレート制限対策で5秒待機..."
        sleep 5
      end

    rescue => e
      puts "❌ BGG Top3000登録でエラーが発生: #{e.message}"
      Rails.logger.error "BGG Top3000登録エラー: #{e.message}\n#{e.backtrace.join("\n")}"
    end

    # 処理結果サマリー
    end_time = Time.current
    elapsed_time = (end_time - start_time).round(2)

    puts "\n🏁 BGG Top3000ゲーム登録完了！"
    puts "📊 処理結果:"
    puts "   📝 総処理数: #{total_games}件"
    puts "   ✅ 成功: #{successful_games}件"
    puts "   ⏭️  スキップ: #{skipped_games}件"
    puts "   ❌ 失敗: #{failed_games}件"
    puts "   ⏱️  処理時間: #{elapsed_time}秒"
    puts "🎮 登録されたゲームはBGG重み付けデータ×10で評価計算されます"
  end

  private

  # BGGデータから重み付けデータを登録する
  def register_bgg_weighted_data(game, game_data)
    begin
      puts "      🔄 BGG重み付けデータ登録中: #{game.name}"
      
      # BGGルールに従ってカテゴリーとメカニクスを変換・重み付け
      converted_categories = []
      converted_mechanics = []
      
      # カテゴリーの重み付け登録（BGG情報×10）
      if game_data[:categories].present?
        game_data[:categories].each do |bgg_category|
          # BGGカテゴリーをサイト形式に変換
          site_category = convert_bgg_category_to_site(bgg_category)
          if site_category
            # 重み付け×10で登録
            10.times { converted_categories << site_category }
          end
          
          # BGGカテゴリーからサイトメカニクスへの変換もチェック
          site_mechanic = convert_bgg_category_to_site_mechanic(bgg_category)
          if site_mechanic
            10.times { converted_mechanics << site_mechanic }
          end
        end
      end

      # メカニクスの重み付け登録（BGG情報×10）
      if game_data[:mechanics].present?
        game_data[:mechanics].each do |bgg_mechanic|
          # BGGメカニクスをサイトカテゴリーに変換
          site_category = convert_bgg_mechanic_to_site_category(bgg_mechanic)
          if site_category
            10.times { converted_categories << site_category }
          end
          
          # BGGメカニクスをサイトメカニクスに変換
          site_mechanic = convert_bgg_mechanic_to_site(bgg_mechanic)
          if site_mechanic
            10.times { converted_mechanics << site_mechanic }
          end
        end
      end

      # BGGベストプレイ人数からカテゴリーへの変換
      if game_data[:best_num_players].present?
        game_data[:best_num_players].each do |num_players|
          category = convert_best_players_to_category(num_players)
          if category
            10.times { converted_categories << category }
          end
        end
      end

      # メタデータに保存
      game.store_metadata(:categories, converted_categories) if converted_categories.any?
      game.store_metadata(:mechanics, converted_mechanics) if converted_mechanics.any?
      
      # おすすめ人数の重み付け登録
      if game_data[:best_num_players].present?
        weighted_recommended_players = []
        game_data[:best_num_players].each do |num_players|
          10.times { weighted_recommended_players << num_players.to_s }
        end
        game.store_metadata(:best_num_players, weighted_recommended_players)
      end

      game.save!
      puts "      ✅ BGG重み付けデータ登録完了"

    rescue => e
      puts "      ❌ BGG重み付けデータ登録エラー: #{e.message}"
      Rails.logger.error "BGG重み付けデータ登録エラー (Game ID: #{game.id}): #{e.message}"
    end
  end

  # BGGカテゴリーをサイトカテゴリーに変換
  def convert_bgg_category_to_site(bgg_category)
    mapping = {
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
    mapping[bgg_category]
  end

  # BGGカテゴリーをサイトメカニクスに変換
  def convert_bgg_category_to_site_mechanic(bgg_category)
    mapping = {
      'Dice' => 'ダイスロール'
    }
    mapping[bgg_category]
  end

  # BGGメカニクスをサイトカテゴリーに変換
  def convert_bgg_mechanic_to_site_category(bgg_mechanic)
    mapping = {
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
    mapping[bgg_mechanic]
  end

  # BGGメカニクスをサイトメカニクスに変換
  def convert_bgg_mechanic_to_site(bgg_mechanic)
    mapping = {
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
    mapping[bgg_mechanic]
  end

  # BGGベストプレイ人数をサイトカテゴリーに変換
  def convert_best_players_to_category(num_players)
    mapping = {
      '1' => 'ソロ向き',
      '2' => 'ペア向き',
      '6' => '多人数向き',
      '7' => '多人数向き',
      '8' => '多人数向き',
      '9' => '多人数向き',
      '10' => '多人数向き'
    }
    mapping[num_players.to_s]
  end
end 