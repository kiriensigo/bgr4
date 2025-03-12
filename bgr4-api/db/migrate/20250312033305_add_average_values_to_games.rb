class AddAverageValuesToGames < ActiveRecord::Migration[8.0]
  def change
    add_column :games, :average_weight, :float
    add_column :games, :average_interaction, :float
    add_column :games, :average_downtime, :float
  end
end
