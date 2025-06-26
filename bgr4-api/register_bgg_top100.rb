#!/usr/bin/env ruby

require_relative 'config/environment'
require 'nokogiri'
require 'httparty'

class BggTop100Registrar
  DELAY_BETWEEN_GAMES = 10 # ゲーム間10秒間隔
  
  def initialize
    @registered_count = 0
    @skipped_count = 0
    @error_count = 0
    @updated_count = 0
    @start_time = Time.current
  end
  
  def register_top_100
    puts "🚀 BGGランキング上位100位登録開始"
    puts "=" * 60
    puts "⏰ 開始時刻: #{@start_time.strftime('%Y-%m-%d %H:%M:%S')}"
    puts "🎯 目標: BGGランキング1位～100位の登録・更新"
    puts "⚙️  設定: #{DELAY_BETWEEN_GAMES}秒間隔"
    puts "=" * 60
    
    # BGGランキングページから取得
    games = fetch_top_100_games
    
    if games.empty?
      puts "❌ BGGランキングページからゲーム情報を取得できませんでした"
      return
    end
    
    puts "📊 取得成功: #{games.size}件のゲーム"
    puts "=" * 60
    
    # 各ゲームを処理
    games.each_with_index do |game, index|
      process_game(game, index + 1, games.size)
      
      # 最後のゲーム以外は待機
      if index < games.size - 1
        puts "  ⏱️  #{DELAY_BETWEEN_GAMES}秒待機中..."
        sleep(DELAY_BETWEEN_GAMES)
      end
    end
    
    final_report
  end
  
  private
  
  def fetch_top_100_games
    url = "https://boardgamegeek.com/browse/boardgame/page/1?sort=rank"
    puts "🌐 BGGランキングページ取得中: #{url}"
    
    response = HTTParty.get(url, {
      headers: {
        'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 30
    })
    
    return [] unless response.code == 200
    
    doc = Nokogiri::HTML(response.body)
    games = []
    
    doc.css('tr').each do |row|
      cells = row.css('td')
      next if cells.empty?
      
      # ランク列確認
      rank_cell = cells.first
      rank_text = rank_cell.text.strip
      next unless rank_text.match?(/^\d+$/)
      
      rank = rank_text.to_i
      next if rank > 100 # トップ100のみ
      
      # タイトル列からBGG IDと名前を取得
      if cells.size >= 3
        title_cell = cells[2]
        link = title_cell.css('a').first
        
        if link
          href = link['href']
          title = link.text.strip
          
          if href && href.match(%r{/boardgame/(\d+)/})
            bgg_id = $1
            clean_title = title.gsub(/\s*\(\d{4}\)\s*$/, '')
            
            games << {
              rank: rank,
              bgg_id: bgg_id,
              name: clean_title
            }
          end
        end
      end
    end
    
    games.sort_by { |g| g[:rank] }
  end
  
  def process_game(game_info, current_index, total_count)
    rank = game_info[:rank]
    bgg_id = game_info[:bgg_id]
    name = game_info[:name]
    
    puts "\n[#{current_index}/#{total_count}] ランク#{rank}位: #{name} (BGG ID: #{bgg_id})"
    
    begin
      # 既存ゲームをチェック
      existing_game = Game.find_by(bgg_id: bgg_id)
      
      if existing_game
        if needs_update?(existing_game)
          puts "  🔍 既存ゲーム発見 - データ更新中..."
          update_game_data(existing_game)
          @updated_count += 1
          puts "  ✅ データ更新完了"
        else
          @skipped_count += 1
          puts "  ⏭️  既存ゲーム - データ完全なのでスキップ"
        end
        return
      end
      
      # ランキング制限チェック（念のため）
      unless BggService.game_meets_rank_requirement?(bgg_id, 10000)
        @error_count += 1
        puts "  🚫 ランキング制限でブロック"
        return
      end
      
      # 新規ゲーム登録
      puts "  🎮 新規ゲーム登録中..."
      register_new_game(bgg_id, name)
      
    rescue => e
      @error_count += 1
      puts "  ❌ エラー: #{e.message}"
      Rails.logger.error "Error processing game #{bgg_id}: #{e.message}"
    end
  end
  
  def needs_update?(game)
    # 重要なデータがnullの場合は更新が必要
    game.japanese_name.nil? || 
    game.designer.nil? || 
    game.publisher.nil? ||
    game.weight.nil? ||
    game.play_time.nil? ||
    game.description.blank?
  end
  
  def update_game_data(game)
    # BGG APIからフルデータを取得
    game_data = BggService.get_game_details(game.bgg_id)
    
    return unless game_data
    
    # データベース更新
    update_attributes = {}
    update_attributes[:japanese_name] = game_data[:japanese_name] if game.japanese_name.nil? && game_data[:japanese_name]
    update_attributes[:designer] = game_data[:designer] if game.designer.nil? && game_data[:designer]
    update_attributes[:publisher] = game_data[:publisher] if game.publisher.nil? && game_data[:publisher]
    update_attributes[:weight] = game_data[:weight] if game.weight.nil? && game_data[:weight]
    update_attributes[:play_time] = game_data[:play_time] if game.play_time.nil? && game_data[:play_time]
    update_attributes[:min_play_time] = game_data[:min_play_time] if game.min_play_time.nil? && game_data[:min_play_time]
    update_attributes[:description] = game_data[:description] if game.description.blank? && game_data[:description]
    update_attributes[:image_url] = game_data[:image_url] if game.image_url.blank? && game_data[:image_url]
    update_attributes[:metadata] = game_data.to_json if game_data
    
    game.update!(update_attributes) if update_attributes.any?
    
    # プレイ人数推奨も更新
    if game_data[:best_num_players] || game_data[:recommended_num_players]
      game.update_site_recommended_players
    end
  end
  
  def register_new_game(bgg_id, name)
    # BGG APIからゲーム詳細を取得
    game_data = BggService.get_game_details(bgg_id)
    
    unless game_data
      puts "    ❌ BGG APIからデータ取得失敗"
      @error_count += 1
      return
    end
    
    # ゲーム作成
    game = Game.create!(
      bgg_id: game_data[:bgg_id],
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
      registered_on_site: true
    )
    
    # プレイ人数推奨の設定
    game.update_site_recommended_players
    
    @registered_count += 1
    puts "  ✅ 新規登録完了 (Game ID: #{game.id})"
    puts "    📝 日本語名: #{game_data[:japanese_name] || 'なし'}"
    puts "    🎨 デザイナー: #{game_data[:designer]}"
    puts "    🏢 パブリッシャー: #{game_data[:publisher]}"
  end
  
  def final_report
    elapsed = Time.current - @start_time
    total_processed = @registered_count + @skipped_count + @updated_count + @error_count
    current_total = Game.where(registered_on_site: true).count
    
    puts "\n" + "🎉" * 20
    puts "🏁 BGGランキング上位100位登録完了！"
    puts "🎉" * 20
    puts "⏰ 総実行時間: #{(elapsed / 60).round(1)}分"
    puts "📊 処理結果:"
    puts "  ✅ 新規登録: #{@registered_count}件"
    puts "  🔄 データ更新: #{@updated_count}件"
    puts "  ⏭️  スキップ: #{@skipped_count}件"
    puts "  ❌ エラー: #{@error_count}件"
    puts "  📋 総処理: #{total_processed}件"
    
    puts "\n🎮 現在の登録ゲーム総数: #{current_total}件"
    puts "📈 今回追加: #{@registered_count}件"
    puts "🔧 今回更新: #{@updated_count}件"
    
    success_rate = ((total_processed - @error_count).to_f / total_processed * 100).round(1)
    puts "📊 成功率: #{success_rate}%"
    
    puts "\n🎯 BGGランキング上位100位のゲームが揃いました！"
    puts "   次は上位500位まで拡張しますか？"
  end
end

# 実行
registrar = BggTop100Registrar.new
registrar.register_top_100 