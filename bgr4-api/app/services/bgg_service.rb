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
        # 日本語版の発売日が存在する場合は、それを優先して使用
        japanese_release_date = japanese_version_info[:release_date] if japanese_version_info[:release_date].present?
        japanese_image_url = japanese_version_info[:image_url]
        
        # 日本語版の情報をログに出力
        Rails.logger.info "Using Japanese version info - Name: #{japanese_name}, Publisher: #{japanese_publisher}, Release Date: #{japanese_release_date}, Image URL: #{japanese_image_url}"
      else
        # 日本語版の発売年は現状BGGから取得できないため、同じ値を使用
        japanese_release_date = release_date if japanese_name
      end
      
      # 日本語版の画像URLが見つからない場合で、日本語名がある場合は直接検索
      if japanese_image_url.blank? && japanese_name.present?
        Rails.logger.info "Japanese image URL not found from version info, searching with alternate name: #{japanese_name}"
        japanese_image_url = search_japanese_version_image(bgg_id, japanese_name)
        Rails.logger.info "Found Japanese version image using alternate name: #{japanese_image_url}" if japanese_image_url.present?
      end
      
      # 出版社名とデザイナー名を正規化
      normalized_publisher = normalize_publisher_name(publishers.first) if publishers.any?
      normalized_designer = normalize_designer_name(designers.first) if designers.any?
      normalized_japanese_publisher = normalize_publisher_name(japanese_publisher) if japanese_publisher.present?
      
      # 拡張情報を取得
      expansions = item.xpath('.//link[@type="boardgameexpansion" and @inbound="true"]').map do |link|
        {
          id: link.attr('id'),
          name: link.attr('value')
        }
      end
      
      # プレイ人数の投票データを解析
      best_num_players = []
      recommended_num_players = []
      
      # suggested_numplayers投票を取得
      poll_elements = item.xpath('.//poll[@name="suggested_numplayers"]/results')
      
      poll_elements.each do |poll|
        num_players = poll['numplayers']
        
        # 投票結果を取得
        best_votes = poll.at_xpath('./result[@value="Best"]')&.attr('numvotes')&.to_i || 0
        recommended_votes = poll.at_xpath('./result[@value="Recommended"]')&.attr('numvotes')&.to_i || 0
        not_recommended_votes = poll.at_xpath('./result[@value="Not Recommended"]')&.attr('numvotes')&.to_i || 0
        
        total_votes = best_votes + recommended_votes + not_recommended_votes
        
        if total_votes > 0
          # ベストプレイ人数の判定（最も多い投票を獲得）
          if best_votes > recommended_votes && best_votes > not_recommended_votes
            best_num_players << num_players
          end
          
          # 推奨プレイ人数の判定（Best + Recommendedの投票がNotRecommendedより多い）
          if best_votes + recommended_votes > not_recommended_votes
            recommended_num_players << num_players
          end
        end
      end
      
      Rails.logger.info "Best num players: #{best_num_players.inspect}"
      Rails.logger.info "Recommended num players: #{recommended_num_players.inspect}"
      
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
        publisher: normalized_publisher,
        designer: normalized_designer,
        release_date: release_date,
        japanese_publisher: normalized_japanese_publisher,
        japanese_release_date: japanese_release_date,
        expansions: expansions.presence,
        best_num_players: best_num_players,
        recommended_num_players: recommended_num_players
      }
    else
      Rails.logger.error "BGG API error: #{response.code} - #{response.message}"
      nil
    end
  end
  
  # 日本語バージョン情報を取得するメソッド
  def self.get_japanese_version_info(bgg_id)
    # 特定のゲームIDに対する手動マッピング
    manual_mapping = {
      # パレオの日本語版情報
      '300531' => {
        name: 'パレオ ～人類の黎明～',
        publisher: 'アークライト (Arclight)',
        release_date: '2021-03-01', # 正確な発売日を設定
        image_url: nil # 画像URLは自動検出に任せる
      },
      # カートグラファーの日本語版情報
      '263918' => {
        name: 'カートグラファー',
        publisher: 'ホビージャパン (Hobby Japan)',
        release_date: '2020-07-01', # 正確な発売日を設定
        image_url: nil
      },
      # ウイングスパンの日本語版情報
      '266192' => {
        name: 'ウイングスパン',
        publisher: 'ホビージャパン (Hobby Japan)',
        release_date: '2020-10-01',
        image_url: nil
      },
      # アズールの日本語版情報
      '230802' => {
        name: 'アズール',
        publisher: 'アークライト (Arclight)',
        release_date: '2018-07-01',
        image_url: nil
      },
      # カスカディアの日本語版情報
      '295947' => {
        name: 'カスカディア',
        publisher: 'アークライト (Arclight)',
        release_date: '2022-03-01',
        image_url: nil
      }
    }
    
    # 手動マッピングがある場合はそれを返す
    if manual_mapping[bgg_id.to_s]
      Rails.logger.info "Using manual mapping for game #{bgg_id}: #{manual_mapping[bgg_id.to_s].inspect}"
      return manual_mapping[bgg_id.to_s]
    end
    
    # 以下、通常の処理
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
           publisher_name.include?('ホビージャパン') ||
           publisher_name.include?('数寄ゲームズ') ||
           publisher_name.include?('Suki Games')
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
    Rails.logger.info "Japanese version ID: #{version_id}"
    
    # バージョンリストから直接情報を取得
    # 日本語名を取得
    japanese_name = japanese_version.at_xpath('./name')&.attr('value')
    Rails.logger.info "Version Japanese name from version list: #{japanese_name}"
    
    # 出版社を取得
    publishers = japanese_version.xpath('.//link[@type="boardgamepublisher"]').map { |link| link.attr('value') }
    Rails.logger.info "Version publishers from version list: #{publishers.inspect}"
    
    # 発売年を取得
    year_published = japanese_version.at_xpath('./yearpublished')&.attr('value')
    release_date = year_published ? "#{year_published}-01-01" : nil
    Rails.logger.info "Version release date from version list: #{release_date}"
    
    # 画像URLを取得
    image_url = japanese_version.at_xpath('./image')&.text || japanese_version.at_xpath('./thumbnail')&.text
    Rails.logger.info "Version image URL from version list: #{image_url}"
    
    # バージョン詳細情報を取得（可能であれば）
    begin
      version_response = get("/version?id=#{version_id}")
      if version_response.success?
        version_xml = Nokogiri::XML(version_response.body)
        version_item = version_xml.at_xpath('//item')
        
        if version_item
          # 詳細情報から日本語名を取得（既に取得している場合は上書きしない）
          detail_japanese_name = version_item.at_xpath('./name')&.attr('value')
          if detail_japanese_name
            Rails.logger.info "Version Japanese name from detail: #{detail_japanese_name}"
            japanese_name = detail_japanese_name
          end
          
          # 詳細情報から出版社を取得（既に取得している場合は上書きしない）
          detail_publishers = version_item.xpath('.//link[@type="boardgamepublisher"]').map { |link| link.attr('value') }
          if detail_publishers.any?
            Rails.logger.info "Version publishers from detail: #{detail_publishers.inspect}"
            publishers = detail_publishers
          end
          
          # 詳細情報から発売日を取得（既に取得している場合は上書きしない）
          detail_release_date = version_item.at_xpath('./releasedate')&.text
          if detail_release_date && !detail_release_date.empty?
            # 日付形式を検出して適切に変換
            begin
              if detail_release_date.match?(/^\d{4}-\d{2}-\d{2}$/)
                # すでにYYYY-MM-DD形式の場合はそのまま使用
                release_date = detail_release_date
              elsif detail_release_date.match?(/^\w+ \d{1,2}, \d{4}$/) || detail_release_date.match?(/^\w+ \d{1,2} \d{4}$/)
                # "Month Day, Year"形式または"Month Day Year"形式の場合
                date = Date.parse(detail_release_date)
                release_date = date.strftime('%Y-%m-%d')
              else
                # その他の形式の場合も解析を試みる
                date = Date.parse(detail_release_date)
                release_date = date.strftime('%Y-%m-%d')
              end
              Rails.logger.info "Formatted release date from detail: #{release_date}"
            rescue => e
              Rails.logger.error "Error parsing release date: #{e.message}"
              # 解析に失敗した場合は、年だけを抽出して使用
              if detail_release_date.match?(/\b\d{4}\b/)
                year = detail_release_date.match(/\b(\d{4})\b/)[1]
                release_date = "#{year}-01-01"
                Rails.logger.info "Using year from release date: #{release_date}"
              end
            end
          end
          
          # 詳細情報から画像URLを取得（既に取得している場合は上書きしない）
          detail_image_url = version_item.at_xpath('./image')&.text || version_item.at_xpath('./thumbnail')&.text
          if detail_image_url
            Rails.logger.info "Version image URL from detail: #{detail_image_url}"
            image_url = detail_image_url
          end
        end
      end
    rescue => e
      Rails.logger.error "Error fetching version details (continuing with version list data): #{e.message}"
      # エラーは無視して処理を続行
    end
    
    # 画像URLが取得できない場合は、バージョンIDを使って画像を検索
    if image_url.blank? && version_id.present?
      Rails.logger.info "Searching for version image using version ID: #{version_id}"
      version_image_url = search_version_image_by_id(version_id)
      if version_image_url.present?
        Rails.logger.info "Found version image by ID: #{version_image_url}"
        image_url = version_image_url
      end
    end
    
    # 画像URLが取得できない場合は、BGGの画像検索APIを使用して日本語版の画像を検索
    if image_url.blank? && japanese_name.present?
      # 日本語名を使用して画像を検索
      Rails.logger.info "Version image URL not found, searching in gallery..."
      image_url = search_japanese_version_image(bgg_id, japanese_name)
      if image_url.present?
        Rails.logger.info "Found Japanese version image through search: #{image_url}"
      else
        Rails.logger.warn "No Japanese version image found through search"
      end
    end
    
    # 日本語版情報を返す
    japanese_info = {
      name: japanese_name,
      publisher: publishers.first,
      release_date: release_date,
      image_url: image_url
    }
    
    Rails.logger.info "Final Japanese version info: #{japanese_info.inspect}"
    japanese_info
  end
  
  # バージョンIDを使って画像を検索する新しいメソッド
  def self.search_version_image_by_id(version_id)
    begin
      # バージョン詳細ページのHTMLを直接取得
      version_url = "https://boardgamegeek.com/boardgameversion/#{version_id}"
      response = HTTParty.get(version_url)
      return nil unless response.success?
      
      # HTMLからバージョン画像を抽出
      html = Nokogiri::HTML(response.body)
      
      # 画像ギャラリーへのリンクを探す
      gallery_link = html.at_css('a[href*="/images/version/"]')
      return nil unless gallery_link
      
      # 画像ギャラリーページを取得
      gallery_url = "https://boardgamegeek.com#{gallery_link['href']}"
      gallery_response = HTTParty.get(gallery_url)
      return nil unless gallery_response.success?
      
      # ギャラリーページから最初の画像を抽出
      gallery_html = Nokogiri::HTML(gallery_response.body)
      image_link = gallery_html.at_css('.gallery-item img')
      
      if image_link && image_link['src']
        # 小さい画像URLを大きい画像URLに変換
        image_url = image_link['src'].gsub('_mt', '')
        return image_url
      end
      
      nil
    rescue => e
      Rails.logger.error "Error searching version image by ID: #{e.message}"
      nil
    end
  end
  
  # 日本語版の画像を検索するメソッド
  def self.search_japanese_version_image(bgg_id, japanese_name)
    begin
      Rails.logger.info "Searching Japanese version image for game #{bgg_id} with name #{japanese_name}"
      
      # BGGの画像ギャラリーを検索
      gallery_response = get("/images?thing=#{bgg_id}")
      return nil unless gallery_response.success?
      
      gallery_xml = Nokogiri::XML(gallery_response.body)
      
      # 日本語版の画像を探す
      japanese_image = nil
      
      # 画像アイテムを取得
      image_items = gallery_xml.xpath('//item')
      Rails.logger.info "Found #{image_items.length} images in gallery"
      
      # 優先順位をつけて検索
      japanese_keywords = [
        japanese_name, # 日本語名と完全一致
        "日本語版", 
        "日本語", 
        "Japanese version", 
        "Japanese edition",
        "Japan version", 
        "Japan edition",
        "Japanese", 
        "Japan"
      ]
      
      # 最も優先度の高いキーワードから順に検索
      japanese_keywords.each do |keyword|
        image_items.each do |image|
          caption = image.at_xpath('./caption')&.text || ''
          
          if caption.include?(keyword)
            japanese_image = image.at_xpath('./large')&.text || image.at_xpath('./medium')&.text || image.at_xpath('./small')&.text
            Rails.logger.info "Found Japanese version image with caption '#{caption}' matching keyword '#{keyword}'"
            return japanese_image
          end
        end
      end
      
      # キーワード検索で見つからなかった場合は、日本語文字が含まれている画像を探す
      image_items.each do |image|
        caption = image.at_xpath('./caption')&.text || ''
        
        # 日本語文字が含まれているか確認
        if caption.match?(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/)
          japanese_image = image.at_xpath('./large')&.text || image.at_xpath('./medium')&.text || image.at_xpath('./small')&.text
          Rails.logger.info "Found Japanese version image with Japanese characters in caption: '#{caption}'"
          return japanese_image
        end
      end
      
      # 日本語版の画像が見つからなかった場合は、最新の画像を返す（多くの場合、最新の画像が最も品質が良い）
      if image_items.any?
        # 画像IDで降順ソート（最新の画像が先頭に来るように）
        sorted_images = image_items.sort_by { |img| -(img['id'].to_i) }
        
        # 最新の画像を返す
        latest_image = sorted_images.first
        japanese_image = latest_image.at_xpath('./large')&.text || latest_image.at_xpath('./medium')&.text || latest_image.at_xpath('./small')&.text
        Rails.logger.info "No Japanese version image found, using latest image with ID #{latest_image['id']}"
        return japanese_image
      end
      
      Rails.logger.info "No suitable image found"
      nil
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