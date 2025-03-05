class RenameTagsToCategories < ActiveRecord::Migration[8.0]
  def change
    # tagsカラムをcategoriesカラムにリネーム
    rename_column :reviews, :tags, :categories
  end
end
