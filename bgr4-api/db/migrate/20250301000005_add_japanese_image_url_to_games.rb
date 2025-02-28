class AddJapaneseImageUrlToGames < ActiveRecord::Migration[8.0]
  def change
    add_column :games, :japanese_image_url, :string
  end
end
