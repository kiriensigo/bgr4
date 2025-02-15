class CreateGames < ActiveRecord::Migration[7.0]
  def change
    create_table :games do |t|
      t.string :name, null: false
      t.text :description
      t.string :image_url
      t.integer :min_players
      t.integer :max_players
      t.integer :play_time
      t.decimal :average_score, precision: 3, scale: 1
      t.string :bgg_id, null: false

      t.timestamps
    end

    add_index :games, :bgg_id, unique: true
  end
end 