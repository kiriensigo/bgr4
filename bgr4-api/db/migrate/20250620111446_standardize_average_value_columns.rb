class StandardizeAverageValueColumns < ActiveRecord::Migration[8.0]
  def change
    # Define columns to be managed
    value_columns = [
      :average_score_value,
      :average_rule_complexity_value,
      :average_interaction_value,
      :average_downtime_value,
      :average_luck_factor_value
    ]
    
    old_columns = [
      :average_complexity,
      :average_interaction,
      :average_downtime,
      :average_luck_factor
    ]

    # Remove old and potentially inconsistent columns if they exist
    # Note: add a safety check for the table's existence for CI/CD environments
    if table_exists?(:games)
      (value_columns + old_columns).each do |col|
        if column_exists?(:games, col)
          remove_column :games, col
        end
      end

      # Re-add the value columns cleanly
      value_columns.each do |col|
        add_column :games, col, :float
      end
      
      # Also fix the bgg_score vs average_score issue once and for all.
      # The schema dump showed bgg_score exists and average_score does not.
      # Let's ensure this state is correct.
      if column_exists?(:games, :average_score) && !column_exists?(:games, :bgg_score)
          rename_column :games, :average_score, :bgg_score
      end
    end
  end
end
