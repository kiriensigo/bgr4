class AddDesignersToGames < ActiveRecord::Migration[7.0]
  def change
    add_column :games, :designers, :string, array: true, default: []
  end
end
