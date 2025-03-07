class CreateGameExpansions < ActiveRecord::Migration[8.0]
  def change
    create_table :game_expansions do |t|
      t.string :base_game_id
      t.string :expansion_id
      t.string :relationship_type
      t.integer :position

      t.timestamps
    end
    
    add_index :game_expansions, :base_game_id
    add_index :game_expansions, :expansion_id
    add_index :game_expansions, [:base_game_id, :expansion_id], unique: true
  end
end
