class RenamePopularTagsToPopularCategories < ActiveRecord::Migration[8.0]
  def change
    # popular_tagsカラムをpopular_categoriesカラムにリネーム
    rename_column :games, :popular_tags, :popular_categories
  end
end
