class AddPopularFeaturesToGames < ActiveRecord::Migration[8.0]
  def change
    add_column :games, :popular_tags, :string, array: true, default: []
    add_column :games, :popular_mechanics, :string, array: true, default: []
    add_column :games, :site_recommended_players, :string, array: true, default: []
    
    # 配列カラムに対するGINインデックスを追加して検索を高速化
    add_index :games, :popular_tags, using: 'gin'
    add_index :games, :popular_mechanics, using: 'gin'
    add_index :games, :site_recommended_players, using: 'gin'
  end
end 