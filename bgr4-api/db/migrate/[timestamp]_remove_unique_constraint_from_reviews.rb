class RemoveUniqueConstraintFromReviews < ActiveRecord::Migration[7.0]
  def change
    remove_index :reviews, [:user_id, :game_id]
    add_index :reviews, [:user_id, :game_id]
  end
end 