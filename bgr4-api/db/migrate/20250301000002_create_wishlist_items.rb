class CreateWishlistItems < ActiveRecord::Migration[8.0]
  def change
    create_table :wishlist_items do |t|
      t.references :user, null: false, foreign_key: true
      t.string :game, null: false
      t.integer :position

      t.timestamps
    end
    
    # ユーザーとゲームの組み合わせでユニーク制約を追加
    add_index :wishlist_items, [:user_id, :game], unique: true
    # positionでソートするためのインデックスを追加
    add_index :wishlist_items, [:user_id, :position]
  end
end
