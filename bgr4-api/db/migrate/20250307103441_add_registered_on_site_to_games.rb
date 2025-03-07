class AddRegisteredOnSiteToGames < ActiveRecord::Migration[8.0]
  def change
    add_column :games, :registered_on_site, :boolean, default: false
    
    # 既存のレコードをtrueに設定
    reversible do |dir|
      dir.up do
        execute <<-SQL
          UPDATE games SET registered_on_site = true WHERE id IS NOT NULL;
        SQL
      end
    end
  end
end
