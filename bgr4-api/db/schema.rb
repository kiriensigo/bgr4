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

ActiveRecord::Schema[8.0].define(version: 2025_07_06_000000) do
  create_schema "auth"
  create_schema "extensions"
  create_schema "graphql"
  create_schema "graphql_public"
  create_schema "pgbouncer"
  create_schema "realtime"
  create_schema "storage"
  create_schema "vault"

  # These are extensions that must be enabled in order to support this database
  enable_extension "extensions.pg_stat_statements"
  enable_extension "extensions.pgcrypto"
  enable_extension "extensions.uuid-ossp"
  enable_extension "graphql.pg_graphql"
  enable_extension "pg_catalog.plpgsql"
  enable_extension "vault.supabase_vault"

  create_table "game_edit_histories", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "game_id", null: false
    t.string "action"
    t.text "details"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["game_id"], name: "index_game_edit_histories_on_game_id"
    t.index ["user_id"], name: "index_game_edit_histories_on_user_id"
  end

  create_table "game_expansions", force: :cascade do |t|
    t.string "base_game_id"
    t.string "expansion_id"
    t.string "relationship_type"
    t.integer "position"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["base_game_id", "expansion_id"], name: "index_game_expansions_on_base_game_id_and_expansion_id", unique: true
    t.index ["base_game_id"], name: "index_game_expansions_on_base_game_id"
    t.index ["expansion_id"], name: "index_game_expansions_on_expansion_id"
  end

  create_table "games", force: :cascade do |t|
    t.string "name", null: false
    t.text "description"
    t.string "image_url"
    t.integer "min_players"
    t.integer "max_players"
    t.integer "play_time"
    t.decimal "bgg_score", precision: 3, scale: 1
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
    t.integer "min_play_time"
    t.json "metadata"
    t.string "japanese_publisher"
    t.json "categories"
    t.json "mechanics"
    t.boolean "registered_on_site", default: false
    t.integer "user_reviews_count", default: 0, null: false
    t.float "average_score_value"
    t.float "average_rule_complexity_value"
    t.float "average_interaction_value"
    t.float "average_downtime_value"
    t.float "average_luck_factor_value"
    t.decimal "average_score", precision: 4, scale: 2
    t.integer "bgg_rank"
    t.integer "year_published"
    t.integer "min_age"
    t.decimal "complexity", precision: 5, scale: 2
    t.string "designers", default: [], array: true
    t.string "artists", default: [], array: true
    t.string "publishers", default: [], array: true
    t.integer "max_play_time"
    t.integer "rank"
    t.decimal "average_complexity", precision: 5, scale: 2
    t.decimal "average_interaction", precision: 5, scale: 2
    t.decimal "average_downtime", precision: 5, scale: 2
    t.decimal "average_luck_factor", precision: 5, scale: 2
    t.index ["bgg_id"], name: "index_games_on_bgg_id", unique: true
    t.index ["bgg_rank"], name: "index_games_on_bgg_rank"
    t.index ["popular_categories"], name: "index_games_on_popular_categories", using: :gin
    t.index ["popular_mechanics"], name: "index_games_on_popular_mechanics", using: :gin
    t.index ["site_recommended_players"], name: "index_games_on_site_recommended_players", using: :gin
  end

  create_table "japanese_publishers", force: :cascade do |t|
    t.integer "bgg_id"
    t.string "publisher_name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["bgg_id"], name: "index_japanese_publishers_on_bgg_id", unique: true
  end

  create_table "likes", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "review_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["review_id"], name: "index_likes_on_review_id"
    t.index ["user_id"], name: "index_likes_on_user_id"
  end

  create_table "reviews", force: :cascade do |t|
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
    t.index ["game_id"], name: "index_reviews_on_game_id"
    t.index ["user_id", "game_id"], name: "index_reviews_on_user_id_and_game_id"
    t.index ["user_id"], name: "index_reviews_on_user_id"
  end

  create_table "solid_queue_blocked_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.string "queue_name", null: false
    t.integer "priority", default: 0, null: false
    t.string "concurrency_key", null: false
    t.datetime "expires_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["concurrency_key", "priority", "job_id"], name: "index_solid_queue_blocked_executions_for_release"
    t.index ["expires_at", "concurrency_key"], name: "index_solid_queue_blocked_executions_for_maintenance"
    t.index ["job_id"], name: "index_solid_queue_blocked_executions_on_job_id", unique: true
  end

  create_table "solid_queue_claimed_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.bigint "process_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["job_id"], name: "index_solid_queue_claimed_executions_on_job_id", unique: true
    t.index ["process_id", "job_id"], name: "index_solid_queue_claimed_executions_on_process_id_and_job_id"
  end

  create_table "solid_queue_failed_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.text "error"
    t.integer "concurrency_key"
    t.integer "priority", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["job_id"], name: "index_solid_queue_failed_executions_on_job_id", unique: true
  end

  create_table "solid_queue_jobs", force: :cascade do |t|
    t.string "queue_name", null: false
    t.string "class_name", null: false
    t.text "arguments"
    t.integer "priority", default: 0, null: false
    t.string "active_job_id"
    t.datetime "scheduled_at"
    t.datetime "finished_at"
    t.string "concurrency_key"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["active_job_id"], name: "index_solid_queue_jobs_on_active_job_id", unique: true, where: "(active_job_id IS NOT NULL)"
    t.index ["concurrency_key", "finished_at"], name: "index_solid_queue_jobs_on_concurrency_key_and_finished_at", where: "((concurrency_key IS NOT NULL) AND (finished_at IS NULL))"
    t.index ["priority"], name: "index_solid_queue_jobs_on_priority"
    t.index ["queue_name"], name: "index_solid_queue_jobs_on_queue_name"
    t.index ["scheduled_at"], name: "index_solid_queue_jobs_on_scheduled_at"
  end

  create_table "solid_queue_pauses", force: :cascade do |t|
    t.string "queue_name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["queue_name"], name: "index_solid_queue_pauses_on_queue_name", unique: true
  end

  create_table "solid_queue_processes", force: :cascade do |t|
    t.string "kind", null: false
    t.datetime "last_heartbeat_at", null: false
    t.bigint "supervisor_id"
    t.integer "pid", null: false
    t.string "hostname"
    t.text "metadata"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["last_heartbeat_at", "kind"], name: "index_solid_queue_processes_for_cleanup"
    t.index ["supervisor_id", "pid"], name: "index_solid_queue_processes_on_supervisor_id_and_pid", unique: true
  end

  create_table "solid_queue_ready_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.string "queue_name", null: false
    t.integer "priority", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["job_id"], name: "index_solid_queue_ready_executions_on_job_id", unique: true
    t.index ["priority", "job_id"], name: "index_solid_queue_poll_all"
    t.index ["queue_name", "priority", "job_id"], name: "index_solid_queue_poll_queue"
  end

  create_table "solid_queue_scheduled_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.string "queue_name", null: false
    t.integer "priority", default: 0, null: false
    t.datetime "scheduled_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["job_id"], name: "index_solid_queue_scheduled_executions_on_job_id", unique: true
    t.index ["queue_name", "scheduled_at"], name: "index_solid_queue_dispatch_queue"
    t.index ["scheduled_at", "priority", "job_id"], name: "index_solid_queue_dispatch_all"
  end

  create_table "solid_queue_semaphores", force: :cascade do |t|
    t.string "key", null: false
    t.integer "value", default: 1, null: false
    t.datetime "expires_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["expires_at", "key"], name: "index_solid_queue_semaphores_for_cleanup"
    t.index ["key"], name: "index_solid_queue_semaphores_on_key", unique: true
  end

  create_table "unmapped_bgg_items", force: :cascade do |t|
    t.string "bgg_type", null: false
    t.string "bgg_name", null: false
    t.integer "occurrence_count", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["bgg_type", "bgg_name"], name: "index_unmapped_bgg_items_on_bgg_type_and_bgg_name", unique: true
    t.index ["occurrence_count"], name: "index_unmapped_bgg_items_on_occurrence_count"
  end

  create_table "users", force: :cascade do |t|
    t.string "name", null: false
    t.string "email", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "provider"
    t.string "uid"
    t.string "avatar_url"
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.json "tokens"
    t.integer "sign_in_count", default: 0, null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string "current_sign_in_ip"
    t.string "last_sign_in_ip"
    t.string "confirmation_token"
    t.datetime "confirmed_at"
    t.datetime "confirmation_sent_at"
    t.string "unconfirmed_email"
    t.string "image"
    t.boolean "is_admin", default: false, null: false
    t.text "bio"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["provider", "uid"], name: "index_users_on_provider_and_uid", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["uid", "provider"], name: "index_users_on_uid_and_provider", unique: true
  end

  create_table "wishlist_items", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "game", null: false
    t.integer "position"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "game"], name: "index_wishlist_items_on_user_id_and_game", unique: true
    t.index ["user_id", "position"], name: "index_wishlist_items_on_user_id_and_position"
    t.index ["user_id"], name: "index_wishlist_items_on_user_id"
  end

  add_foreign_key "game_edit_histories", "games"
  add_foreign_key "game_edit_histories", "users"
  add_foreign_key "likes", "reviews"
  add_foreign_key "likes", "users"
  add_foreign_key "reviews", "users"
  add_foreign_key "solid_queue_blocked_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_claimed_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_failed_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_ready_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_scheduled_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "wishlist_items", "users"
end
