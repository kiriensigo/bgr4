class AllowNullInReviewColumns < ActiveRecord::Migration[7.0]
  def change
    change_column_null :reviews, :rule_complexity, true
    change_column_null :reviews, :luck_factor, true
    change_column_null :reviews, :interaction, true
    change_column_null :reviews, :downtime, true
    change_column_null :reviews, :play_time, true
  end
end 