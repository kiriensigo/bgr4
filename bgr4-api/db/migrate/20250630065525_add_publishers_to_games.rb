class AddPublishersToGames < ActiveRecord::Migration[7.0]
  def change
    add_column :games, :publishers, :string, array: true, default: []
  end
end
