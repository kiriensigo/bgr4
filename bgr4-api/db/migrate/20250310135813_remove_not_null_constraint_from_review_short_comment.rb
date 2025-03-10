class RemoveNotNullConstraintFromReviewShortComment < ActiveRecord::Migration[8.0]
  def change
    change_column_null :reviews, :short_comment, true
  end
end
