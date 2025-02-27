class CreateGameEditHistories < ActiveRecord::Migration[8.0]
  def change
    create_table :game_edit_histories do |t|
      t.references :user, null: false, foreign_key: true
      t.references :game, null: false, foreign_key: true
      t.string :action
      t.text :details

      t.timestamps
    end
  end
end
