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
    uri = URI("#{BASE_URL}/thing?id=#{bgg_id}&stats=1")
    response = Net::HTTP.get_response(uri)
    
    if response.is_a?(Net::HTTPSuccess)
      doc = Nokogiri::XML(response.body)
      item = doc.at_xpath('//item')
      
      # 名前の取得
      primary_name = item.at_xpath('.//name[@type="primary"]')&.attr('value')
      
      # 日本語名の取得
      japanese_name = nil
      item.xpath('.//name').each do |name|
        if name.attr('value').match?(/[\p{Hiragana}\p{Katakana}\p{Han}]/)
          japanese_name = name.attr('value')
          break
        end
      end
      
      # 「Japanese edition」などの英語表記のみの場合は、日本語名として扱わない
      if japanese_name
        # 実際に日本語文字（ひらがな、カタカナ、漢字）を含むか確認
        contains_japanese_chars = japanese_name.match?(/[\p{Hiragana}\p{Katakana}\p{Han}]/)
        
        # 「Japanese」「Japan」などの英語表記のみの場合は除外
        is_only_english_japanese_reference = 
          !contains_japanese_chars && 
          (japanese_name.downcase.include?('japanese') || 
           japanese_name.downcase.include?('japan edition') || 
           japanese_name.downcase.include?('japan version'))
        
        # 日本語文字を含まない、または英語表記のみの場合はnilに設定
        if !contains_japanese_chars || is_only_english_japanese_reference
          Rails.logger.info "Ignoring non-Japanese name: #{japanese_name}"
          japanese_name = nil
        end
      end
      
      # 出版社の取得
      publisher = nil
      item.xpath('.//link[@type="boardgamepublisher"]').each do |pub|
        publisher_name = pub.attr('value')
        publisher = publisher_name
        break
      end
      
      # 日本語版出版社の取得
      japanese_publisher = nil
      item.xpath('.//link[@type="boardgamepublisher"]').each do |pub|
        publisher_name = pub.attr('value')
        if publisher_name.match?(/[\p{Hiragana}\p{Katakana}\p{Han}]/) || 
           publisher_name.include?('Hobby Japan') || 
           publisher_name.include?('Arclight') ||
           publisher_name.include?('Ten Days Games')
          japanese_publisher = publisher_name
          break
        end
      end
      
      # デザイナーの取得
      designer = nil
      item.xpath('.//link[@type="boardgamedesigner"]').each do |des|
        designer_name = des.attr('value')
        designer = designer_name
        break
      end
      
      # 発売日の取得
      release_date = item.at_xpath('.//yearpublished')&.attr('value')
      
      # 日本語版発売日は現状取得できないのでnilにしておく
      japanese_release_date = nil
      
      # 拡張情報の取得
      expansions = []
      item.xpath('.//link[@type="boardgameexpansion"]').each do |exp|
        if exp.attr('inbound') != "true"  # 拡張→ベースゲームの関係ではなく、ベースゲーム→拡張の関係のみ取得
          expansions << { id: exp.attr('id'), name: exp.attr('value') }
        end
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
          if best_votes > recommended_votes && best_votes > not_recommended_votes && best_votes > 0
            best_num_players << num_players
          end
          
          # 推奨プレイ人数の判定（Best + Recommendedの投票がNotRecommendedより多い）
          if best_votes + recommended_votes > not_recommended_votes && (best_votes + recommended_votes) > 0
            recommended_num_players << num_players
          end
        end
      end
      
      # カテゴリの取得
      categories = []
      item.xpath('.//link[@type="boardgamecategory"]').each do |category|
        categories << category.attr('value')
      end
      
      # メカニクスの取得
      mechanics = []
      item.xpath('.//link[@type="boardgamemechanic"]').each do |mechanic|
        mechanics << mechanic.attr('value')
      end
      
      # 日本語版画像URLは現状取得できないのでnilにしておく
      japanese_image_url = nil
      
      # 正規化された出版社名
      normalized_publisher = publisher
      
      # 正規化された日本語版出版社名
      normalized_japanese_publisher = japanese_publisher
      
      # 正規化されたデザイナー名
      normalized_designer = designer
      
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
        best_num_players: best_num_players.presence,
        recommended_num_players: recommended_num_players.presence,
        categories: categories.presence,
        mechanics: mechanics.presence
      }
    else
      Rails.logger.error "BGG API error: #{response.code} - #{response.message}"
      nil
    end
  end
  
  # 日本語バージョン情報を取得するメソッド
  def self.get_japanese_version_info(bgg_id)
    # 手動マッピングを削除し、自動的に日本語名を取得する機能のみを使用
    
    # バージョン情報を取得
    begin
      uri = URI("#{BASE_URL}/thing?id=#{bgg_id}&versions=1")
      response = Net::HTTP.get_response(uri)
      
      if response.is_a?(Net::HTTPSuccess)
        doc = Nokogiri::XML(response.body)
        
        # 日本語版を探す
        japanese_version = nil
        version_id = nil
        
        doc.xpath('//versions/item').each do |version|
          version_name = version.at_xpath('./name')&.attr('value') || ''
          current_version_id = version.attr('id')
          
          # 日本語版かどうかを判定
          is_japanese_version = false
          
          # 実際に日本語文字を含むか確認
          has_japanese_chars = version_name.match?(/[\p{Hiragana}\p{Katakana}\p{Han}]/)
          
          # 「Japanese」「Japan」などの英語表記を含むか確認
          contains_japan_keyword = 
            version_name.downcase.include?('japanese') || 
            version_name.downcase.include?('japan') || 
            version_name.downcase.include?('日本語')
          
          # 日本の出版社が含まれているか確認
          has_japanese_publisher = false
          version.xpath('.//link[@type="boardgamepublisher"]').each do |pub|
            publisher_name = pub.attr('value')
            if publisher_name.match?(/[\p{Hiragana}\p{Katakana}\p{Han}]/) || 
               publisher_name.include?('Hobby Japan') || 
               publisher_name.include?('Arclight') ||
               publisher_name.include?('Ten Days Games')
              has_japanese_publisher = true
              break
            end
          end
          
          # 日本語版と判定する条件
          is_japanese_version = has_japanese_chars || (contains_japan_keyword && has_japanese_publisher)
          
          if is_japanese_version
            japanese_version = version
            version_id = current_version_id
            break
          end
        end
        
        if japanese_version
          # バージョン情報から日本語名を取得
          version_name = japanese_version.at_xpath('./name')&.attr('value')
          
          # nameidから日本語名を取得（BGGのバージョンページでは「Name」フィールドに相当）
          nameid_elements = japanese_version.xpath('./nameid')
          if nameid_elements.any?
            nameid_elements.each do |nameid|
              nameid_type = nameid.attr('type')
              nameid_value = nameid.text
              
              Rails.logger.info "Checking nameid: #{nameid_value}, type: #{nameid_type}"
              
              # 「primary」タイプのnameidが実際の日本語名の可能性が高い
              if nameid_type == 'primary' && nameid_value.present? && nameid_value.match?(/[\p{Hiragana}\p{Katakana}\p{Han}]/)
                version_name = nameid_value
                Rails.logger.info "Found actual Japanese name from nameid: #{version_name}"
                break
              end
            end
          end
          
          # 「Japanese edition」などの英語表記のみの場合は、日本語名として扱わない
          if version_name
            # 実際に日本語文字（ひらがな、カタカナ、漢字）を含むか確認
            contains_japanese_chars = version_name.match?(/[\p{Hiragana}\p{Katakana}\p{Han}]/)
            
            # 「Japanese」「Japan」などの英語表記のみの場合は除外
            is_only_english_japanese_reference = 
              !contains_japanese_chars && 
              (version_name.downcase.include?('japanese') || 
               version_name.downcase.include?('japan edition') || 
               version_name.downcase.include?('japan version'))
            
            # 日本語文字を含まない、または英語表記のみの場合はnilに設定
            if !contains_japanese_chars || is_only_english_japanese_reference
              Rails.logger.info "Ignoring non-Japanese version name: #{version_name}"
              
              # バージョン情報の他のフィールドから日本語名を探す
              description = japanese_version.at_xpath('./description')&.text
              if description.present?
                # 説明文から日本語名を抽出する（「Name: マイシティ」などのパターンを探す）
                name_match = description.match(/Name:\s*([^\s]+[\p{Hiragana}\p{Katakana}\p{Han}][^\n]*)/)
                if name_match && name_match[1]
                  potential_name = name_match[1].strip
                  if potential_name.match?(/[\p{Hiragana}\p{Katakana}\p{Han}]/)
                    version_name = potential_name
                    Rails.logger.info "Found Japanese name from description: #{version_name}"
                  end
                end
              end
              
              # それでも日本語名が見つからない場合はnilに設定
              if !version_name || !version_name.match?(/[\p{Hiragana}\p{Katakana}\p{Han}]/)
                version_name = nil
              end
            end
          end
          
          # 出版社を取得
          publisher = nil
          japanese_version.xpath('.//link[@type="boardgamepublisher"]').each do |pub|
            publisher = pub.attr('value')
            break
          end
          
          # 発売日を取得
          release_date = japanese_version.at_xpath('./yearpublished')&.attr('value')
          release_date = "#{release_date}-01-01" if release_date
          
          # 画像URLを取得
          image_url = japanese_version.at_xpath('./image')&.text || japanese_version.at_xpath('./thumbnail')&.text
          
          # バージョンIDがあれば、バージョン詳細ページから追加情報を取得
          if version_id.present?
            Rails.logger.info "Fetching additional details for version ID: #{version_id}"
            version_details = get_version_details(version_id)
            
            if version_details
              # バージョン詳細から取得した情報で上書き（nilでない場合のみ）
              version_name = version_details[:name] if version_details[:name].present?
              publisher = version_details[:publisher] if version_details[:publisher].present?
              release_date = version_details[:release_date] if version_details[:release_date].present?
              image_url = version_details[:image_url] if version_details[:image_url].present?
              
              Rails.logger.info "Updated version info from details page: name=#{version_name}, publisher=#{publisher}"
            end
          end
          
          # 最終的な日本語名が実際に日本語文字を含むか確認
          if version_name && !version_name.match?(/[\p{Hiragana}\p{Katakana}\p{Han}]/)
            Rails.logger.info "Final version name does not contain Japanese characters, setting to nil: #{version_name}"
            version_name = nil
          end
          
          return {
            name: version_name,
            publisher: publisher,
            release_date: release_date,
            image_url: image_url
          }
        end
      end
    rescue => e
      Rails.logger.error "Error fetching Japanese version info for BGG ID #{bgg_id}: #{e.message}"
    end
    
    nil
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
      
      # ギャラリーページを取得
      gallery_url = "https://boardgamegeek.com#{gallery_link['href']}"
      gallery_response = HTTParty.get(gallery_url)
      return nil unless gallery_response.success?
      
      # ギャラリーページから最初の画像を抽出
      gallery_html = Nokogiri::HTML(gallery_response.body)
      image_link = gallery_html.at_css('.gallery-item a')
      return nil unless image_link
      
      # 画像詳細ページを取得
      image_url = "https://boardgamegeek.com#{image_link['href']}"
      image_response = HTTParty.get(image_url)
      return nil unless image_response.success?
      
      # 画像詳細ページから実際の画像URLを抽出
      image_html = Nokogiri::HTML(image_response.body)
      actual_image = image_html.at_css('.img-responsive')
      return nil unless actual_image
      
      return actual_image['src']
    rescue => e
      Rails.logger.error "Error searching version image by ID #{version_id}: #{e.message}"
      return nil
    end
  end
  
  # バージョンIDを使って詳細情報を取得する新しいメソッド
  def self.get_version_details(version_id)
    begin
      # バージョン詳細ページのHTMLを直接取得
      version_url = "https://boardgamegeek.com/boardgameversion/#{version_id}"
      response = HTTParty.get(version_url)
      return nil unless response.success?
      
      # HTMLからバージョン情報を抽出
      html = Nokogiri::HTML(response.body)
      
      # 日本語名を取得（ページタイトルから）
      title_element = html.at_css('title')
      japanese_name = nil
      
      if title_element
        title_text = title_element.text
        # タイトルから日本語名を抽出（例: "マイシティ | Board Game Version | BoardGameGeek"）
        title_match = title_text.match(/^([^\|]+)/)
        if title_match && title_match[1]
          potential_name = title_match[1].strip
          # 実際に日本語文字を含むか確認
          if potential_name.match?(/[\p{Hiragana}\p{Katakana}\p{Han}]/)
            japanese_name = potential_name
            Rails.logger.info "Found Japanese name from version page title: #{japanese_name}"
          end
        end
      end
      
      # 出版社情報を取得
      publisher_element = html.css('.game-header-linked-items a').find { |a| a['href'].include?('boardgamepublisher') }
      publisher = publisher_element ? publisher_element.text.strip : nil
      
      # 発売日を取得
      release_date = nil
      html.css('.game-header-body .gameplay-item').each do |item|
        if item.text.include?('Published')
          date_text = item.text.gsub('Published', '').strip
          # 年だけの場合は1月1日を追加
          if date_text.match?(/^\d{4}$/)
            release_date = "#{date_text}-01-01"
          else
            # 日付形式を解析して標準形式に変換
            begin
              date_obj = Date.parse(date_text)
              release_date = date_obj.strftime('%Y-%m-%d')
            rescue
              # 解析できない場合は年だけ抽出
              year_match = date_text.match(/\b(\d{4})\b/)
              release_date = year_match ? "#{year_match[1]}-01-01" : nil
            end
          end
          break
        end
      end
      
      # 画像URLを取得
      image_url = search_version_image_by_id(version_id)
      
      return {
        name: japanese_name,
        publisher: publisher,
        release_date: release_date,
        image_url: image_url
      }
    rescue => e
      Rails.logger.error "Error getting version details for version ID #{version_id}: #{e.message}"
      return nil
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