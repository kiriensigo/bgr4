  def self.parse_game_item(item)
    bgg_id = item['id']
    
    Rails.logger.info "=== parse_game_item開始 ==="
    Rails.logger.info "BGG ID: #{bgg_id}"
    
    # 名前の取得
    name = nil
    primary_name = nil
    
    # すべての名前を取得してログに出力
    Rails.logger.info "Processing game with BGG ID: #{bgg_id}"
    Rails.logger.info "Raw item XML length: #{item.to_xml.length} characters"
    
    # すべての名前を取得
    item.xpath('.//name').each do |name_node|
      name_value = name_node['value']
      name_type = name_node['type']
      Rails.logger.info "Found name node: #{name_node.inspect}"
      Rails.logger.info "Found name: #{name_value} (type: #{name_type})"
      
      # プライマリ名を保存
      if name_type == 'primary'
        primary_name = name_value
        Rails.logger.info "Found primary name: #{name_value}"
      end
    end
    
    # プライマリ名があればそれを使用
    if primary_name.present?
      name = primary_name
      Rails.logger.info "Using primary name: #{name}"
    else
      # プライマリ名がない場合は最初の名前を使用
      first_name = item.at_xpath('.//name')
      if first_name
        name = first_name['value']
        Rails.logger.info "Using first name: #{name}"
      end
    end
    
    return nil unless name.present?
    Rails.logger.info "Final name: #{name}"
    
    # 日本語名の取得
    japanese_name = nil
    japanese_name_with_kana = nil
    
    # デバッグ用に全ての名前を記録
    all_names = []
    item.xpath('.//name').each do |name_node|
      name_value = name_node['value']
      name_type = name_node['type']
      all_names << { value: name_value, type: name_type }
      
      # ひらがなまたはカタカナを含む場合は最優先
      if name_value.match?(/[\p{Hiragana}\p{Katakana}]/)
        japanese_name_with_kana = name_value
        Rails.logger.info "Found Japanese name with kana: #{name_value}"
        break
      # 漢字のみの場合は候補として保存
      elsif name_value.match?(/\p{Han}/) && !japanese_name
        japanese_name = name_value
        Rails.logger.info "Found Japanese name with kanji only: #{name_value}"
      end
    end
    
    Rails.logger.info "All names: #{all_names.inspect}"
    Rails.logger.info "Japanese name with kana: #{japanese_name_with_kana}"
    Rails.logger.info "Japanese name: #{japanese_name}"
    
    # 最終的な日本語名を決定
    final_japanese_name = japanese_name_with_kana || japanese_name
    Rails.logger.info "Final Japanese name: #{final_japanese_name}"
    
    # 説明の取得
    description = item.at_xpath('.//description')&.content&.strip
    
    # 画像URLの取得
    image_url = item.at_xpath('.//image')&.content&.strip
    thumbnail_url = item.at_xpath('.//thumbnail')&.content&.strip
    final_image_url = image_url.present? ? image_url : thumbnail_url
    
    # プレイ人数の取得
    min_players = item.at_xpath('.//minplayers')&.attr('value')&.to_i || 0
    max_players = item.at_xpath('.//maxplayers')&.attr('value')&.to_i || 0
    
    # プレイ時間の取得
    min_play_time = item.at_xpath('.//minplaytime')&.attr('value')&.to_i || 0
    max_play_time = item.at_xpath('.//maxplaytime')&.attr('value')&.to_i || 0
    play_time = max_play_time > 0 ? max_play_time : min_play_time
    
    # 平均スコアの取得
    average_score = item.at_xpath('.//statistics/ratings/average')&.attr('value')&.to_f
    
    # 重さの取得
    weight = item.at_xpath('.//statistics/ratings/averageweight')&.attr('value')&.to_f
    
    # 出版社の取得
    publisher = nil
    publisher_node = item.at_xpath('.//link[@type="boardgamepublisher"]')
    if publisher_node
      publisher = publisher_node['value']
    end
    
    # デザイナーの取得
    designer = nil
    designer_node = item.at_xpath('.//link[@type="boardgamedesigner"]')
    if designer_node
      designer = designer_node['value']
    end
    
    # 発売年の取得
    release_date = nil
    year_published = item.at_xpath('.//yearpublished')&.attr('value')
    if year_published.present?
      release_date = Date.new(year_published.to_i, 1, 1)
    end
    
    # 拡張の取得
    expansions = []
    item.xpath('.//link[@type="boardgameexpansion"]').each do |expansion|
      expansions << {
        id: expansion['id'],
        name: expansion['value']
      }
    end
    
    # カテゴリの取得
    categories = []
    item.xpath('.//link[@type="boardgamecategory"]').each do |category|
      categories << category['value']
    end
    
    # メカニクスの取得
    mechanics = []
    item.xpath('.//link[@type="boardgamemechanic"]').each do |mechanic|
      mechanics << mechanic['value']
    end
    
    Rails.logger.info "プレイ人数処理開始..."
    
    # 推奨プレイ人数の取得（BestとRecommendedを統合）
    best_num_players = []
    recommended_num_players = []
    
    # 投票情報の取得
    poll_results = item.xpath('.//poll[@name="suggested_numplayers"]/results')
    Rails.logger.info "プレイ人数投票結果の数: #{poll_results.size}"
    
    poll_results.each_with_index do |result, index|
      num_players = result['numplayers']
      Rails.logger.info "処理中: #{num_players}人 (#{index + 1}/#{poll_results.size})"
      
      votes = result.xpath('.//result')
      Rails.logger.info "投票オプション数: #{votes.size}"
      
      best_votes = 0
      recommended_votes = 0
      not_recommended_votes = 0
      
      votes.each do |vote|
        vote_value = vote['value']
        vote_count = vote['numvotes'].to_i
        Rails.logger.info "  #{vote_value}: #{vote_count}票"
        
        case vote_value
        when 'Best'
          best_votes = vote_count
        when 'Recommended'
          recommended_votes = vote_count
        when 'Not Recommended'
          not_recommended_votes = vote_count
        end
      end
      
      total_votes = best_votes + recommended_votes + not_recommended_votes
      Rails.logger.info "  合計: #{total_votes}票"
      
      if total_votes > 0
        # Bestの割合が一定以上の場合（30%以上など、一般的なBGGの基準）
        best_percentage = (best_votes.to_f / total_votes * 100)
        if best_percentage >= 30.0
          best_num_players << num_players
          Rails.logger.info "  → Best判定: #{num_players}人 (#{best_percentage.round(1)}%)"
        end
        
        # Best + Recommendedの合計がNot Recommendedより多い場合は推奨とする
        if (best_votes + recommended_votes) > not_recommended_votes
          recommended_num_players << num_players
          Rails.logger.info "  → Recommended判定: #{num_players}人"
        end
      end
    end
    
    Rails.logger.info "最終Best Players: #{best_num_players}"
    Rails.logger.info "最終Recommended Players: #{recommended_num_players}"
    
    # 結果を返す
    {
      bgg_id: bgg_id,
      name: name,
      japanese_name: final_japanese_name,
      description: description,
      image_url: final_image_url,
      min_players: min_players,
      max_players: max_players,
      play_time: play_time,
      min_play_time: min_play_time,
      average_score: average_score,
      weight: weight,
      publisher: publisher,
      designer: designer,
      release_date: release_date,
      expansions: expansions,
      best_num_players: best_num_players,
      recommended_num_players: recommended_num_players,
      categories: categories,
      mechanics: mechanics
    }
  end 