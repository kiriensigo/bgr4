class AddPlayerCountsToGames < ActiveRecord::Migration[7.0]
  def change
    add_column :games, :best_num_players, :string, array: true, default: []
    add_column :games, :recommended_num_players, :string, array: true, default: []
  end
end 