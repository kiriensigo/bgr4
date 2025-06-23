# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command.

require 'open-uri'
require 'nokogiri'

def process_game(bgg_id)
  puts "Processing game with BGG ID: #{bgg_id}"
  
  begin
    # 既存のゲームを探す
    game = Game.find_by(bgg_id: bgg_id)
    
    if game&.name.present? && game.name != "Unknown"
      puts "  -> Game '#{game.name}' already exists. Skipping update."
      return
    end
    
    # BGGからゲーム情報を取得
    bgg_game_info = BggService.get_game_details(bgg_id)
    
    if bgg_game_info.blank?
      puts "  -> Could not fetch game info from BGG for ID #{bgg_id}"
      return
    end
    
    # ゲームが存在しない場合は新規作成
    game ||= Game.new(bgg_id: bgg_id, registered_on_site: true)
    
    # 基本情報を更新
    game.name = bgg_game_info[:name]
    game.description = DeeplTranslationService.cleanup_html_entities(bgg_game_info[:description]) if bgg_game_info[:description].present?
    game.image_url = bgg_game_info[:image_url]
    game.min_players = bgg_game_info[:min_players]
    game.max_players = bgg_game_info[:max_players]
    game.play_time = bgg_game_info[:play_time]
    game.min_play_time = bgg_game_info[:min_play_time]
    game.bgg_score = bgg_game_info[:average_score]
    game.weight = bgg_game_info[:weight]
    game.publisher = bgg_game_info[:publisher]
    game.designer = bgg_game_info[:designer]
    game.release_date = bgg_game_info[:release_date]
    
    # メタデータを更新
    game.store_metadata(:expansions, bgg_game_info[:expansions]) if bgg_game_info[:expansions].present?
    game.store_metadata(:best_num_players, bgg_game_info[:best_num_players]) if bgg_game_info[:best_num_players].present?
    game.store_metadata(:recommended_num_players, bgg_game_info[:recommended_num_players]) if bgg_game_info[:recommended_num_players].present?
    game.store_metadata(:categories, bgg_game_info[:categories]) if bgg_game_info[:categories].present?
    game.store_metadata(:mechanics, bgg_game_info[:mechanics]) if bgg_game_info[:mechanics].present?
    
    # 日本語版情報を取得
    japanese_version = BggService.get_japanese_version_info(bgg_id)
    
    if japanese_version
      game.japanese_name = japanese_version[:name] if japanese_version[:name].present?
      game.japanese_publisher = japanese_version[:publisher] if japanese_version[:publisher].present?
      game.japanese_release_date = japanese_version[:release_date] if japanese_version[:release_date].present?
      game.japanese_image_url = japanese_version[:image_url] if japanese_version[:image_url].present?
    elsif bgg_game_info[:japanese_name].present?
      game.japanese_name = bgg_game_info[:japanese_name]
      game.japanese_publisher = bgg_game_info[:japanese_publisher] if bgg_game_info[:japanese_publisher].present?
      game.japanese_release_date = bgg_game_info[:japanese_release_date] if bgg_game_info[:japanese_release_date].present?
      game.japanese_image_url = bgg_game_info[:japanese_image_url] if bgg_game_info[:japanese_image_url].present?
    end
    
    # JapanesePublisherモデルから日本語出版社情報を取得
    japanese_publisher_from_db = JapanesePublisher.get_publisher_name(bgg_id)
    if japanese_publisher_from_db.present?
      game.japanese_publisher = japanese_publisher_from_db
      Rails.logger.info "Using Japanese publisher from database: #{japanese_publisher_from_db}"
    end
    
    # 日本語出版社名を正規化
    game.normalize_japanese_publisher
    
    # サイト登録フラグを設定
    game.registered_on_site = true
    
    # 保存
    game.save!
    puts "  -> Successfully saved game: #{game.name}"
    
    # BGG APIへの負荷を考慮してウェイトを入れる
    sleep(2)
  rescue => e
    puts "  -> An error occurred while processing BGG ID #{bgg_id}: #{e.message}"
  end
end

puts "Starting to scrape BGG top 100 games for seeding..."

# BGGのランキングページは1ページあたり100件なので、1ページだけ取得
puts "Scraping page 1..."
url = "https://boardgamegeek.com/browse/boardgame/page/1"

begin
  # ユーザーエージェントを偽装して403エラーを回避
  html = URI.open(url, "User-Agent" => "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36")
  doc = Nokogiri::HTML(html)
  
  game_links = doc.css('a.primary')
  
  if game_links.empty?
    puts "Could not find game links on page 1. Stopping."
  else
    game_links.each do |link|
      href = link['href']
      if href&.match(%r{/boardgame/(\d+)/})
        bgg_id = $1
        process_game(bgg_id)
      end
    end
  end
  
rescue OpenURI::HTTPError => e
  puts "Could not open page. Error: #{e.message}. Stopping."
rescue => e
  puts "An unexpected error occurred: #{e.message}. Stopping."
end

puts "Finished seeding BGG top 100 games."

puts "Starting to seed test games..."

# テスト用のゲームIDリスト
test_game_ids = [
  '173346',  # 7 Wonders Duel
  '224517',  # Brass: Birmingham
  '174430',  # Gloomhaven
  '233078',  # Twilight Imperium: Fourth Edition
  '316554',  # Dune: Imperium
  '167791'   # Terraforming Mars
]

test_game_ids.each do |bgg_id|
  process_game(bgg_id)
  # 各ゲーム間で十分な待機時間を設ける
  sleep(5)
end

puts "Finished seeding test games."
