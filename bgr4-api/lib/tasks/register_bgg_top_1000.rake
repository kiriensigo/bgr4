namespace :bgg do
  desc "BGG上位1000位のゲームを登録・更新する（自動翻訳、カテゴリー変換、システムレビューを含む）"
  task register_top_1000: :environment do
    Rails.logger.info "BGG上位1000位のゲーム登録を開始します"
    puts "BGG上位1000位のゲーム登録を開始します"
    
    start_time = Time.current
    total_registered = 0
    total_skipped = 0
    total_errors = 0
    
    # システムユーザーを取得または作成
    system_user = User.find_or_create_by(email: 'system@boardgamereview.com') do |user|
      user.name = 'BoardGameGeek'
      user.password = SecureRandom.hex(16)
      user.password_confirmation = user.password
      user.provider = 'system'
      user.uid = 'system'
    end
    
    # BGGから上位1000位のゲームIDを取得
    top_1000_ids = get_bgg_top_1000_game_ids
    
    if top_1000_ids.empty?
      puts "BGGから上位1000位のゲームIDを取得できませんでした"
      return
    end
    
    puts "取得したゲーム数: #{top_1000_ids.count}件"
    
    # バッチサイズ（BGG APIの制限を考慮）
    batch_size = 5
    
    # 新規登録が必要なゲームと既存のゲームに分ける
    new_game_ids = []
    existing_games = []
    
    top_1000_ids.each do |bgg_id|
      existing_game = Game.find_by(bgg_id: bgg_id)
      if existing_game
        existing_games << existing_game
      else
        new_game_ids << bgg_id
      end
    end
    
    puts "新規登録対象: #{new_game_ids.count}件"
    puts "既存ゲーム更新対象: #{existing_games.count}件"
    
    # 新規ゲームをバッチで処理
    if new_game_ids.any?
      puts "\n=== 新規ゲームのバッチ登録を開始 ===\n"
      
      new_game_ids.each_slice(batch_size).with_index do |batch_ids, batch_index|
        puts "\n--- 新規ゲームバッチ #{batch_index + 1}/#{(new_game_ids.count.to_f / batch_size).ceil} ---"
        puts "処理対象BGG ID: #{batch_ids.join(', ')}"
        
        begin
          # バッチでゲーム情報を取得
          games_data = BggService.get_games_details_batch(batch_ids)
          
          games_data.each do |game_data|
            begin
              game = create_game_from_data(game_data, system_user)
              if game
                total_registered += 1
                puts "  ✓ 新規登録: #{game.name} (BGG ID: #{game.bgg_id})"
              else
                total_errors += 1
                puts "  ✗ 登録失敗: BGG ID #{game_data[:bgg_id]}"
              end
            rescue => e
              total_errors += 1
              puts "  ✗ エラー (BGG ID: #{game_data[:bgg_id]}): #{e.message}"
              Rails.logger.error "ゲーム作成エラー: #{e.message}\n#{e.backtrace.join("\n")}"
            end
          end
          
          # バッチで取得できなかったIDがある場合
          failed_ids = batch_ids - games_data.map { |g| g[:bgg_id] }
          failed_ids.each do |failed_id|
            total_errors += 1
            puts "  ✗ データ取得失敗: BGG ID #{failed_id}"
          end
          
        rescue => e
          puts "  ✗ バッチ処理エラー: #{e.message}"
          Rails.logger.error "バッチ処理エラー: #{e.message}\n#{e.backtrace.join("\n")}"
          
          # バッチ処理に失敗した場合は個別処理にフォールバック
          batch_ids.each do |bgg_id|
            begin
              game = register_new_game(bgg_id, system_user)
              if game
                total_registered += 1
                puts "  ✓ 個別登録: #{game.name} (BGG ID: #{bgg_id})"
              else
                total_errors += 1
                puts "  ✗ 個別登録失敗: BGG ID #{bgg_id}"
              end
            rescue => e
              total_errors += 1
              puts "  ✗ 個別処理エラー (BGG ID: #{bgg_id}): #{e.message}"
            end
            
            # 個別処理間の待機
            sleep 3
          end
        end
        
        # バッチ間の待機
        if batch_index < (new_game_ids.count.to_f / batch_size).ceil - 1
          puts "\nAPIの負荷軽減のために30秒待機します..."
          sleep 30
        end
      end
    end
    
    # 既存ゲームの更新処理
    if existing_games.any?
      puts "\n=== 既存ゲームの更新を開始 ===\n"
      
      existing_games.each_with_index do |existing_game, index|
        begin
          puts "[#{index + 1}/#{existing_games.count}] 既存ゲーム更新: #{existing_game.name} (BGG ID: #{existing_game.bgg_id})"
          
          if update_existing_game(existing_game, system_user)
            total_registered += 1
            puts "  ✓ 更新完了"
          else
            total_skipped += 1
            puts "  - 更新スキップ"
          end
          
        rescue => e
          total_errors += 1
          puts "  ✗ 更新エラー: #{e.message}"
          Rails.logger.error "既存ゲーム更新エラー (BGG ID: #{existing_game.bgg_id}): #{e.message}\n#{e.backtrace.join("\n")}"
        end
        
        # 20件ごとに少し待機
        if (index + 1) % 20 == 0
          puts "  20件処理完了、10秒待機..."
          sleep 10
        end
      end
    end
    
    # 結果の表示
    end_time = Time.current
    elapsed_time = (end_time - start_time).round(2)
    
    puts "\n" + "="*60
    puts "BGG上位1000位のゲーム登録が完了しました"
    puts "処理時間: #{elapsed_time}秒"
    puts "登録・更新済み: #{total_registered}件"
    puts "スキップ: #{total_skipped}件"
    puts "エラー: #{total_errors}件"
    puts "="*60
    
    Rails.logger.info "BGG上位1000位のゲーム登録完了: 登録・更新#{total_registered}件, スキップ#{total_skipped}件, エラー#{total_errors}件"
  end
  
  private
  
  # BGG上位1000位のゲームIDを取得
  def get_bgg_top_1000_game_ids
    puts "BGGから上位1000位のゲームIDを取得中..."
    
    game_ids = []
    
    # BGGランキングページから上位1000位のゲームIDを取得
    # ページネーションで100件ずつ取得（1-100, 101-200, ..., 901-1000）
    (1..10).each do |page|
      start_item = (page - 1) * 100 + 1
      end_item = page * 100
      
      puts "  ランキング #{start_item}-#{end_item}位を取得中..."
      
      # BggServiceの新しいメソッドを使用
      page_game_ids = BggService.get_top_games_from_browse(page)
      
      if page_game_ids.any?
        game_ids.concat(page_game_ids)
        game_ids = game_ids.uniq.first(1000)
        puts "    現在取得済み: #{game_ids.count}件"
      else
        puts "    ページ#{page}からゲームIDを取得できませんでした"
      end
      
      # ページ間の待機
      sleep 5
      
      # 1000件に達したら終了
      break if game_ids.count >= 1000
    end
    
    # BGG APIのhot gamesからも上位ゲームを取得（バックアップ）
    if game_ids.count < 1000
      puts "  不足分をBGG Hot Gamesから補完中..."
      
      begin
        hot_games_xml = BggService.get_hot_games
        doc = Nokogiri::XML(hot_games_xml)
        
        doc.xpath('//item').each do |item|
          game_id = item['id']
          game_ids << game_id unless game_ids.include?(game_id)
        end
        
        game_ids = game_ids.uniq.first(1000)
        puts "    Hot Gamesから追加後: #{game_ids.count}件"
        
      rescue => e
        puts "    Hot Games取得中にエラー: #{e.message}"
      end
    end
    
    puts "最終的に取得したゲーム数: #{game_ids.count}件"
    game_ids.first(1000)  # 確実に1000件以下にする
  end
  
  # バッチで取得したデータからゲームを作成
  def create_game_from_data(game_data, system_user)
    # ゲームを作成
    game = Game.new(
      bgg_id: game_data[:bgg_id],
      name: game_data[:name],
      description: game_data[:description],
      image_url: game_data[:image_url],
      min_players: game_data[:min_players],
      max_players: game_data[:max_players],
      play_time: game_data[:play_time],
      min_play_time: game_data[:min_play_time],
      average_score: game_data[:average_score],
      weight: game_data[:weight],
      publisher: game_data[:publisher],
      designer: game_data[:designer],
      release_date: game_data[:release_date],
      japanese_name: game_data[:japanese_name],
      japanese_publisher: game_data[:japanese_publisher],
      japanese_release_date: game_data[:japanese_release_date],
      japanese_image_url: game_data[:japanese_image_url],
      registered_on_site: true
    )
    
    # メタデータを設定
    if game_data[:expansions].present?
      game.store_metadata(:expansions, game_data[:expansions])
    end
    
    if game_data[:best_num_players].present?
      game.store_metadata(:best_num_players, game_data[:best_num_players])
    end
    
    if game_data[:recommended_num_players].present?
      game.store_metadata(:recommended_num_players, game_data[:recommended_num_players])
    end
    
    if game_data[:categories].present?
      game.store_metadata(:categories, game_data[:categories])
    end
    
    if game_data[:mechanics].present?
      game.store_metadata(:mechanics, game_data[:mechanics])
    end
    
    if game.save
      # カテゴリーとメカニクスを当サイト形式に変換
      convert_and_store_categories_mechanics(game)
      
      # 日本語翻訳を実行
      translate_game_content(game)
      
      # システムレビューを作成
      create_system_reviews(game, system_user, game_data)
      
      game
    else
      Rails.logger.error "ゲーム作成エラー (BGG ID: #{game_data[:bgg_id]}): #{game.errors.full_messages.join(', ')}"
      nil
    end
  end

  # 新規ゲームを登録
  def register_new_game(bgg_id, system_user)
    # BGGからゲーム情報を取得
    bgg_game_info = BggService.get_game_details(bgg_id)
    
    # API呼び出し後の待機
    sleep 2
    
    return nil unless bgg_game_info.present?
    
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
      average_score: bgg_game_info[:average_score],
      weight: bgg_game_info[:weight],
      publisher: bgg_game_info[:publisher],
      designer: bgg_game_info[:designer],
      release_date: bgg_game_info[:release_date],
      japanese_name: bgg_game_info[:japanese_name],
      japanese_publisher: bgg_game_info[:japanese_publisher],
      japanese_release_date: bgg_game_info[:japanese_release_date],
      japanese_image_url: bgg_game_info[:japanese_image_url],
      registered_on_site: true
    )
    
    # メタデータを設定
    if bgg_game_info[:expansions].present?
      game.store_metadata(:expansions, bgg_game_info[:expansions])
    end
    
    if bgg_game_info[:best_num_players].present?
      game.store_metadata(:best_num_players, bgg_game_info[:best_num_players])
    end
    
    if bgg_game_info[:recommended_num_players].present?
      game.store_metadata(:recommended_num_players, bgg_game_info[:recommended_num_players])
    end
    
    if bgg_game_info[:categories].present?
      game.store_metadata(:categories, bgg_game_info[:categories])
    end
    
    if bgg_game_info[:mechanics].present?
      game.store_metadata(:mechanics, bgg_game_info[:mechanics])
    end
    
    if game.save
      # カテゴリーとメカニクスを当サイト形式に変換
      convert_and_store_categories_mechanics(game)
      
      # 日本語翻訳を実行
      translate_game_content(game)
      
      # システムレビューを作成
      create_system_reviews(game, system_user, bgg_game_info)
      
      game
    else
      Rails.logger.error "ゲーム作成エラー (BGG ID: #{bgg_id}): #{game.errors.full_messages.join(', ')}"
      nil
    end
  end
  
  # 既存ゲームを更新
  def update_existing_game(game, system_user)
    # 登録済みフラグを更新
    game.update(registered_on_site: true)
    
    # BGGから最新情報を取得して更新
    if game.update_from_bgg(false)  # 強制更新はしない
      # カテゴリーとメカニクスを当サイト形式に変換
      convert_and_store_categories_mechanics(game)
      
      # 日本語翻訳を実行（既存の翻訳がない場合のみ）
      translate_game_content(game) if needs_translation?(game)
      
      # システムレビューを確認・補完
      ensure_system_reviews(game, system_user)
      
      true
    else
      false
    end
  end
  
  # カテゴリーとメカニクスを当サイト形式に変換
  def convert_and_store_categories_mechanics(game)
    return unless game.categories.present? || game.mechanics.present?
    
    site_categories = []
    site_mechanics = []
    
    # 変換マップを定義
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
    
    bgg_category_to_site_mechanic = {
      'Dice' => 'ダイスロール'
    }
    
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
    
    # BGGカテゴリーから当サイトのカテゴリー・メカニクスに変換
    if game.categories.present?
      game.categories.each do |bgg_category|
        if category = bgg_category_to_site_category[bgg_category]
          site_categories << category
        elsif mechanic = bgg_category_to_site_mechanic[bgg_category]
          site_mechanics << mechanic
        end
      end
    end
    
    # BGGメカニクスから当サイトのカテゴリー・メカニクスに変換
    if game.mechanics.present?
      game.mechanics.each do |bgg_mechanic|
        if category = bgg_mechanic_to_site_category[bgg_mechanic]
          site_categories << category
        elsif mechanic = bgg_mechanic_to_site_mechanic[bgg_mechanic]
          site_mechanics << mechanic
        end
      end
    end
    
    # BGGのベストプレイ人数から当サイトのカテゴリーを生成
    if game.best_num_players.present?
      game.best_num_players.each do |num|
        case num.to_s
        when '1'
          site_categories << 'ソロ向き'
        when '2'
          site_categories << 'ペア向き'
        when '6', '7', '8', '9', '10'
          site_categories << '多人数向き'
        end
      end
    end
    
    # 重複を削除して保存
    game.popular_categories = site_categories.uniq
    game.popular_mechanics = site_mechanics.uniq
    game.save
    
    puts "    カテゴリー変換: #{site_categories.uniq.join(', ')}"
    puts "    メカニクス変換: #{site_mechanics.uniq.join(', ')}"
  end
  
  # 日本語翻訳が必要かチェック
  def needs_translation?(game)
    game.japanese_name.blank? || game.japanese_description.blank?
  end
  
  # ゲームコンテンツの日本語翻訳
  def translate_game_content(game)
    updated = false
    
    # 日本語名の翻訳
    if game.japanese_name.blank? && game.name.present?
      begin
        if defined?(DeeplTranslationService)
          translated_name = DeeplTranslationService.translate_to_japanese(game.name)
          if translated_name.present?
            game.japanese_name = translated_name
            updated = true
            puts "    日本語名翻訳: #{game.name} → #{translated_name}"
          end
        else
          puts "    翻訳サービスが利用できません"
        end
      rescue => e
        puts "    日本語名翻訳失敗: #{e.message}"
      end
    end
    
    # 日本語説明の翻訳
    if game.japanese_description.blank? && game.description.present?
      begin
        if defined?(DeeplTranslationService)
          # 説明文が長すぎる場合は最初の500文字のみ翻訳
          description_to_translate = game.description.length > 500 ? 
                                   "#{game.description[0, 500]}..." : 
                                   game.description
          
          translated_description = DeeplTranslationService.translate_to_japanese(description_to_translate)
          if translated_description.present?
            game.japanese_description = translated_description
            updated = true
            puts "    日本語説明翻訳完了（#{translated_description.length}文字）"
          end
        else
          puts "    翻訳サービスが利用できません"
        end
      rescue => e
        puts "    日本語説明翻訳失敗: #{e.message}"
      end
    end
    
    # 翻訳結果を保存
    game.save if updated
    
    # 翻訳API の負荷軽減のため少し待機
    sleep 1 if updated
  end
  
  # システムレビューの作成
  def create_system_reviews(game, system_user, bgg_game_info)
    # 既存のシステムレビューをカウント
    existing_count = game.reviews.where(user: system_user).count
    reviews_to_create = 10 - existing_count
    
    return if reviews_to_create <= 0
    
    puts "    システムレビューを#{reviews_to_create}件作成中..."
    
    # BGGの評価を当サイトの評価に変換
    bgg_rating = bgg_game_info[:average_score].to_f
    return if bgg_rating <= 0
    
    # 基準となる評価値を計算
    base_overall_score = [5.0, [bgg_rating, 10.0].min].max
    base_rule_complexity = [1.0, [bgg_game_info[:weight].to_f, 5.0].min].max
    
    reviews_to_create.times do |i|
      # 評価にバラつきを持たせる（±0.5の範囲）
      variance = (rand - 0.5) # -0.5 to 0.5
      
      overall_score = [5.0, [base_overall_score + variance, 10.0].min].max
      rule_complexity = [1.0, [base_rule_complexity + (variance * 0.5), 5.0].min].max
      
      # その他の評価項目もバラつきを持たせる
      luck_factor = [1.0, [3.0 + variance, 5.0].min].max
      interaction = [1.0, [3.0 + variance, 5.0].min].max
      downtime = [1.0, [3.0 + variance, 5.0].min].max
      
      # おすすめプレイ人数を設定
      recommended_players = []
      if bgg_game_info[:best_num_players].present?
        recommended_players.concat(bgg_game_info[:best_num_players])
      end
      if bgg_game_info[:recommended_num_players].present?
        recommended_players.concat(bgg_game_info[:recommended_num_players])
      end
      recommended_players = recommended_players.uniq
      
      # 最低でも1つはプレイ人数を設定
      if recommended_players.empty?
        if game.min_players && game.max_players
          if game.min_players == game.max_players
            recommended_players = [game.min_players.to_s]
          else
            recommended_players = [game.min_players.to_s, game.max_players.to_s]
          end
        end
      end
      
      # メカニクスの選択（当サイト形式）
      selected_mechanics = game.popular_mechanics.present? ? 
                          game.popular_mechanics.sample(rand(1..3)) : []
      
      # レビューを作成
      review = Review.new(
        user: system_user,
        game_id: game.bgg_id,
        overall_score: overall_score.round(1),
        rule_complexity: rule_complexity.round(1),
        luck_factor: luck_factor.round(1),
        interaction: interaction.round(1),
        downtime: downtime.round(1),
        recommended_players: recommended_players,
        mechanics: selected_mechanics,
        one_word_review: '初期評価',
        comment: "BoardGameGeekのデータに基づく自動評価です。"
      )
      
      unless review.save
        puts "    システムレビュー#{i+1}の作成失敗: #{review.errors.full_messages.join(', ')}"
      end
    end
    
    puts "    システムレビュー作成完了"
  end
  
  # 既存ゲームのシステムレビュー確認・補完
  def ensure_system_reviews(game, system_user)
    existing_count = game.reviews.where(user: system_user).count
    
    if existing_count < 10
      puts "    システムレビューが不足しています（#{existing_count}/10件）"
      
      # BGGから最新情報を取得してシステムレビューを補完
      bgg_game_info = BggService.get_game_details(game.bgg_id)
      if bgg_game_info.present?
        create_system_reviews(game, system_user, bgg_game_info)
      end
    end
  end
end 