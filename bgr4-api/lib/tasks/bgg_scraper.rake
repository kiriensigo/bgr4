require 'open-uri'
require 'nokogiri'

namespace :bgg_scraper do
  desc "Scrape BGG's top 1000 games and register them"
  task top_1000: :environment do
    
    def process_game(bgg_id)
      puts "Processing game with BGG ID: #{bgg_id}"
      
      begin
        game = Game.find_or_create_by!(bgg_id: bgg_id)
        
        if game.name.present? && game.name != "Unknown"
          puts "  -> Game '#{game.name}' already exists. Skipping update."
          return
        end
        
        puts "  -> Updating details from BGG..."
        game.update_from_bgg(true)
        puts "  -> Updated details for: #{game.name}"
        
        # BGG APIへの負荷を考慮してウェイトを入れる
        sleep(2)
      rescue => e
        puts "  -> An error occurred while processing BGG ID #{bgg_id}: #{e.message}"
      end
    end

    puts "Starting to scrape BGG top 1000 games..."
    
    # BGGのランキングページは1ページあたり100件
    (1..10).each do |page|
      puts "Scraping page #{page}..."
      url = "https://boardgamegeek.com/browse/boardgame/page/#{page}"
      
      begin
        # ユーザーエージェントを偽装して403エラーを回避
        html = URI.open(url, "User-Agent" => "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36")
        doc = Nokogiri::HTML(html)
        
        game_links = doc.css('a.primary')
        
        if game_links.empty?
            puts "Could not find game links on page #{page}. Stopping."
            break
        end

        game_links.each do |link|
          href = link['href']
          if href&.match(%r{/boardgame/(\d+)/})
            bgg_id = $1
            process_game(bgg_id)
          end
        end
        
        puts "Finished scraping page #{page}. Waiting a bit before next page..."
        sleep(5) # ページ間のスクレイピングにもウェイトを入れる
        
      rescue OpenURI::HTTPError => e
        puts "Could not open page #{page}. Error: #{e.message}. Stopping."
        break
      rescue => e
        puts "An unexpected error occurred on page #{page}: #{e.message}. Stopping."
        break
      end
    end

    puts "Finished scraping BGG top 1000 games."
  end
end 