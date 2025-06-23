# frozen_string_literal: true

module Bgg
  class GameParser < BaseService
    def self.parse_game_item(item)
      bgg_id = item['id']
      
      Rails.logger.info "=== GameParser: BGG ID #{bgg_id} ==="
      
      # 基本情報の解析
      basic_info = extract_basic_info(item)
      return nil unless basic_info[:name].present?
      
      # 日本語名の解析
      japanese_info = extract_japanese_info(item)
      
      # ゲーム詳細の解析
      game_details = extract_game_details(item)
      
      # プレイ人数投票の解析
      player_vote_info = extract_player_vote_info(item)
      
      # 結果をマージして返す
      {
        bgg_id: bgg_id,
        **basic_info,
        **japanese_info,
        **game_details,
        **player_vote_info
      }
    end
    
    private
    
    def self.extract_basic_info(item)
      # 名前の取得（プライマリを優先）
      primary_name = nil
      item.xpath('.//name').each do |name_node|
        if name_node['type'] == 'primary'
          primary_name = name_node['value']
          break
        end
      end
      
      name = primary_name || item.at_xpath('.//name')&.attr('value')
      
      # 説明と画像の取得
      description = item.at_xpath('.//description')&.content&.strip
      image_url = item.at_xpath('.//image')&.content&.strip
      thumbnail_url = item.at_xpath('.//thumbnail')&.content&.strip
      final_image_url = image_url.present? ? image_url : thumbnail_url
      
      {
        name: name,
        description: description,
        image_url: final_image_url
      }
    end
    
    def self.extract_japanese_info(item)
      japanese_name = nil
      japanese_name_with_kana = nil
      
      item.xpath('.//name').each do |name_node|
        name_value = name_node['value']
        
        # ひらがなまたはカタカナを含む場合は最優先
        if name_value.match?(/[\p{Hiragana}\p{Katakana}]/)
          japanese_name_with_kana = name_value
          break
        # 漢字のみの場合は候補として保存
        elsif name_value.match?(/\p{Han}/) && !japanese_name
          japanese_name = name_value
        end
      end
      
      {
        japanese_name: japanese_name_with_kana || japanese_name
      }
    end
    
    def self.extract_game_details(item)
      # プレイ人数
      min_players = item.at_xpath('.//minplayers')&.attr('value')&.to_i || 0
      max_players = item.at_xpath('.//maxplayers')&.attr('value')&.to_i || 0
      
      # プレイ時間
      min_play_time = item.at_xpath('.//minplaytime')&.attr('value')&.to_i || 0
      max_play_time = item.at_xpath('.//maxplaytime')&.attr('value')&.to_i || 0
      play_time = max_play_time > 0 ? max_play_time : min_play_time
      
      # 統計情報
      average_score = item.at_xpath('.//statistics/ratings/average')&.attr('value')&.to_f
      weight = item.at_xpath('.//statistics/ratings/averageweight')&.attr('value')&.to_f
      
      # 出版社・デザイナー
      publisher = item.at_xpath('.//link[@type="boardgamepublisher"]')&.attr('value')
      designer = item.at_xpath('.//link[@type="boardgamedesigner"]')&.attr('value')
      
      # 発売年
      release_date = nil
      year_published = item.at_xpath('.//yearpublished')&.attr('value')
      if year_published.present?
        release_date = Date.new(year_published.to_i, 1, 1)
      end
      
      # カテゴリとメカニクス
      categories = item.xpath('.//link[@type="boardgamecategory"]').map { |cat| cat['value'] }
      mechanics = item.xpath('.//link[@type="boardgamemechanic"]').map { |mech| mech['value'] }
      
      # 拡張
      expansions = item.xpath('.//link[@type="boardgameexpansion"]').map do |expansion|
        {
          id: expansion['id'],
          name: expansion['value']
        }
      end
      
      {
        min_players: min_players,
        max_players: max_players,
        play_time: play_time,
        average_score: average_score,
        weight: weight,
        publisher: publisher,
        designer: designer,
        release_date: release_date,
        categories: categories,
        mechanics: mechanics,
        expansions: expansions
      }
    end
    
    def self.extract_player_vote_info(item)
      Rails.logger.info "プレイ人数投票解析開始..."
      
      best_num_players = []
      recommended_num_players = []
      
      poll_results = item.xpath('.//poll[@name="suggested_numplayers"]/results')
      Rails.logger.info "投票結果数: #{poll_results.size}"
      
      poll_results.each do |result|
        num_players = result['numplayers']
        next if num_players.include?('+') # "4+"のような場合はスキップ
        
        votes = extract_vote_counts(result)
        total_votes = votes[:best] + votes[:recommended] + votes[:not_recommended]
        
        next if total_votes.zero?
        
        # Bestの割合判定（30%以上）
        best_percentage = (votes[:best].to_f / total_votes * 100)
        if best_percentage >= 30.0
          best_num_players << num_players
          Rails.logger.info "Best判定: #{num_players}人 (#{best_percentage.round(1)}%)"
        end
        
        # Recommended判定（Best + Recommended > Not Recommended）
        if (votes[:best] + votes[:recommended]) > votes[:not_recommended]
          recommended_num_players << num_players
          Rails.logger.info "Recommended判定: #{num_players}人"
        end
      end
      
      {
        best_num_players: best_num_players,
        recommended_num_players: recommended_num_players
      }
    end
    
    def self.extract_vote_counts(result)
      votes = { best: 0, recommended: 0, not_recommended: 0 }
      
      result.xpath('.//result').each do |vote|
        vote_value = vote['value']
        vote_count = vote['numvotes'].to_i
        
        case vote_value
        when 'Best'
          votes[:best] = vote_count
        when 'Recommended'
          votes[:recommended] = vote_count
        when 'Not Recommended'
          votes[:not_recommended] = vote_count
        end
      end
      
      votes
    end
  end
end 