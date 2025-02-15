class CreateGames < ActiveRecord::Migration[8.0]
  def change
    create_table :games do |t|
      t.string :name, null: false
      t.text :description
      t.string :image_url
      t.integer :min_players
      t.integer :max_players
      t.integer :play_time
      t.decimal :average_score, precision: 3, scale: 1

      t.timestamps
    end
  end
end 