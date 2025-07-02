# frozen_string_literal: true

module Bgg
  class RankFetcherService < BaseService
    BATCH_SIZE = 10
    DELAY_BETWEEN_BATCHES = 5 # seconds
    DELAY_BETWEEN_RETRIES = 2 # seconds
    MAX_RETRIES = 3

    def self.fetch_games_by_rank_range(start_rank, end_rank)
      Rails.logger.info "Fetching BGG games from rank #{start_rank} to #{end_rank}..."
      
      games = []
      current_rank = start_rank
      
      while current_rank <= end_rank
        batch_end = [current_rank + BATCH_SIZE - 1, end_rank].min
        Rails.logger.info "Processing ranks #{current_rank}-#{batch_end}..."
        
        # Calculate the page number (100 games per page on BGG)
        page = (current_rank / 100.0).ceil
        
        # Fetch games from the browse page
        page_games = fetch_games_from_browse_page(page)
        
        if page_games.any?
          # Filter games within our current batch range
          batch_games = page_games.select { |g| g[:rank].between?(current_rank, batch_end) }
          
          # Fetch detailed information for each game
          batch_games.each do |game|
            game_details = fetch_game_details_with_retry(game[:bgg_id])
            if game_details
              games << game_details.merge(rank: game[:rank])
              Rails.logger.info "Successfully fetched details for #{game_details[:name]} (Rank: #{game[:rank]})"
            end
          end
        else
          Rails.logger.warn "No games found on page #{page}, trying alternative method..."
          # If browse page fails, try getting games one by one using their stats
          (current_rank..batch_end).each do |rank|
            game = fetch_game_by_rank(rank)
            games << game if game
          end
        end
        
        current_rank = batch_end + 1
        Rails.logger.info "Waiting #{DELAY_BETWEEN_BATCHES} seconds before next batch..."
        sleep DELAY_BETWEEN_BATCHES
      end
      
      games
    end
    
    private
    
    def self.fetch_games_from_browse_page(page)
      retries = 0
      begin
        url = "https://boardgamegeek.com/browse/boardgame/page/#{page}?sort=rank"
        Rails.logger.info "Fetching BGG browse page: #{url}"
        
        response = get(url)
        return [] unless response.success?
        
        doc = Nokogiri::HTML(response.body)
        games = []
        
        doc.css('tr[id^="row_"]').each do |row|
          rank_cell = row.css('td.collection_rank').first
          next unless rank_cell
          
          rank = rank_cell.text.strip.to_i
          next if rank.zero?
          
          name_link = row.css('td.collection_objectname a').first
          next unless name_link
          
          href = name_link['href']
          next unless href
          
          if (match = href.match(/\/boardgame\/(\d+)\//))
            bgg_id = match[1]
            name = name_link.text.strip
            
            games << {
              bgg_id: bgg_id,
              name: name.gsub(/\s*\(\d{4}\)\s*$/, ''), # Remove year
              rank: rank
            }
          end
        end
        
        games.sort_by { |g| g[:rank] }
      rescue => e
        retries += 1
        if retries < MAX_RETRIES
          Rails.logger.warn "Error fetching browse page #{page}: #{e.message}. Retrying in #{DELAY_BETWEEN_RETRIES} seconds..."
          sleep DELAY_BETWEEN_RETRIES
          retry
        else
          Rails.logger.error "Failed to fetch browse page #{page} after #{MAX_RETRIES} attempts: #{e.message}"
          []
        end
      end
    end
    
    def self.fetch_game_details_with_retry(bgg_id)
      retries = 0
      begin
        game_details = GameService.get_game_details(bgg_id)
        return nil unless game_details
        
        # Clean up and standardize the game details
        {
          bgg_id: bgg_id,
          name: game_details[:name],
          description: game_details[:description],
          image_url: game_details[:image_url],
          min_players: game_details[:min_players],
          max_players: game_details[:max_players],
          play_time: game_details[:play_time],
          min_play_time: game_details[:min_play_time],
          max_play_time: game_details[:max_play_time],
          weight: game_details[:weight],
          average_score: game_details[:average_score],
          publisher: game_details[:publisher],
          designer: game_details[:designers]&.first,
          year_published: game_details[:year_published],
          categories: game_details[:categories],
          mechanics: game_details[:mechanics]
        }
      rescue => e
        retries += 1
        if retries < MAX_RETRIES
          Rails.logger.warn "Error fetching game details for BGG ID #{bgg_id}: #{e.message}. Retrying in #{DELAY_BETWEEN_RETRIES} seconds..."
          sleep DELAY_BETWEEN_RETRIES
          retry
        else
          Rails.logger.error "Failed to fetch game details for BGG ID #{bgg_id} after #{MAX_RETRIES} attempts: #{e.message}"
          nil
        end
      end
    end
    
    def self.fetch_game_by_rank(rank)
      retries = 0
      begin
        url = "https://boardgamegeek.com/xmlapi2/search?type=boardgame&query=rank:#{rank}"
        response = get(url)
        return nil unless response.success?
        
        doc = Nokogiri::XML(response.body)
        game_id = doc.at_xpath('//item/@id')&.value
        return nil unless game_id
        
        game_details = fetch_game_details_with_retry(game_id)
        game_details&.merge(rank: rank)
      rescue => e
        retries += 1
        if retries < MAX_RETRIES
          Rails.logger.warn "Error fetching game by rank #{rank}: #{e.message}. Retrying in #{DELAY_BETWEEN_RETRIES} seconds..."
          sleep DELAY_BETWEEN_RETRIES
          retry
        else
          Rails.logger.error "Failed to fetch game by rank #{rank} after #{MAX_RETRIES} attempts: #{e.message}"
          nil
        end
      end
    end
  end
end 