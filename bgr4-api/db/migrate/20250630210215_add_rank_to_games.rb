class AddRankToGames < ActiveRecord::Migration[8.0]
  def change
    add_column :games, :rank, :integer
  end
end
