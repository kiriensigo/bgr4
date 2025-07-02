class AddMaxPlayTimeToGames < ActiveRecord::Migration[8.0]
  def change
    add_column :games, :max_play_time, :integer
  end
end
