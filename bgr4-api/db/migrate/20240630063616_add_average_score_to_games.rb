class AddAverageScoreToGames < ActiveRecord::Migration[7.0]
  def change
    # 既に存在する場合は追加しないようガードを挟む
    unless column_exists?(:games, :average_score)
      add_column :games, :average_score, :decimal, precision: 4, scale: 2
    end

    unless column_exists?(:games, :bgg_rank)
      add_column :games, :bgg_rank, :integer
    end

    add_index :games, :bgg_rank unless index_exists?(:games, :bgg_rank)
  end
end 