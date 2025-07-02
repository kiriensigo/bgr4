namespace :bgg do
  desc "Register remaining games from BGG top 3000 with improved error handling"
  task register_remaining: :environment do
    class BggRemainingRegistrar
      DELAY_BETWEEN_PAGES = 10  # Reduced from 15 to 10 seconds
      DELAY_BETWEEN_GAMES = 2   # Reduced from 3 to 2 seconds
      BATCH_SIZE = 50
      MAX_RETRIES = 5
      MAX_RANK = 3000
      
      def initialize
        @registered_count = 0
        @skipped_count = 0
        @error_count = 0
        @updated_count = 0
        @start_time = Time.current
        @failed_games = []
        @existing_bgg_ids = Set.new(Game.pluck(:bgg_id))
        @processed_ranks = Set.new
      end
      
      def register_remaining
        puts "🚀 BGGランキング残りゲーム登録開始"
        puts "=" * 80
        puts "⏰ 開始時刻: #{@start_time.strftime('%Y-%m-%d %H:%M:%S')}"
        puts "📊 現在の登録数: #{@existing_bgg_ids.size}件"
        puts "🎯 目標: BGGランキング3000位までの全ゲーム登録"
        puts "=" * 80
        
        # 1-30ページを処理（1ページ100件）
        (1..30).each do |page_num|
          process_page(page_num)
          report_progress
          
          # 目標達成チェック
          if @existing_bgg_ids.size >= MAX_RANK
            puts "\n🎉 目標の#{MAX_RANK}件に到達しました！"
            break
          end
          
          # ページ間の待機（最後のページ以外）
          if page_num < 30 && @existing_bgg_ids.size < MAX_RANK
            puts "  ⏱️  次ページまで#{DELAY_BETWEEN_PAGES}秒待機..."
            sleep(DELAY_BETWEEN_PAGES)
          end
        end
        
        # 失敗したゲームの再試行
        retry_failed_games if @failed_games.any?
        
        final_report
      end
      
      private
      
      def process_page(page_num)
        rank_start = (page_num - 1) * 100 + 1
        rank_end = page_num * 100
        
        puts "\n📑 ページ#{page_num}処理中 (ランク#{rank_start}-#{rank_end}位)"
        
        retries = 0
        begin
          games = fetch_games_from_browse_page(page_num)
          
          if games.empty?
            raise "ページからゲームを取得できませんでした"
          end
          
          puts "  📊 取得成功: #{games.size}件"
          
          # ゲームを順次処理
          games.each do |game|
            process_single_game(game)
            sleep(DELAY_BETWEEN_GAMES) unless game == games.last
          end
          
        rescue => e
          retries += 1
          if retries <= MAX_RETRIES
            wait_time = 2 ** retries # 指数バックオフ
            puts "  ⚠️  ページ#{page_num}処理エラー (#{retries}/#{MAX_RETRIES}): #{e.message}"
            puts "  🕐 #{wait_time}秒後に再試行..."
            sleep(wait_time)
            retry
          else
            puts "  ❌ ページ#{page_num}処理失敗: #{e.message}"
          end
        end
      end
      
      def fetch_games_from_browse_page(page_num)
        url = "https://boardgamegeek.com/browse/boardgame/page/#{page_num}?sort=rank"
        
        response = HTTParty.get(url, {
          headers: {
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept' => 'text/html,application/xhtml+xml,application/xml',
            'Accept-Language' => 'en-US,en;q=0.5'
          },
          timeout: 30
        })
        
        raise "HTTP Error: #{response.code}" unless response.success?
        
        doc = Nokogiri::HTML(response.body)
        games = []
        
        doc.css('tr').each do |row|
          rank_cell = row.css('td').first
          next unless rank_cell
          
          rank_text = rank_cell.text.strip
          next unless rank_text.match?(/^\d+$/)
          rank = rank_text.to_i
          next if rank > MAX_RANK
          
          title_cell = row.css('td')[2]
          next unless title_cell
          
          link = title_cell.css('a').first
          next unless link
          
          href = link['href']
          next unless href
          
          if href.match(%r{/boardgame/(\d+)/})
            bgg_id = $1
            name = link.text.strip.gsub(/\s*\(\d{4}\)\s*$/, '')
            
            # 既に処理済みのランクはスキップ
            next if @processed_ranks.include?(rank)
            
            games << {
              bgg_id: bgg_id,
              name: name,
              rank: rank
            }
          end
        end
        
        games
      end
      
      def process_single_game(game_info)
        bgg_id = game_info[:bgg_id]
        name = game_info[:name]
        rank = game_info[:rank]
        
        # 既に処理済みのゲームはスキップ
        if @existing_bgg_ids.include?(bgg_id)
          @skipped_count += 1
          puts "  ⏭️  ランク#{rank}位: #{name} (BGG ID: #{bgg_id}) - スキップ（既存）"
          return
        end
        
        begin
          # BGG APIからゲーム詳細を取得
          game_data = fetch_game_details_with_retry(bgg_id)
          
          unless game_data
            @failed_games << game_info
            puts "  ❌ ランク#{rank}位: #{name} (BGG ID: #{bgg_id}) - データ取得失敗"
            return
          end
          
          # ゲーム作成
          game = Game.create!(
            bgg_id: bgg_id,
            name: game_data[:name],
            description: game_data[:description],
            image_url: game_data[:image_url],
            min_players: game_data[:min_players],
            max_players: game_data[:max_players],
            play_time: game_data[:play_time],
            min_play_time: game_data[:min_play_time],
            bgg_score: game_data[:average_score],
            weight: game_data[:weight],
            publisher: game_data[:publisher],
            designer: game_data[:designer],
            japanese_name: game_data[:japanese_name],
            japanese_publisher: game_data[:japanese_publisher],
            metadata: game_data.to_json,
            registered_on_site: true,
            average_score_value: game_data[:average_score],
            bgg_rank: rank
          )
          
          # プレイ人数推奨の設定
          game.update_site_recommended_players
          
          @registered_count += 1
          @existing_bgg_ids << bgg_id
          @processed_ranks << rank
          
          puts "  ✅ ランク#{rank}位: #{name} (BGG ID: #{bgg_id}) - 登録完了"
          
        rescue => e
          @error_count += 1
          @failed_games << game_info
          puts "  ❌ ランク#{rank}位: #{name} (BGG ID: #{bgg_id}) - エラー: #{e.message}"
        end
      end
      
      def fetch_game_details_with_retry(bgg_id)
        retries = 0
        begin
          BggService.get_game_details(bgg_id)
        rescue => e
          retries += 1
          if retries <= MAX_RETRIES
            wait_time = 2 ** retries
            sleep(wait_time)
            retry
          end
          nil
        end
      end
      
      def retry_failed_games
        return if @failed_games.empty?
        
        puts "\n🔄 失敗したゲームを再試行中..."
        puts "  対象: #{@failed_games.size}件"
        
        @failed_games.each do |game|
          puts "\n再試行: #{game[:name]} (BGG ID: #{game[:bgg_id]})"
          process_single_game(game)
          sleep(DELAY_BETWEEN_GAMES)
        end
      end
      
      def report_progress
        elapsed = Time.current - @start_time
        total_processed = @registered_count + @skipped_count + @error_count
        
        puts "\n📊 進捗状況:"
        puts "  処理済み: #{total_processed}件"
        puts "  - 新規登録: #{@registered_count}件"
        puts "  - スキップ: #{@skipped_count}件"
        puts "  - エラー: #{@error_count}件"
        puts "  経過時間: #{elapsed.to_i / 60}分#{elapsed.to_i % 60}秒"
      end
      
      def final_report
        elapsed = Time.current - @start_time
        total_processed = @registered_count + @skipped_count + @error_count
        
        puts "\n🏁 処理完了"
        puts "=" * 80
        puts "📊 最終結果:"
        puts "  総処理件数: #{total_processed}件"
        puts "  - 新規登録: #{@registered_count}件"
        puts "  - スキップ: #{@skipped_count}件"
        puts "  - エラー: #{@error_count}件"
        puts "  合計登録数: #{@existing_bgg_ids.size}件"
        puts "  処理時間: #{elapsed.to_i / 60}分#{elapsed.to_i % 60}秒"
        puts "=" * 80
      end
    end
    
    # スクリプト実行
    registrar = BggRemainingRegistrar.new
    registrar.register_remaining
  end
end 