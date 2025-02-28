class AddMinPlayTimeToGames < ActiveRecord::Migration[8.0]
  def change
    add_column :games, :min_play_time, :integer
  end
end
