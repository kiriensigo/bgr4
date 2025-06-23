class UpdateGamePopularFeaturesJob < ApplicationJob
  queue_as :default

  def perform(game_id)
    game = Game.find_by(bgg_id: game_id)
    return unless game

    # システムユーザーを取得
    system_user = User.find_by(email: 'system@boardgamereview.com')
    
    # 人気タグとメカニクスの計算用にシステムユーザー以外のレビューを取得
    user_reviews = game.reviews.where.not(user: system_user)
    user_reviews_count = user_reviews.count
    
    # システムユーザーのレビューを含む全レビュー数を取得
    all_reviews = game.reviews
    total_reviews_count = all_reviews.count
    
    # レビューが全くない場合は更新しない
    return if total_reviews_count == 0

    Rails.logger.info "Updating popular features for game #{game.name} (#{game_id}) with #{user_reviews_count} user reviews and #{total_reviews_count - user_reviews_count} system reviews"

    # 1. 平均スコアの計算 - すべてのレビューから（システムユーザー含む）
    update_average_score(game)
    
    # 2. 人気カテゴリーの計算（上位6つ）- すべてのレビューから（システムユーザー含む）
    update_popular_categories(game, all_reviews)
    
    # 3. 人気メカニクスの計算（上位6つ）- すべてのレビューから（システムユーザー含む）
    update_popular_mechanics(game, all_reviews)
    
    # 4. おすすめプレイ人数の計算（50%以上の支持があるもの）- すべてのレビューから（システムユーザー含む）
    update_recommended_players(game, all_reviews, total_reviews_count)
    
    # 変更を保存
    game.save!
    
    Rails.logger.info "Updated popular features for game #{game.name} (#{game_id})"
  end

  private

  # 平均スコアの計算
  def update_average_score(game)
    # 新しいupdate_average_valuesメソッドを使用
    game.update_average_values
    
    Rails.logger.info "Updated average score for game #{game.name}: #{game.average_score_value}"
  end

  # 人気カテゴリーの計算（上位6つ）
  def update_popular_categories(game, reviews)
    # 全レビューからカテゴリーを集計
    all_categories = reviews.flat_map(&:categories) + reviews.flat_map(&:custom_tags)
    category_counts = all_categories.reject(&:blank?).group_by(&:itself).transform_values(&:count)
    
    # 登録数の多い順に上位6つのカテゴリーを抽出
    popular_categories = category_counts.sort_by { |_, count| -count }.first(6).map(&:first)
    
    # ゲームの人気カテゴリーを更新
    game.popular_categories = popular_categories
    
    Rails.logger.info "Updated popular categories for game #{game.name}: #{popular_categories.join(', ')}"
  end

  # 人気メカニクスの計算（上位6つ）
  def update_popular_mechanics(game, reviews)
    # 全レビューからメカニクスを集計
    all_mechanics = reviews.flat_map(&:mechanics)
    mechanics_counts = all_mechanics.reject(&:blank?).group_by(&:itself).transform_values(&:count)
    
    # 登録数の多い順に上位6つのメカニクスを抽出
    popular_mechanics = mechanics_counts.sort_by { |_, count| -count }.first(6).map(&:first)
    
    # ゲームの人気メカニクスを更新
    game.popular_mechanics = popular_mechanics
    
    Rails.logger.info "Updated popular mechanics for game #{game.name}: #{popular_mechanics.join(', ')}"
  end

  # おすすめプレイ人数の計算（BGG情報を考慮した重み付け計算）
  def update_recommended_players(game, reviews, total_reviews_count)
    # おすすめプレイ人数が設定されているレビューを取得
    reviews_with_players = reviews.where.not(recommended_players: nil)
    
    # 全レビューからおすすめプレイ人数を集計
    all_recommended_players = reviews_with_players.pluck(:recommended_players).flatten
    
    # 7以上を「7」に変換（既に「7」になっているものもあるため、重複に注意）
    normalized_players = all_recommended_players.map do |player|
      player_num = player.to_i
      player_num >= 7 ? "7" : player
    end
    
    # ユーザー投票数を集計
    user_player_counts = normalized_players.group_by(&:itself).transform_values(&:count)
    
    # BGGの推奨プレイ人数情報を取得（BestとRecommendedを統合）
    bgg_recommended_players = []
    if game.best_num_players.present?
      bgg_recommended_players.concat(game.best_num_players)
    end
    if game.recommended_num_players.present?
      bgg_recommended_players.concat(game.recommended_num_players)
    end
    
    # BGGの推奨人数も7以上を「7」に変換して重複削除
    bgg_normalized_players = bgg_recommended_players.map do |player|
      player_num = player.to_i
      player_num >= 7 ? "7" : player.to_s
    end.uniq
    
    # 各プレイ人数の推奨度を計算
    # 推奨度 = (ユーザー投票数 + BGG推奨フラグ×10) / (総レビュー数 + 10)
    player_scores = {}
    
    # 1〜7人の各人数について計算
    (1..7).each do |num|
      player_key = num == 7 ? "7" : num.to_s
      
      # ユーザー投票数
      user_votes = user_player_counts[player_key] || 0
      
      # BGG推奨フラグ（BestまたはRecommendedに含まれている場合は1、そうでなければ0）
      bgg_flag = bgg_normalized_players.include?(player_key) ? 1 : 0
      
      # 推奨度を計算
      score = (user_votes + bgg_flag * 10) / (total_reviews_count + 10).to_f
      
      player_scores[player_key] = score
      
      Rails.logger.debug "Player #{player_key}: user_votes=#{user_votes}, bgg_flag=#{bgg_flag}, score=#{score.round(3)}"
    end
    
    # 50%以上（0.5以上）の推奨度を持つ人数を抽出
    recommended_players = player_scores
      .select { |_, score| score >= 0.5 }
      .keys
      .sort_by { |player| player.to_i }
    
    # ゲームのおすすめプレイ人数を更新
    game.site_recommended_players = recommended_players
    
    Rails.logger.info "Updated recommended players for game #{game.name}: #{recommended_players.join(', ')} (BGG: #{bgg_normalized_players.join(', ')})"
  end
end 