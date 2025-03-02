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
    
    # ユーザーレビューがない場合は更新しない
    return if user_reviews_count == 0

    Rails.logger.info "Updating popular features for game #{game.name} (#{game_id}) with #{user_reviews_count} user reviews"

    # 1. 平均スコアの計算 - すべてのレビューから（システムユーザー含む）
    update_average_score(game)
    
    # 2. 人気タグの計算（上位6つ）- すべてのレビューから（システムユーザー含む）
    update_popular_tags(game, game.reviews)
    
    # 3. 人気メカニクスの計算（上位6つ）- すべてのレビューから（システムユーザー含む）
    update_popular_mechanics(game, game.reviews)
    
    # 4. おすすめプレイ人数の計算（50%以上の支持があるもの）- すべてのレビューから（システムユーザー含む）
    all_reviews = game.reviews
    total_reviews_count = all_reviews.count
    update_recommended_players(game, all_reviews, total_reviews_count)
    
    # 変更を保存
    game.save!
    
    Rails.logger.info "Updated popular features for game #{game.name} (#{game_id})"
  end

  private

  # 平均スコアの計算
  def update_average_score(game)
    # レビューの平均スコアを計算（nilの値は除外）
    average = game.reviews.where.not(overall_score: nil).average(:overall_score)&.round(1)
    
    # ゲームの平均スコアを更新
    game.average_score = average
    
    Rails.logger.info "Updated average score for game #{game.name}: #{average}"
  end

  # 人気タグの計算（上位6つ）
  def update_popular_tags(game, reviews)
    # 全レビューからタグを集計
    all_tags = reviews.flat_map(&:tags) + reviews.flat_map(&:custom_tags)
    tag_counts = all_tags.reject(&:blank?).group_by(&:itself).transform_values(&:count)
    
    # 登録数の多い順に上位6つのタグを抽出
    popular_tags = tag_counts.sort_by { |_, count| -count }.first(6).map(&:first)
    
    # ゲームの人気タグを更新
    game.popular_tags = popular_tags
    
    Rails.logger.info "Updated popular tags for game #{game.name}: #{popular_tags.join(', ')}"
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

  # おすすめプレイ人数の計算（50%以上の支持があるもの）
  def update_recommended_players(game, reviews, total_reviews_count)
    # おすすめプレイ人数が設定されているレビューを取得
    reviews_with_players = reviews.where.not(recommended_players: nil)
    
    # レビューがない場合は更新しない
    return if reviews_with_players.count == 0
    
    # 全レビューからおすすめプレイ人数を集計
    all_recommended_players = reviews_with_players.pluck(:recommended_players).flatten
    player_counts = all_recommended_players.group_by(&:itself).transform_values(&:count)
    
    # 50%以上選択された人数を抽出
    threshold = total_reviews_count * 0.5
    recommended_players = player_counts
      .select { |_, count| count >= threshold }
      .keys
      .sort_by { |player| player.to_i }
    
    # ゲームのおすすめプレイ人数を更新
    game.site_recommended_players = recommended_players
    
    Rails.logger.info "Updated recommended players for game #{game.name} (including system reviews): #{recommended_players.join(', ')}"
  end
end 