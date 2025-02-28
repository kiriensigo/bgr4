require 'net/http'
require 'nokogiri'
require 'httparty'

class BggService
  include HTTParty
  base_uri 'https://boardgamegeek.com/xmlapi2'
  
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
          Yuuai Kikaku|遊愛企画|Capcom|カプコン|Bandai|バンダイ|Konami|コナミ|
          Suki Games|数寄ゲームズ/ix)
      end
      
      # 日本語版の出版社
      japanese_publisher = japanese_publishers.first
      
      # 発売年を取得
      release_date = item.at_xpath('.//yearpublished')&.attr('value')
      release_date = "#{release_date}-01-01" if release_date
      
      # 日本語版の情報を取得
      japanese_version_info = get_japanese_version_info(bgg_id)
      
      # 日本語版の情報があれば、それを優先して使用
      if japanese_version_info
        Rails.logger.info "Found Japanese version info: #{japanese_version_info.inspect}"
        japanese_name ||= japanese_version_info[:name]
        japanese_publisher ||= japanese_version_info[:publisher]
        japanese_release_date = japanese_version_info[:release_date] if japanese_version_info[:release_date]
        japanese_image_url = japanese_version_info[:image_url]
      else
        # 日本語版の発売年は現状BGGから取得できないため、同じ値を使用
        japanese_release_date = release_date if japanese_name
      end
      
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
        japanese_image_url: japanese_image_url,
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
  
  # 日本語バージョン情報を取得するメソッド
  def self.get_japanese_version_info(bgg_id)
    # まずバージョン情報を取得
    versions_response = get("/thing?id=#{bgg_id}&versions=1")
    return nil unless versions_response.success?
    
    versions_xml = Nokogiri::XML(versions_response.body)
    
    # 日本語バージョンを探す
    japanese_version = nil
    
    versions_xml.xpath('//item/versions/item').each do |version|
      version_name = version.at_xpath('./name')&.attr('value') || ''
      version_nickname = version.at_xpath('./nameid[@type="primary"]')&.text || ''
      
      # 日本語バージョンかどうかを判定するための条件を強化
      has_japanese_chars = version_name.match?(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/)
      contains_japan_keyword = 
        version_name.downcase.include?('japanese') || 
        version_name.downcase.include?('japan') || 
        version_name.include?('日本語') ||
        version_nickname.downcase.include?('japanese') || 
        version_nickname.downcase.include?('japan') || 
        version_nickname.include?('日本語')
      
      # 日本の出版社が含まれているかチェック
      has_japanese_publisher = false
      version.xpath('.//link[@type="boardgamepublisher"]').each do |link|
        publisher_name = link.attr('value') || ''
        if publisher_name.match?(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/) ||
           publisher_name.include?('Japan') ||
           publisher_name.include?('Hobby Japan') ||
           publisher_name.include?('Arclight') ||
           publisher_name.include?('アークライト') ||
           publisher_name.include?('ホビージャパン')
          has_japanese_publisher = true
          break
        end
      end
      
      # 日本語バージョンかどうかを判定
      is_japanese = has_japanese_chars || contains_japan_keyword || has_japanese_publisher ||
                    version.at_xpath('./link[@type="language" and @value="Japanese"]')
      
      if is_japanese
        japanese_version = version
        Rails.logger.info "Found Japanese version: #{version_name}"
        break
      end
    end
    
    return nil unless japanese_version
    
    # バージョンIDを取得
    version_id = japanese_version['id']
    
    # バージョン詳細情報を取得
    begin
      version_response = get("/version?id=#{version_id}")
      return nil unless version_response.success?
      
      version_xml = Nokogiri::XML(version_response.body)
      version_item = version_xml.at_xpath('//item')
      return nil unless version_item
      
      # 日本語名を取得
      japanese_name = version_item.at_xpath('./name')&.attr('value')
      Rails.logger.info "Version Japanese name: #{japanese_name}"
      
      # 出版社を取得
      publishers = version_item.xpath('.//link[@type="boardgamepublisher"]').map { |link| link.attr('value') }
      Rails.logger.info "Version publishers: #{publishers.inspect}"
      
      # 発売日を取得
      release_date = version_item.at_xpath('./releasedate')&.text
      Rails.logger.info "Version release date: #{release_date}"
      
      if release_date && !release_date.empty?
        # YYYY-MM-DD形式に変換
        begin
          date = Date.parse(release_date)
          release_date = date.strftime('%Y-%m-%d')
        rescue
          release_date = nil
        end
      else
        release_date = nil
      end
      
      # 画像URLを取得
      image_url = version_item.at_xpath('./image')&.text || version_item.at_xpath('./thumbnail')&.text
      Rails.logger.info "Version image URL: #{image_url}"
      
      # 画像URLが取得できない場合は、BGGの画像検索APIを使用して日本語版の画像を検索
      if image_url.blank? && japanese_name.present?
        # 日本語名を使用して画像を検索
        image_url = search_japanese_version_image(bgg_id, japanese_name)
        Rails.logger.info "Found Japanese version image through search: #{image_url}" if image_url.present?
      end
      
      {
        name: japanese_name,
        publisher: publishers.first,
        release_date: release_date,
        image_url: image_url
      }
    rescue => e
      Rails.logger.error "Error fetching version details: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      nil
    end
  end
  
  # 日本語版の画像を検索するメソッド
  def self.search_japanese_version_image(bgg_id, japanese_name)
    begin
      # BGGの画像ギャラリーを検索
      gallery_response = get("/images?thing=#{bgg_id}")
      return nil unless gallery_response.success?
      
      gallery_xml = Nokogiri::XML(gallery_response.body)
      
      # 日本語版の画像を探す（キャプションに日本語が含まれているか、「Japanese」「Japan」などのキーワードが含まれている画像）
      japanese_image = nil
      
      gallery_xml.xpath('//item').each do |image|
        caption = image.at_xpath('./caption')&.text || ''
        
        # 日本語版の画像かどうかを判定
        is_japanese_image = 
          caption.match?(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/) ||
          caption.downcase.include?('japanese') ||
          caption.downcase.include?('japan') ||
          caption.include?('日本語')
        
        if is_japanese_image
          japanese_image = image.at_xpath('./large')&.text || image.at_xpath('./medium')&.text || image.at_xpath('./small')&.text
          Rails.logger.info "Found Japanese version image: #{japanese_image}"
          break
        end
      end
      
      japanese_image
    rescue => e
      Rails.logger.error "Error searching Japanese version image: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
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