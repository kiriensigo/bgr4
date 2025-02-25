class AddWeightToGames < ActiveRecord::Migration[7.0]
  def change
    add_column :games, :weight, :decimal, precision: 5, scale: 4
  end
end 