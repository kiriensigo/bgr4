require 'net/http'
require 'nokogiri'
require 'httparty'

class BggService
  include HTTParty
  base_uri 'https://boardgamegeek.com/xmlapi2'

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

  def self.get_game_details(bgg_id)
    response = get("/thing?id=#{bgg_id}&stats=1")
    
    if response.success?
      xml = Nokogiri::XML(response.body)
      
      # 基本情報を取得
      item = xml.at_xpath('//item')
      return nil unless item
      
      # 名前を取得（プライマリー名を優先）
      primary_name = item.xpath('.//name[@type="primary"]').first&.attr('value')
      
      # 日本語名を探す
      japanese_name = item.xpath('.//name[@type="alternate"]').find do |name|
        name.attr('value').match?(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/)
      end&.attr('value')
      
      # 出版社情報を取得
      publishers = item.xpath('.//link[@type="boardgamepublisher"]').map { |link| link.attr('value') }
      
      # デザイナー情報を取得
      designers = item.xpath('.//link[@type="boardgamedesigner"]').map { |link| link.attr('value') }
      
      # 日本語版の出版社を探す（日本の出版社名を含むものを探す）
      japanese_publishers = publishers.select do |publisher|
        publisher.match?(/Japan|Japanese|Japon|ホビージャパン|アークライト|グループSNE|テンデイズゲームズ|
          ニューゲームズオーダー|Arclight|Hobby Japan|Group SNE|Ten Days Games|New Games Order|
          Oink Games|Grounding|グラウンディング|BakaFire|バカファイア|
          Shinojo|紫猫|Takoashi Games|タコアシゲームズ|Takuya Ono|小野卓也|
          Yocto Games|ヨクト|Yuhodo|遊歩堂|Itten|いつつ|Jelly Jelly Games|
          ジェリージェリーゲームズ|Kocchiya|こっちや|Kuuri|くうり|
          Qvinta|クインタ|Route11|ルート11|Suki Games Mk2|スキゲームズMk2|
          Taikikennai Games|耐気圏内ゲームズ|Team Saien|チーム彩園|
          Tokyo Game Market|東京ゲームマーケット|Toshiki Sato|佐藤敏樹|
          Yuuai Kikaku|遊愛企画|Capcom|カプコン|Bandai|バンダイ|Konami|コナミ/ix)
      end
      
      japanese_publisher = japanese_publishers.first
      
      # 発売年を取得
      release_date = item.at_xpath('.//yearpublished')&.attr('value')
      release_date = "#{release_date}-01-01" if release_date
      
      # 日本語版の発売年は現状BGGから取得できないため、同じ値を使用
      japanese_release_date = release_date if japanese_name
      
      # 拡張情報を取得
      expansions = item.xpath('.//link[@type="boardgameexpansion" and @inbound="true"]').map do |link|
        {
          id: link.attr('id'),
          name: link.attr('value')
        }
      end
      
      # ベースゲーム情報を取得
      base_game_links = item.xpath('.//link[@type="boardgameexpansion" and not(@inbound="true")]')
      base_game = nil
      if base_game_links.any?
        base_game = {
          id: base_game_links.first.attr('id'),
          name: base_game_links.first.attr('value')
        }
      end
      
      # ゲーム情報をハッシュで返す
      {
        bgg_id: bgg_id,
        name: primary_name,
        japanese_name: japanese_name,
        description: item.at_xpath('.//description')&.text,
        image_url: item.at_xpath('.//image')&.text,
        min_players: item.at_xpath('.//minplayers')&.attr('value')&.to_i,
        max_players: item.at_xpath('.//maxplayers')&.attr('value')&.to_i,
        play_time: item.at_xpath('.//maxplaytime')&.attr('value')&.to_i || item.at_xpath('.//playingtime')&.attr('value')&.to_i,
        min_play_time: item.at_xpath('.//minplaytime')&.attr('value')&.to_i,
        average_score: item.at_xpath('.//statistics/ratings/average')&.attr('value')&.to_f,
        weight: item.at_xpath('.//statistics/ratings/averageweight')&.attr('value')&.to_f,
        publisher: publishers.first,
        designer: designers.first,
        release_date: release_date,
        japanese_publisher: japanese_publisher,
        japanese_release_date: japanese_release_date,
        expansions: expansions.presence,
        base_game: base_game
      }
    else
      Rails.logger.error "BGG API error: #{response.code} - #{response.message}"
      nil
    end
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