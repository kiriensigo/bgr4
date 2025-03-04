class AddCategoriesAndMechanicsToGames < ActiveRecord::Migration[8.0]
  def change
    add_column :games, :categories, :json
    add_column :games, :mechanics, :json
  end
end
