class RenameAverageWeightToAverageComplexityAndAddAverageLuckFactor < ActiveRecord::Migration[8.0]
  def change
    # average_weightカラムをaverage_complexityに名前変更
    rename_column :games, :average_weight, :average_complexity
    
    # average_luck_factorカラムを追加
    add_column :games, :average_luck_factor, :float
  end
end
