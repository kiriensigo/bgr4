class AddMetadataToGames < ActiveRecord::Migration[8.0]
  def change
    add_column :games, :metadata, :json
  end
end
