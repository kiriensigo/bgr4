class CreateJapanesePublishers < ActiveRecord::Migration[8.0]
  def change
    create_table :japanese_publishers do |t|
      t.integer :bgg_id
      t.string :publisher_name

      t.timestamps
    end
    
    add_index :japanese_publishers, :bgg_id, unique: true
  end
end
