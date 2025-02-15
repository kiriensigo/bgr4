require 'net/http'
require 'nokogiri'

class BggService
  BASE_URL = 'https://boardgamegeek.com/xmlapi2'

  def self.search_games(query)
    uri = URI("#{BASE_URL}/search?query=#{URI.encode_www_form_component(query)}&type=boardgame")
    response = Net::HTTP.get(uri)
    doc = Nokogiri::XML(response)
    
    game_ids = doc.xpath('//item/@id').map(&:value)
    games = get_game_details(game_ids)
    
    games.map do |game|
      {
        id: game[:bgg_id],  # BGG IDをIDとして使用
        bgg_id: game[:bgg_id],
        name: game[:name],
        image_url: game[:image_url],
        min_players: game[:min_players],
        max_players: game[:max_players],
        play_time: game[:play_time],
        average_score: game[:average_score]
      }
    end
  end

  def self.get_game_details(ids)
    uri = URI("#{BASE_URL}/thing?id=#{Array(ids).join(',')}&stats=1")
    Rails.logger.debug "Fetching BGG details from: #{uri}"
    
    response = Net::HTTP.get(uri)
    Rails.logger.debug "BGG API response received"
    
    # BGG APIは時々202を返すことがあるので、その場合は少し待って再試行
    if response.include?("Please try again later")
      Rails.logger.debug "BGG API returned 202, retrying after delay"
      sleep(2)
      response = Net::HTTP.get(uri)
    end
    
    doc = Nokogiri::XML(response)
    Rails.logger.debug "Parsed XML response"
    
    results = doc.xpath('//item').map do |item|
      {
        bgg_id: item['id'],
        name: item.at_xpath('.//name[@type="primary"]/@value')&.value,
        description: item.at_xpath('.//description')&.text,
        image_url: item.at_xpath('.//image')&.text,
        min_players: item.at_xpath('.//minplayers/@value')&.value.to_i,
        max_players: item.at_xpath('.//maxplayers/@value')&.value.to_i,
        play_time: item.at_xpath('.//playingtime/@value')&.value.to_i,
        average_score: item.at_xpath('.//statistics/ratings/average/@value')&.value.to_f
      }
    end

    Rails.logger.debug "Processed #{results.length} games"
    results
  rescue StandardError => e
    Rails.logger.error "Error in BggService#get_game_details: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
    Rails.logger.error "Request URL: #{uri}"
    []
  end

  def self.get_popular_games(limit = 50)
    # BGGのHot Gamesリストを取得
    response = get_hot_games
    games = parse_hot_games(response)
    
    # 詳細情報を取得
    game_ids = games.map { |g| g[:id] }.join(',')
    details = get_game_details(game_ids)
    
    # 必要な情報のみを返す
    details.first(limit)
  end

  def self.get_hot_games
    uri = URI("#{BASE_URL}/hot?type=boardgame")
    response = Net::HTTP.get(uri)
    response.to_s
  rescue StandardError => e
    Rails.logger.error "Error in BggService#get_hot_games: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
    ""
  end

  def self.parse_hot_games(response)
    doc = Nokogiri::XML(response)
    doc.xpath('//item').map do |item|
      {
        id: item['id'],
        name: item.at_xpath('.//name[@type="primary"]/@value')&.value,
        image_url: item.at_xpath('.//image')&.text
      }
    end
  end
end 