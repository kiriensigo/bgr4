# frozen_string_literal: true

module Bgg
  class PopularGamesService < BaseService
    def self.get_popular_games(limit = 50)
      handle_http_errors do
        url = "#{XML_API_URL}/hot?type=boardgame"
        response = get(url)
        
        return [] unless response.success?
        
        doc = parse_xml_response(response)
        return [] unless doc
        
        games = []
        doc.xpath('//item').limit(limit).each do |item|
          games << {
            bgg_id: item['id'],
            name: item.at_xpath('.//name')&.attr('value'),
            rank: item['rank']&.to_i
          }
        end
        
        games
      end
    end
    
    def self.get_hot_games
      get_popular_games(50)
    end
    
    def self.get_top_games_from_browse(page = 1)
      handle_http_errors do
        # BGGのブラウズページからトップゲームを取得
        url = "#{BASE_URL}/browse/boardgame/page/#{page}"
        response = get(url)
        
        return [] unless response.success?
        
        # HTMLパースでゲーム情報を抽出
        doc = Nokogiri::HTML(response.body)
        games = []
        
        doc.css('tr[id^="row_"]').each do |row|
          rank_cell = row.css('td.collection_rank')
          next unless rank_cell.any?
          
          rank = rank_cell.text.strip.to_i
          
          name_link = row.css('td.collection_objectname a').first
          next unless name_link
          
          # BGG IDをURLから抽出
          href = name_link['href']
          bgg_id = href.match(/\/boardgame\/(\d+)\//)[1] if href
          
          next unless bgg_id
          
          games << {
            bgg_id: bgg_id,
            name: name_link.text.strip,
            rank: rank
          }
        end
        
        games
      end
    end
    
    def self.parse_hot_games(response)
      return [] unless response&.success?
      
      doc = parse_xml_response(response)
      return [] unless doc
      
      games = []
      doc.xpath('//item').each do |item|
        games << {
          bgg_id: item['id'],
          name: item.at_xpath('.//name')&.attr('value'),
          rank: item['rank']&.to_i,
          thumbnail: item.at_xpath('.//thumbnail')&.content
        }
      end
      
      games
    end
  end
end 