class AddAverageScoreValueAndRenameAverageScoreToGames < ActiveRecord::Migration[8.0]
  def change
    add_column :games, :average_score_value, :float
    rename_column :games, :average_score, :bgg_score
  end
end
