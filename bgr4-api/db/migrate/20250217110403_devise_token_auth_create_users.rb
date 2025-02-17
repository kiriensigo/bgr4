class DeviseTokenAuthCreateUsers < ActiveRecord::Migration[8.0]
  def change
    change_table(:users) do |t|
      ## Tokens
      t.json :tokens unless column_exists?(:users, :tokens)

      ## Trackable
      unless column_exists?(:users, :sign_in_count)
        t.integer  :sign_in_count, default: 0, null: false
        t.datetime :current_sign_in_at
        t.datetime :last_sign_in_at
        t.string   :current_sign_in_ip
        t.string   :last_sign_in_ip
      end
    end

    add_index :users, [:uid, :provider], unique: true unless index_exists?(:users, [:uid, :provider])
  end
end
