class AddYearPublishedToGames < ActiveRecord::Migration[8.0]
  def change
    add_column :games, :year_published, :integer
  end
end
