#!/usr/bin/env ruby

require_relative 'config/environment'
require 'nokogiri'
require 'httparty'

class BggTop3000Registrar
  DELAY_BETWEEN_REQUESTS = 15 # BGG API負荷軽減のため15秒間隔
  BATCH_SIZE = 50 # 50件ずつ処理してログ出力
  MAX_RETRIES = 3
  
  def initialize
    @registered_count = 0
    @skipped_count = 0
    @error_count = 0
    @updated_count = 0
    @start_time = Time.current
    @page_errors = []
  end
  
  def register_top_3000
    puts "🚀 BGGランキング上位3000位一括登録開始"
    puts "=" * 80
    puts "⏰ 開始時刻: #{@start_time.strftime('%Y-%m-%d %H:%M:%S')}"
    puts "🎯 目標: BGGランキング1位～3000位の登録"
    puts "⚙️  設定: #{DELAY_BETWEEN_REQUESTS}秒間隔、#{BATCH_SIZE}件バッチ処理"
    puts "=" * 80
    
    # 30ページ処理 (1-100, 101-200, ..., 2901-3000)
    (1..30).each do |page_num|
      process_page(page_num)
      
      # 5ページごとに進捗報告
      if page_num % 5 == 0
        report_progress(page_num)
      end
      
      # ページ間の待機（最後のページ以外）
      if page_num < 30
        puts "  ⏱️  次ページまで#{DELAY_BETWEEN_REQUESTS}秒待機..."
        sleep(DELAY_BETWEEN_REQUESTS)
      end
    end
    
    final_report
  end
  
  private
  
  def process_page(page_num)
    rank_start = (page_num - 1) * 100 + 1
    rank_end = page_num * 100
    
    puts "\n📑 ページ#{page_num}処理中 (ランク#{rank_start}-#{rank_end}位)"
    
    begin
      games = fetch_games_from_browse_page(page_num)
      
      if games.empty?
        puts "  ⚠️  ページ#{page_num}: ゲーム取得失敗"
        @page_errors << page_num
        return
      end
      
      puts "  📊 取得成功: #{games.size}件"
      
      # ゲームを順次登録
      games.each_with_index do |game, index|
        current_rank = rank_start + index
        process_single_game(game, current_rank)
        
        # ゲーム間の待機
        if index < games.size - 1
          sleep(3) # ゲーム間は3秒
        end
      end
      
    rescue => e
      puts "  ❌ ページ#{page_num}処理エラー: #{e.message}"
      @page_errors << page_num
    end
  end
  
  def fetch_games_from_browse_page(page_num)
    url = "https://boardgamegeek.com/browse/boardgame/page/#{page_num}?sort=rank"
    
    puts "  🌐 BGGページ取得中: #{url}"
    
    response = HTTParty.get(url, {
      headers: {
        'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 30
    })
    
    return [] unless response.code == 200
    
    doc = Nokogiri::HTML(response.body)
    games = []
    
    # BGGブラウズページからゲーム情報を抽出
    doc.css('tr').each do |row|
      # ランク列の確認
      rank_cell = row.css('td').first
      next unless rank_cell
      
      rank_text = rank_cell.text.strip
      next unless rank_text.match?(/^\d+$/) # 数字のみの行
      
      # タイトル列からBGG IDと名前を取得
      title_cell = row.css('td')[2] # 3番目のセル
      next unless title_cell
      
      link = title_cell.css('a').first
      next unless link
      
      href = link['href']
      next unless href
      
      # BGG IDを抽出 (/boardgame/123456/game-name)
      if href.match(%r{/boardgame/(\d+)/})
        bgg_id = $1
        name = link.text.strip
        
        # 年を除去 (例: "Game Name (2020)" -> "Game Name")
        name = name.gsub(/\s*\(\d{4}\)\s*$/, '')
        
        games << {
          bgg_id: bgg_id,
          name: name,
          rank: rank_text.to_i
        }
      end
    end
    
    games
  end
  
  def process_single_game(game_info, rank)
    bgg_id = game_info[:bgg_id]
    name = game_info[:name]
    
    begin
      # 既存ゲームをチェック
      existing_game = Game.find_by(bgg_id: bgg_id)
      
      if existing_game
        # 既存ゲームのデータ更新
        if needs_update?(existing_game)
          update_game_data(existing_game, rank)
          @updated_count += 1
          puts "  🔄 ランク#{rank}位: #{name} (BGG ID: #{bgg_id}) - データ更新"
        else
          @skipped_count += 1
          puts "  ⏭️  ランク#{rank}位: #{name} (BGG ID: #{bgg_id}) - スキップ（データ完全）"
        end
        return
      end
      
      # ランキング制限チェック
      unless BggService.game_meets_rank_requirement?(bgg_id, 10000)
        @error_count += 1
        puts "  🚫 ランク#{rank}位: #{name} (BGG ID: #{bgg_id}) - ランキング制限"
        return
      end
      
      # 新規ゲーム登録
      register_new_game(bgg_id, name, rank)
      
    rescue => e
      @error_count += 1
      puts "  ❌ ランク#{rank}位: #{name} (BGG ID: #{bgg_id}) - エラー: #{e.message}"
    end
  end
  
  def needs_update?(game)
    # 重要なデータがnullの場合は更新が必要
    game.japanese_name.nil? || 
    game.designer.nil? || 
    game.publisher.nil? ||
    game.weight.nil? ||
    game.play_time.nil?
  end
  
  def update_game_data(game, rank)
    puts "    🔍 BGG APIからデータ更新中..."
    
    # BGG APIからフルデータを取得
    game_data = BggService.get_game_details(game.bgg_id)
    
    if game_data
      # データベース更新
      game.update!(
        japanese_name: game_data[:japanese_name] || game.japanese_name,
        designer: game_data[:designer] || game.designer,
        publisher: game_data[:publisher] || game.publisher,
        weight: game_data[:weight] || game.weight,
        play_time: game_data[:play_time] || game.play_time,
        min_play_time: game_data[:min_play_time] || game.min_play_time,
        description: game_data[:description] || game.description,
        image_url: game_data[:image_url] || game.image_url
      )
      
      # プレイ人数推奨も更新
      if game_data[:best_num_players] || game_data[:recommended_num_players]
        game.update_site_recommended_players
      end
      
      puts "    ✅ データ更新完了"
    else
      puts "    ⚠️  BGG APIからデータ取得失敗"
    end
  end
  
  def register_new_game(bgg_id, name, rank)
    puts "  🎮 ランク#{rank}位: #{name} (BGG ID: #{bgg_id}) - 新規登録中..."
    
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
      registered_on_site: true,
      average_score_value: game_data[:average_score]  # BGGスコアをaverage_score_valueに設定
    )
    
    # プレイ人数推奨の設定
    game.update_site_recommended_players
    
    # 平均値を計算（BGGスコアベース）
    game.update_average_values
    
    @registered_count += 1
    puts "  ✅ 新規登録完了 (Game ID: #{game.id})"
  end
  
  def report_progress(page_num)
    elapsed = Time.current - @start_time
    total_processed = @registered_count + @skipped_count + @updated_count + @error_count
    
    puts "\n" + "=" * 60
    puts "📊 進捗報告 (ページ#{page_num}/30完了)"
    puts "⏰ 経過時間: #{(elapsed / 60).round(1)}分"
    puts "📈 処理済み: #{total_processed}件"
    puts "  ✅ 新規登録: #{@registered_count}件"
    puts "  🔄 データ更新: #{@updated_count}件"
    puts "  ⏭️  スキップ: #{@skipped_count}件"
    puts "  ❌ エラー: #{@error_count}件"
    
    if @page_errors.any?
      puts "  ⚠️  エラーページ: #{@page_errors.join(', ')}"
    end
    
    puts "=" * 60
  end
  
  def final_report
    elapsed = Time.current - @start_time
    total_processed = @registered_count + @skipped_count + @updated_count + @error_count
    current_total = Game.where(registered_on_site: true).count
    
    puts "\n" + "🎉" * 20
    puts "🏁 BGGランキング上位3000位登録完了！"
    puts "🎉" * 20
    puts "⏰ 総実行時間: #{(elapsed / 60).round(1)}分"
    puts "📊 処理結果:"
    puts "  ✅ 新規登録: #{@registered_count}件"
    puts "  🔄 データ更新: #{@updated_count}件"
    puts "  ⏭️  スキップ: #{@skipped_count}件"
    puts "  ❌ エラー: #{@error_count}件"
    puts "  📋 総処理: #{total_processed}件"
    
    if @page_errors.any?
      puts "  ⚠️  エラーページ: #{@page_errors.join(', ')}"
      puts "     -> 手動で再実行が必要かもしれません"
    end
    
    puts "\n🎮 現在の登録ゲーム総数: #{current_total}件"
    puts "📈 今回追加: #{@registered_count}件"
    puts "🔧 今回更新: #{@updated_count}件"
    
    puts "\n🎯 BGR4にBGGランキング上位3000位のゲームが揃いました！"
    puts "   ユーザーは高品質なゲームデータベースを楽しめます。"
  end
end

# 実行
registrar = BggTop3000Registrar.new
registrar.register_top_3000 