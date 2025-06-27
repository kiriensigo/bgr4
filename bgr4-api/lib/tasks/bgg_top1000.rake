namespace :bgg do
  desc "BGG Top1000ランキングゲームを登録する"
  task register_top_1000: :environment do
    puts "🎲 BGG Top1000ゲーム登録を開始します..."
    puts "⚠️  APIレート制限対策でディレイを設けています"
    
    start_time = Time.current
    total_games = 0
    successful_games = 0
    failed_games = 0
    skipped_games = 0

    begin
      # BGGブラウズページから1000位までのゲームIDを収集
      all_game_ids = []
      pages_to_fetch = 10 # 1ページあたり約100件なので10ページで1000件カバー

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
      puts "❌ BGG Top1000登録でエラーが発生: #{e.message}"
      Rails.logger.error "BGG Top1000登録エラー: #{e.message}\n#{e.backtrace.join("\n")}"
    end

    # 処理結果サマリー
    end_time = Time.current
    elapsed_time = (end_time - start_time).round(2)

    puts "\n🏁 BGG Top1000ゲーム登録完了！"
    puts "📊 処理結果:"
    puts "   📝 総処理数: #{total_games}件"
    puts "   ✅ 成功: #{successful_games}件"
    puts "   ⏭️  スキップ: #{skipped_games}件"
    puts "   ❌ 失敗: #{failed_games}件"
    puts "   ⏱️  処理時間: #{elapsed_time}秒"
    puts "🎮 登録されたゲームはBGG重み付けデータ×10で評価計算されます"
  end

  # BGGデータから重み付けデータを登録する
  def register_bgg_weighted_data(game, game_data)
    begin
      puts "      🔄 BGG重み付けデータ登録中: #{game.name}"
      
      # カテゴリーの重み付け登録（BGG情報×10）
      if game_data[:categories].present?
        game_data[:categories].each do |bgg_category|
          # BGGカテゴリーをサイト形式に変換
          site_category = convert_bgg_category_to_site(bgg_category)
          next unless site_category
          
          # 重み付け×10で登録
          10.times do
            game.categories << site_category unless game.categories.include?(site_category)
          end
        end
      end

      # メカニクスの重み付け登録（BGG情報×10）
      if game_data[:mechanics].present?
        game_data[:mechanics].each do |bgg_mechanic|
          # BGGメカニクスをサイト形式に変換
          site_mechanic = convert_bgg_mechanic_to_site(bgg_mechanic)
          next unless site_mechanic
          
          # 重み付け×10で登録
          10.times do
            game.mechanics << site_mechanic unless game.mechanics.include?(site_mechanic)
          end
        end
      end

      # おすすめ人数の重み付け登録（BGG Best/Recommended×10）
      if game_data[:best_num_players].present?
        game_data[:best_num_players].each do |num_players|
          # 重み付け×10で登録
          10.times do
            game.recommended_players << num_players.to_s unless game.recommended_players.include?(num_players.to_s)
          end
        end
      end

      puts "      ✅ BGG重み付けデータ登録完了"

    rescue => e
      puts "      ❌ BGG重み付けデータ登録エラー: #{e.message}"
      Rails.logger.error "BGG重み付けデータ登録エラー (Game ID: #{game.id}): #{e.message}"
    end
  end

  # BGGカテゴリーをサイト形式に変換
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

  # BGGメカニクスをサイト形式に変換
  def convert_bgg_mechanic_to_site(bgg_mechanic)
    mapping = {
      'Area Majority / Influence' => 'エリア支配',
      'Auction / Bidding' => 'オークション',
      'Cooperative Game' => '協力',
      'Deck, Bag, and Pool Building' => 'デッキ/バッグビルド',
      'Dice Rolling' => 'ダイスロール',
      'Hidden Roles' => '正体隠匿',
      'Worker Placement' => 'ワカプレ',
      'Set Collection' => 'セット収集',
      'Tile Placement' => 'タイル配置',
      'Variable Player Powers' => 'プレイヤー別能力',
      'Push Your Luck' => 'バースト',
      'Network and Route Building' => 'ルート構築',
      'Modular Board' => 'モジュラーボード',
      'Simultaneous Action Selection' => '同時手番',
      'Open Drafting' => 'ドラフト',
      'Closed Drafting' => 'ドラフト'
    }
    
    mapping[bgg_mechanic]
  end
end 