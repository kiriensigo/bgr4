class AddMinAgeToGames < ActiveRecord::Migration[8.0]
  def change
    add_column :games, :min_age, :integer
  end
end
