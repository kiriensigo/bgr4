class AddUserReviewsCountToGames < ActiveRecord::Migration[8.0]
  def change
    add_column :games, :user_reviews_count, :integer, default: 0, null: false

    # 既存のゲームのレビュー数を再計算
    Game.find_each do |game|
      Game.reset_counters(game.id, :reviews)
    end
  end
end
