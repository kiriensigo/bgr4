class RemovePlayTimeFromReviews < ActiveRecord::Migration[8.0]
  def change
    remove_column :reviews, :play_time, :integer
  end
end
