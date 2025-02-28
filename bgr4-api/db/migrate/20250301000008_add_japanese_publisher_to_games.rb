class AddJapanesePublisherToGames < ActiveRecord::Migration[8.0]
  def change
    add_column :games, :japanese_publisher, :string
  end
end
