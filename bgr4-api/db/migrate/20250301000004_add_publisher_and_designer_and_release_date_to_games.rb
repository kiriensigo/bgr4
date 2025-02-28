class AddPublisherAndDesignerAndReleaseDateToGames < ActiveRecord::Migration[8.0]
  def change
    add_column :games, :publisher, :string
    add_column :games, :designer, :string
    add_column :games, :release_date, :date
    add_column :games, :japanese_release_date, :date
  end
end
