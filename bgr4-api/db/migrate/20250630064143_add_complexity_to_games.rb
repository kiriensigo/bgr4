class AddComplexityToGames < ActiveRecord::Migration[7.0]
  def change
    add_column :games, :complexity, :decimal, precision: 5, scale: 2
  end
end
