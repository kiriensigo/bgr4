class AddBggIdToGames < ActiveRecord::Migration[7.0]
  def change
    add_column :games, :bgg_id, :string
    add_index :games, :bgg_id, unique: true
  end
end 