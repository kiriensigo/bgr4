# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2025_02_15_182826) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "games", force: :cascade do |t|
    t.string "name", null: false
    t.text "description"
    t.string "image_url"
    t.integer "min_players"
    t.integer "max_players"
    t.integer "play_time"
    t.decimal "average_score", precision: 3, scale: 1
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "reviews", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "game_id", null: false
    t.decimal "overall_score", precision: 3, scale: 1, null: false
    t.integer "play_time", null: false
    t.decimal "rule_complexity", precision: 2, scale: 1, null: false
    t.decimal "luck_factor", precision: 2, scale: 1, null: false
    t.decimal "interaction", precision: 2, scale: 1, null: false
    t.decimal "downtime", precision: 2, scale: 1, null: false
    t.string "recommended_players", default: [], array: true
    t.string "mechanics", default: [], array: true
    t.string "tags", default: [], array: true
    t.string "custom_tags", default: [], array: true
    t.text "short_comment", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["game_id"], name: "index_reviews_on_game_id"
    t.index ["user_id", "game_id"], name: "index_reviews_on_user_id_and_game_id", unique: true
    t.index ["user_id"], name: "index_reviews_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "username"
    t.string "email"
    t.string "password_digest"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  add_foreign_key "reviews", "users"
end
