class AddArtistsToGames < ActiveRecord::Migration[7.0]
  def change
    add_column :games, :artists, :string, array: true, default: []
  end
end
