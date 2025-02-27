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
        japanese_name: game[:japanese_name],
        image_url: game[:image_url],
        min_players: game[:min_players],
        max_players: game[:max_players],
        play_time: game[:play_time],
        average_score: game[:average_score]
      }
    end
  end

  def self.get_game_details(ids)
    uri = URI("#{BASE_URL}/thing?id=#{Array(ids).join(',')}&stats=1&versions=1")
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
    
    results = doc.xpath('//item[@type="boardgame"]').map do |item|
      name = item.at_xpath('.//name[@type="primary"]/@value')&.value
      
      # 日本語名を取得（優先順位: 1. バージョン情報から日本語版の名前、2. 代替名から日本語名、3. Amazonから検索）
      japanese_name = find_japanese_name_from_versions(item) || 
                      find_japanese_name_from_alternates(item) || 
                      AmazonService.search_game_japanese_name(name)
      
      description = item.at_xpath('.//description')&.text
      
      # 説明文が英語の場合、日本語に翻訳
      japanese_description = nil
      if description.present? && description.match?(/^[A-Za-z0-9\s\.\,\;\:\"\'\!\?\(\)\-\_\@\#\$\%\&\*\+\=\/\\\[\]\{\}\<\>\|]+$/)
        Rails.logger.debug "Translating description for game: #{name}"
        japanese_description = TranslationService.translate(description)
        Rails.logger.debug "Translation completed"
      end
      
      {
        bgg_id: item['id'],
        name: name,
        japanese_name: japanese_name,
        description: description,
        japanese_description: japanese_description,
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

  # バージョン情報から日本語版の名前を取得
  def self.find_japanese_name_from_versions(item)
    # バージョン情報を取得
    versions = item.xpath('.//versions/item')
    
    # 日本語版を探す
    japanese_version = versions.find do |version|
      # 言語が日本語のバージョンを探す
      version.xpath('.//link[@type="language"]').any? { |link| link['value'] == 'Japanese' }
    end
    
    if japanese_version
      # 日本語版の名前を取得
      japanese_name = japanese_version.at_xpath('.//name[@type="primary"]/@value')&.value
      
      # 「Japanese edition」という名前の場合は、元のゲーム名から日本語名を探す
      if japanese_name == 'Japanese edition'
        # 代替名から日本語名を探す
        japanese_name = find_japanese_name_from_alternates(item)
      end
      
      Rails.logger.debug "Found Japanese name from versions: #{japanese_name}" if japanese_name
      return japanese_name
    end
    
    nil
  end

  # 代替名から日本語名を探す
  def self.find_japanese_name_from_alternates(item)
    # 代替名を取得
    alternate_names = item.xpath('.//name[@type="alternate"]')
    
    # 日本語の代替名を探す（日本語の文字が含まれているか確認）
    japanese_alternate = alternate_names.find do |name|
      name_value = name['value']
      name_value && name_value.match?(/[\p{Hiragana}\p{Katakana}\p{Han}]/)
    end
    
    if japanese_alternate
      japanese_name = japanese_alternate['value']
      Rails.logger.debug "Found Japanese name from alternates: #{japanese_name}"
      return japanese_name
    end
    
    nil
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
      name = item.at_xpath('.//name[@type="primary"]/@value')&.value
      japanese_name = AmazonService.search_game_japanese_name(name)
      {
        id: item['id'],
        name: name,
        japanese_name: japanese_name,
        image_url: item.at_xpath('.//image')&.text
      }
    end
  end
end 