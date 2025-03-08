class CreateUnmappedBggItems < ActiveRecord::Migration[8.0]
  def change
    create_table :unmapped_bgg_items do |t|
      t.string :bgg_type, null: false
      t.string :bgg_name, null: false
      t.integer :occurrence_count, default: 0

      t.timestamps
    end
    
    add_index :unmapped_bgg_items, [:bgg_type, :bgg_name], unique: true
    add_index :unmapped_bgg_items, :occurrence_count
  end
end
