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

  desc "BGGの上位3000ゲームを登録"
  task register_top_3000: :environment do
    Rails.logger.info "BGGの上位3000ゲームの登録を開始..."
    
    # 1001位から3000位までのゲームを取得
    start_page = 11  # 1001位から
    end_page = 30    # 3000位まで
    
    all_games = []
    (start_page..end_page).each do |page|
      Rails.logger.info "ページ#{page}のゲームを取得中..."
      games = BggService.get_top_games_from_browse(page)
      all_games.concat(games)
      
      # APIレート制限対策
      sleep 2
    end
    
    Rails.logger.info "合計#{all_games.size}件のゲームIDを収集しました"
    
    # 既存のゲームIDを取得
    existing_ids = Game.where.not(bgg_id: nil).pluck(:bgg_id).map(&:to_s)
    new_games = all_games.reject { |g| existing_ids.include?(g[:bgg_id].to_s) }
    
    Rails.logger.info "新規登録が必要なゲーム: #{new_games.size}件"
    
    # 新規ゲームを10件ずつ登録
    new_games.each_slice(10) do |batch|
      batch_ids = batch.map { |g| g[:bgg_id] }
      Rails.logger.info "ゲーム詳細を取得中: #{batch_ids.join(', ')}"
      
      game_details = BggService.get_game_details(batch_ids)
      
      # ゲームを登録
      game_details.each do |game_data|
        begin
          game = Game.find_or_initialize_by(bgg_id: game_data[:bgg_id])
          game.assign_attributes(
            name: game_data[:name],
            description: game_data[:description],
            year_published: game_data[:year_published],
            min_players: game_data[:min_players],
            max_players: game_data[:max_players],
            play_time: game_data[:play_time],
            min_age: game_data[:min_age],
            image_url: game_data[:image_url],
            average_score: game_data[:average_score],
            weight: game_data[:weight],
            bgg_rank: game_data[:bgg_rank]
          )
          
          if game.save
            Rails.logger.info "ゲームを登録しました: #{game.name} (BGG ID: #{game.bgg_id}, ランク: #{game.bgg_rank})"
            
            # デザイナー、アーティスト、パブリッシャーを登録
            game_data[:designers]&.each do |name|
              designer = Designer.find_or_create_by!(name: name)
              game.designers << designer unless game.designers.include?(designer)
            end
            
            game_data[:artists]&.each do |name|
              artist = Artist.find_or_create_by!(name: name)
              game.artists << artist unless game.artists.include?(artist)
            end
            
            game_data[:publishers]&.each do |name|
              publisher = Publisher.find_or_create_by!(name: name)
              game.publishers << publisher unless game.publishers.include?(publisher)
            end
          else
            Rails.logger.error "ゲームの登録に失敗: #{game.errors.full_messages.join(', ')}"
          end
        rescue => e
          Rails.logger.error "ゲーム登録中にエラーが発生: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
        end
      end
      
      # APIレート制限対策
      sleep 2
    end
    
    Rails.logger.info "BGGの上位3000ゲームの登録が完了しました"
  end

  desc "BGGのランク1001-3000位のゲームを取得して登録する"
  task import_rank_1001_to_3000: :environment do
    puts "Starting to import BGG games ranked 1001-3000..."
    
    # 既に登録済みのゲーム数を確認
    registered_count = Game.registered.count
    puts "Currently registered games: #{registered_count}"
    
    # 最後に登録されたゲームのランクを取得
    last_registered_game = Game.registered.order(bgg_rank: :desc).first
    if last_registered_game&.bgg_rank
      puts "Last registered game: #{last_registered_game.name} (Rank: #{last_registered_game.bgg_rank})"
    end
    
    # 1001-3000位のゲームを取得
    games = Bgg::RankFetcherService.fetch_games_by_rank_range(1001, 3000)
    puts "Found #{games.size} games in rank range 1001-3000"
    
    # 各ゲームを処理
    games.each do |game_data|
      begin
        # 既存のゲームをチェック
        existing_game = Game.find_by(bgg_id: game_data[:bgg_id])
        
        if existing_game
          puts "Updating existing game: #{game_data[:name]} (Rank: #{game_data[:rank]})"
          
          # ランク情報を更新
          existing_game.update(bgg_rank: game_data[:rank])
          
          # 必要に応じて他の情報も更新
          if existing_game.needs_update?
            existing_game.update_from_bgg(true)
          end
        else
          puts "Creating new game: #{game_data[:name]} (Rank: #{game_data[:rank]})"
          
          # 新しいゲームを作成
          game = Game.new(
            bgg_id: game_data[:bgg_id],
            name: game_data[:name],
            description: game_data[:description],
            image_url: game_data[:image_url],
            min_players: game_data[:min_players],
            max_players: game_data[:max_players],
            play_time: game_data[:play_time],
            min_play_time: game_data[:min_play_time],
            max_play_time: game_data[:max_play_time],
            weight: game_data[:weight],
            bgg_score: game_data[:average_score],
            publisher: game_data[:publisher],
            designer: game_data[:designer],
            year_published: game_data[:year_published],
            bgg_rank: game_data[:rank],
            registered_on_site: true
          )
          
          if game.save
            puts "Successfully created game: #{game.name}"
            
            # カテゴリとメカニクスを保存
            game.store_metadata(:categories, game_data[:categories]) if game_data[:categories].present?
            game.store_metadata(:mechanics, game_data[:mechanics]) if game_data[:mechanics].present?
            
            # 日本語情報を取得
            game.update_from_bgg(true)
          else
            puts "Failed to create game: #{game.errors.full_messages.join(", ")}"
          end
        end
        
      rescue => e
        puts "Error processing game #{game_data[:name]}: #{e.message}"
      end
    end
    
    # 最終結果を表示
    final_count = Game.registered.count
    new_games = final_count - registered_count
    puts "\nImport completed!"
    puts "Total registered games: #{final_count} (+#{new_games} new)"
    puts "Latest registered game: #{Game.registered.order(bgg_rank: :desc).first&.name}"
    puts "Last update: #{Time.current}"
  end

  desc "既存のゲームデータをBGGから更新する"
  task update_existing_games: :environment do
    Rails.logger.info "既存のゲームデータの更新を開始..."
    
    # 登録済みのゲームを取得
    games = Game.where(registered_on_site: true)
    total_games = games.count
    
    Rails.logger.info "更新対象のゲーム数: #{total_games}件"
    
    # 10件ずつ処理
    games.find_each(batch_size: 10) do |game|
      begin
        Rails.logger.info "ゲーム更新中: #{game.name} (BGG ID: #{game.bgg_id})"
        
        # BGGから最新のゲーム情報を取得
        game_data = BggService.get_game_details(game.bgg_id)
        
        if game_data
          # ゲーム情報を更新
          game.update!(
            name: game_data[:name],
            description: game_data[:description],
            year_published: game_data[:year_published],
            min_players: game_data[:min_players],
            max_players: game_data[:max_players],
            play_time: game_data[:play_time],
            min_age: game_data[:min_age],
            image_url: game_data[:image_url],
            average_score: game_data[:average_score],
            weight: game_data[:weight],
            bgg_rank: game_data[:bgg_rank]
          )
          
          # デザイナー、アーティスト、パブリッシャーを更新
          game.designers.clear
          game_data[:designers]&.each do |name|
            designer = Designer.find_or_create_by!(name: name)
            game.designers << designer
          end
          
          game.artists.clear
          game_data[:artists]&.each do |name|
            artist = Artist.find_or_create_by!(name: name)
            game.artists << artist
          end
          
          game.publishers.clear
          game_data[:publishers]&.each do |name|
            publisher = Publisher.find_or_create_by!(name: name)
            game.publishers << publisher
          end
          
          Rails.logger.info "ゲーム情報を更新しました: #{game.name}"
        else
          Rails.logger.error "BGGからゲーム情報を取得できませんでした: #{game.bgg_id}"
        end
        
      rescue => e
        Rails.logger.error "ゲーム更新中にエラーが発生: #{e.message}"
        Rails.logger.error e.backtrace.join("\n")
      end
      
      # APIレート制限対策
      sleep 2
    end
    
    Rails.logger.info "既存のゲームデータの更新が完了しました"
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