class CreateReviews < ActiveRecord::Migration[7.0]
  def change
    create_table :reviews do |t|
      t.references :user, null: false, foreign_key: true
      t.string :game_id, null: false
      
      # 評価項目（スライダー）
      t.decimal :overall_score, precision: 3, scale: 1, null: false
      t.integer :play_time, null: false
      t.decimal :rule_complexity, precision: 2, scale: 1, null: false
      t.decimal :luck_factor, precision: 2, scale: 1, null: false
      t.decimal :interaction, precision: 2, scale: 1, null: false
      t.decimal :downtime, precision: 2, scale: 1, null: false
      
      # 配列型のカラム
      t.string :recommended_players, array: true, default: []
      t.string :mechanics, array: true, default: []
      t.string :tags, array: true, default: []
      t.string :custom_tags, array: true, default: []
      
      # コメント
      t.text :short_comment, null: false

      t.timestamps
    end

    add_index :reviews, [:user_id, :game_id]
    add_index :reviews, :game_id
  end
end 