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

ActiveRecord::Schema[8.0].define(version: 2025_05_28_125048) do
  create_schema "crdb_internal"

  create_table "game_edit_histories", id: :bigint, default: -> { "unique_rowid()" }, force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "game_id", null: false
    t.string "action"
    t.text "details"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["game_id"], name: "index_game_edit_histories_on_game_id"
    t.index ["user_id"], name: "index_game_edit_histories_on_user_id"
  end

  create_table "game_expansions", id: :bigint, default: -> { "unique_rowid()" }, force: :cascade do |t|
    t.string "base_game_id"
    t.string "expansion_id"
    t.string "relationship_type"
    t.bigint "position"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["base_game_id"], name: "index_game_expansions_on_base_game_id"
    t.index ["expansion_id"], name: "index_game_expansions_on_expansion_id"
    t.unique_constraint ["base_game_id", "expansion_id"], name: "index_game_expansions_on_base_game_id_and_expansion_id"
  end

  create_table "games", id: :bigint, default: -> { "unique_rowid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.text "description"
    t.string "image_url"
    t.bigint "min_players"
    t.bigint "max_players"
    t.bigint "play_time"
    t.decimal "average_score", precision: 3, scale: 1
    t.string "bgg_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "japanese_name"
    t.decimal "weight", precision: 5, scale: 4
    t.string "best_num_players", default: [], array: true
    t.string "recommended_num_players", default: [], array: true
    t.string "popular_categories", default: [], array: true
    t.string "popular_mechanics", default: [], array: true
    t.string "site_recommended_players", default: [], array: true
    t.text "japanese_description"
    t.string "publisher"
    t.string "designer"
    t.date "release_date"
    t.date "japanese_release_date"
    t.string "japanese_image_url"
    t.bigint "min_play_time"
    t.jsonb "metadata"
    t.string "japanese_publisher"
    t.jsonb "categories"
    t.jsonb "mechanics"
    t.boolean "registered_on_site", default: false
    t.float "average_complexity"
    t.float "average_interaction"
    t.float "average_downtime"
    t.float "average_luck_factor"
    t.index ["average_score", "id"], name: "index_games_on_average_score_and_id"
    t.index ["created_at"], name: "index_games_on_created_at"
    t.index ["japanese_name"], name: "index_games_on_japanese_name"
    t.index ["name"], name: "index_games_on_name"
    t.index ["popular_categories"], name: "index_games_on_popular_categories", using: :gin
    t.index ["popular_mechanics"], name: "index_games_on_popular_mechanics", using: :gin
    t.index ["site_recommended_players"], name: "index_games_on_site_recommended_players", using: :gin
    t.unique_constraint ["bgg_id"], name: "index_games_on_bgg_id"
  end

  create_table "japanese_publishers", id: :bigint, default: -> { "unique_rowid()" }, force: :cascade do |t|
    t.bigint "bgg_id"
    t.string "publisher_name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false

    t.unique_constraint ["bgg_id"], name: "index_japanese_publishers_on_bgg_id"
  end

  create_table "likes", id: :bigint, default: -> { "unique_rowid()" }, force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "review_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["review_id"], name: "index_likes_on_review_id"
    t.index ["user_id"], name: "index_likes_on_user_id"
  end

  create_table "reviews", id: :bigint, default: -> { "unique_rowid()" }, force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "game_id", null: false
    t.decimal "overall_score", precision: 3, scale: 1, null: false
    t.decimal "rule_complexity", precision: 2, scale: 1
    t.decimal "luck_factor", precision: 2, scale: 1
    t.decimal "interaction", precision: 2, scale: 1
    t.decimal "downtime", precision: 2, scale: 1
    t.string "recommended_players", default: [], array: true
    t.string "mechanics", default: [], array: true
    t.string "categories", default: [], array: true
    t.string "custom_tags", default: [], array: true
    t.text "short_comment"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["game_id", "created_at"], name: "index_reviews_on_game_id_and_created_at"
    t.index ["game_id", "overall_score"], name: "index_reviews_on_game_id_and_overall_score"
    t.index ["game_id", "user_id"], name: "index_reviews_on_game_id_and_user_id"
    t.index ["game_id"], name: "index_reviews_on_game_id"
    t.index ["user_id", "created_at"], name: "index_reviews_on_user_id_and_created_at"
    t.index ["user_id", "game_id"], name: "index_reviews_on_user_id_and_game_id"
    t.index ["user_id"], name: "index_reviews_on_user_id"
  end

  create_table "solid_cache_entries", primary_key: "key", id: { type: :string, limit: 1024 }, force: :cascade do |t|
    t.binary "value"
    t.datetime "created_at", null: false
    t.bigint "key_hash"
    t.bigint "byte_size"
    t.index ["byte_size"], name: "index_solid_cache_entries_on_byte_size"
    t.index ["created_at"], name: "index_solid_cache_entries_on_created_at"
    t.index ["key_hash"], name: "index_solid_cache_entries_on_key_hash"
  end

  create_table "solid_queue_blocked_executions", id: :bigint, default: -> { "unique_rowid()" }, force: :cascade do |t|
    t.bigint "job_id", null: false
    t.string "queue_name", null: false
    t.bigint "priority", default: 0, null: false
    t.string "concurrency_key", null: false
    t.datetime "expires_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["expires_at", "concurrency_key"], name: "idx_on_expires_at_concurrency_key_c20fd0827b"
    t.unique_constraint ["job_id"], name: "index_solid_queue_blocked_executions_on_job_id"
  end

  create_table "solid_queue_claimed_executions", id: :bigint, default: -> { "unique_rowid()" }, force: :cascade do |t|
    t.bigint "job_id", null: false
    t.bigint "process_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["process_id", "job_id"], name: "index_solid_queue_claimed_executions_on_process_id_and_job_id"
    t.unique_constraint ["job_id"], name: "index_solid_queue_claimed_executions_on_job_id"
  end

  create_table "solid_queue_failed_executions", id: :bigint, default: -> { "unique_rowid()" }, force: :cascade do |t|
    t.bigint "job_id", null: false
    t.text "error"
    t.datetime "failed_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["failed_at", "job_id"], name: "index_solid_queue_failed_executions_on_failed_at_and_job_id"
    t.unique_constraint ["job_id"], name: "index_solid_queue_failed_executions_on_job_id"
  end

  create_table "solid_queue_jobs", id: :bigint, default: -> { "unique_rowid()" }, force: :cascade do |t|
    t.string "queue_name", null: false
    t.string "class_name", null: false
    t.text "arguments"
    t.bigint "priority", default: 0, null: false
    t.string "active_job_id"
    t.datetime "scheduled_at"
    t.datetime "finished_at"
    t.string "concurrency_key"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["active_job_id", "queue_name"], name: "index_solid_queue_jobs_on_active_job_id_and_queue_name"
    t.index ["class_name", "finished_at"], name: "index_solid_queue_jobs_on_class_name_and_finished_at"
    t.index ["finished_at"], name: "index_solid_queue_jobs_on_finished_at"
    t.index ["queue_name", "finished_at"], name: "index_solid_queue_jobs_on_queue_name_and_finished_at"
    t.index ["queue_name"], name: "index_solid_queue_jobs_on_queue_name"
    t.index ["scheduled_at", "finished_at"], name: "index_solid_queue_jobs_on_scheduled_at_and_finished_at"
    t.index ["scheduled_at"], name: "index_solid_queue_jobs_on_scheduled_at"
    t.unique_constraint ["active_job_id"], name: "index_solid_queue_jobs_on_active_job_id"
  end

  create_table "solid_queue_pauses", id: :bigint, default: -> { "unique_rowid()" }, force: :cascade do |t|
    t.string "queue_name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false

    t.unique_constraint ["queue_name"], name: "index_solid_queue_pauses_on_queue_name"
  end

  create_table "solid_queue_processes", id: :bigint, default: -> { "unique_rowid()" }, force: :cascade do |t|
    t.string "kind", null: false
    t.datetime "last_heartbeat_at", null: false
    t.bigint "supervisor_id"
    t.bigint "pid", null: false
    t.string "hostname"
    t.text "metadata"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["last_heartbeat_at"], name: "index_solid_queue_processes_on_last_heartbeat_at"
    t.index ["supervisor_id"], name: "index_solid_queue_processes_on_supervisor_id"
  end

  create_table "solid_queue_ready_executions", id: :bigint, default: -> { "unique_rowid()" }, force: :cascade do |t|
    t.bigint "job_id", null: false
    t.string "queue_name", null: false
    t.bigint "priority", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["priority", "job_id"], name: "index_solid_queue_ready_executions_for_polling"
    t.unique_constraint ["job_id"], name: "index_solid_queue_ready_executions_on_job_id"
  end

  create_table "solid_queue_scheduled_executions", id: :bigint, default: -> { "unique_rowid()" }, force: :cascade do |t|
    t.bigint "job_id", null: false
    t.string "queue_name", null: false
    t.bigint "priority", default: 0, null: false
    t.datetime "scheduled_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["scheduled_at", "priority", "job_id"], name: "index_solid_queue_scheduled_executions_for_polling"
    t.unique_constraint ["job_id"], name: "index_solid_queue_scheduled_executions_on_job_id"
  end

  create_table "solid_queue_semaphores", id: :bigint, default: -> { "unique_rowid()" }, force: :cascade do |t|
    t.string "key", null: false
    t.bigint "value", default: 1, null: false
    t.datetime "expires_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["expires_at"], name: "index_solid_queue_semaphores_on_expires_at"
    t.check_constraint "(value >= 0)", name: "chk_solid_queue_semaphores_on_value"
    t.unique_constraint ["key"], name: "index_solid_queue_semaphores_on_key"
  end

  create_table "unmapped_bgg_items", id: :bigint, default: -> { "unique_rowid()" }, force: :cascade do |t|
    t.string "bgg_type", null: false
    t.string "bgg_name", null: false
    t.bigint "occurrence_count", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["occurrence_count"], name: "index_unmapped_bgg_items_on_occurrence_count"
    t.unique_constraint ["bgg_type", "bgg_name"], name: "index_unmapped_bgg_items_on_bgg_type_and_bgg_name"
  end

  create_table "users", id: :bigint, default: -> { "unique_rowid()" }, force: :cascade do |t|
    t.string "email", limit: 255, default: "", null: false
    t.string "encrypted_password", limit: 255, default: "", null: false
    t.string "name", limit: 255
    t.string "image", limit: 255
    t.string "provider", limit: 255
    t.string "uid", limit: 255
    t.string "avatar_url", limit: 255
    t.text "bio"
    t.boolean "is_admin", default: false
    t.jsonb "tokens"
    t.bigint "sign_in_count", default: 0, null: false
    t.datetime "current_sign_in_at", precision: nil
    t.datetime "last_sign_in_at", precision: nil
    t.string "current_sign_in_ip", limit: 255
    t.string "last_sign_in_ip", limit: 255
    t.string "confirmation_token", limit: 255
    t.datetime "confirmed_at", precision: nil
    t.datetime "confirmation_sent_at", precision: nil
    t.string "unconfirmed_email", limit: 255
    t.string "reset_password_token", limit: 255
    t.datetime "reset_password_sent_at", precision: nil
    t.datetime "remember_created_at", precision: nil
    t.datetime "created_at", precision: nil, default: -> { "now()" }, null: false
    t.datetime "updated_at", precision: nil, default: -> { "now()" }, null: false

    t.unique_constraint ["confirmation_token"], name: "index_users_on_confirmation_token"
    t.unique_constraint ["email"], name: "index_users_on_email"
    t.unique_constraint ["reset_password_token"], name: "index_users_on_reset_password_token"
    t.unique_constraint ["uid", "provider"], name: "index_users_on_uid_and_provider"
  end

  create_table "wishlist_items", id: :bigint, default: -> { "unique_rowid()" }, force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "game", null: false
    t.bigint "position"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "position"], name: "index_wishlist_items_on_user_id_and_position"
    t.index ["user_id"], name: "index_wishlist_items_on_user_id"
    t.unique_constraint ["user_id", "game"], name: "index_wishlist_items_on_user_id_and_game"
  end

  add_foreign_key "game_edit_histories", "games"
  add_foreign_key "likes", "reviews"
  add_foreign_key "solid_queue_blocked_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_claimed_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_failed_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_ready_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_scheduled_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
end
