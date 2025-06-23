# frozen_string_literal: true

module Bgg
  class GameService < BaseService
    def self.search_games(query)
      handle_http_errors do
        url = "#{XML_API_URL}/search?query=#{CGI.escape(query)}&type=boardgame"
        response = get(url)
        
        return [] unless response.success?
        
        doc = parse_xml_response(response)
        return [] unless doc
        
        games = []
        doc.xpath('//item').each do |item|
          games << {
            bgg_id: item['id'],
            name: item.at_xpath('.//name')&.attr('value'),
            year_published: item.at_xpath('.//yearpublished')&.attr('value')&.to_i
          }
        end
        
        games
      end
    end
    
    def self.get_game_details(bgg_id)
      handle_http_errors do
        wait_for_api_limit
        
        url = "#{XML_API_URL}/thing?id=#{bgg_id}&stats=1&type=boardgame"
        Rails.logger.info "BGG API Request: #{url}"
        
        response = get(url)
        
        unless response.success?
          Rails.logger.error "BGG API Error: #{response.code} - #{response.message}"
          return nil
        end
        
        doc = parse_xml_response(response)
        return nil unless doc
        
        item = doc.at_xpath('//item')
        return nil unless item
        
        GameParser.parse_game_item(item)
      end
    end
    
    def self.get_games_details_batch(bgg_ids)
      return [] if bgg_ids.empty?
      
      handle_http_errors do
        ids_string = bgg_ids.join(',')
        url = "#{XML_API_URL}/thing?id=#{ids_string}&stats=1&type=boardgame"
        
        Rails.logger.info "BGG Batch API Request: #{url}"
        
        response = get(url)
        return [] unless response.success?
        
        doc = parse_xml_response(response)
        return [] unless doc
        
        games = []
        doc.xpath('//item').each do |item|
          parsed_game = GameParser.parse_game_item(item)
          games << parsed_game if parsed_game
        end
        
        games
      end
    end
    
    def self.get_expansions(bgg_id)
      handle_http_errors do
        url = "#{XML_API_URL}/thing?id=#{bgg_id}&type=boardgame"
        response = get(url)
        
        return [] unless response.success?
        
        doc = parse_xml_response(response)
        return [] unless doc
        
        expansions = []
        doc.xpath('//link[@type="boardgameexpansion"]').each do |expansion|
          expansions << {
            bgg_id: expansion['id'],
            name: expansion['value']
          }
        end
        
        expansions
      end
    end
  end
end 