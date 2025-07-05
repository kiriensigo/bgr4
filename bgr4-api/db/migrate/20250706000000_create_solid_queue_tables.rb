class CreateSolidQueueTables < ActiveRecord::Migration[7.1]
  def change
    create_table :solid_queue_jobs do |t|
      t.string :queue_name, null: false
      t.string :class_name, null: false
      t.text :arguments
      t.integer :priority, default: 0, null: false
      t.string :active_job_id
      t.datetime :scheduled_at
      t.datetime :finished_at
      t.string :concurrency_key
      t.datetime :created_at, null: false
      t.datetime :updated_at, null: false

      t.index :queue_name
      t.index :priority, order: :asc
      t.index :scheduled_at, order: :asc
      t.index [:active_job_id], unique: true, where: "active_job_id IS NOT NULL"
      t.index [:concurrency_key, :finished_at], where: "concurrency_key IS NOT NULL AND finished_at IS NULL"
    end

    create_table :solid_queue_scheduled_executions do |t|
      t.references :job, null: false, index: { unique: true }
      t.string :queue_name, null: false
      t.integer :priority, default: 0, null: false
      t.datetime :scheduled_at, null: false

      t.datetime :created_at, null: false
      t.datetime :updated_at, null: false

      t.index [:scheduled_at, :priority, :job_id], name: "index_solid_queue_dispatch_all"
      t.index [:queue_name, :scheduled_at], name: "index_solid_queue_dispatch_queue"
    end

    create_table :solid_queue_ready_executions do |t|
      t.references :job, null: false, index: { unique: true }
      t.string :queue_name, null: false
      t.integer :priority, default: 0, null: false

      t.datetime :created_at, null: false
      t.datetime :updated_at, null: false

      t.index [:priority, :job_id], name: "index_solid_queue_poll_all", order: { priority: :asc, job_id: :asc }
      t.index [:queue_name, :priority, :job_id], name: "index_solid_queue_poll_queue", order: { priority: :asc, job_id: :asc }
    end

    create_table :solid_queue_claimed_executions do |t|
      t.references :job, null: false, index: { unique: true }
      t.bigint :process_id
      t.datetime :created_at, null: false
      t.datetime :updated_at, null: false

      t.index [:process_id, :job_id]
    end

    create_table :solid_queue_blocked_executions do |t|
      t.references :job, null: false, index: { unique: true }
      t.string :queue_name, null: false
      t.integer :priority, default: 0, null: false
      t.string :concurrency_key, null: false
      t.datetime :expires_at, null: false

      t.datetime :created_at, null: false
      t.datetime :updated_at, null: false

      t.index [:expires_at, :concurrency_key], name: "index_solid_queue_blocked_executions_for_maintenance"
      t.index [:concurrency_key, :priority, :job_id], name: "index_solid_queue_blocked_executions_for_release"
    end

    create_table :solid_queue_failed_executions do |t|
      t.references :job, null: false, index: { unique: true }
      t.text :error
      t.integer :concurrency_key
      t.integer :priority, default: 0, null: false
      t.datetime :created_at, null: false
      t.datetime :updated_at, null: false
    end

    create_table :solid_queue_pauses do |t|
      t.string :queue_name, null: false, index: { unique: true }
      t.datetime :created_at, null: false
      t.datetime :updated_at, null: false
    end

    create_table :solid_queue_processes do |t|
      t.string :kind, null: false
      t.datetime :last_heartbeat_at, null: false
      t.bigint :supervisor_id

      t.integer :pid, null: false
      t.string :hostname
      t.text :metadata

      t.datetime :created_at, null: false
      t.datetime :updated_at, null: false

      t.index [:last_heartbeat_at, :kind], name: "index_solid_queue_processes_for_cleanup"
      t.index [:supervisor_id, :pid], unique: true
    end

    create_table :solid_queue_semaphores do |t|
      t.string :key, null: false, index: { unique: true }
      t.integer :value, default: 1, null: false
      t.datetime :expires_at, null: false

      t.datetime :created_at, null: false
      t.datetime :updated_at, null: false

      t.index [:expires_at, :key], name: "index_solid_queue_semaphores_for_cleanup"
    end

    add_foreign_key :solid_queue_scheduled_executions, :solid_queue_jobs, column: :job_id, on_delete: :cascade
    add_foreign_key :solid_queue_ready_executions, :solid_queue_jobs, column: :job_id, on_delete: :cascade
    add_foreign_key :solid_queue_claimed_executions, :solid_queue_jobs, column: :job_id, on_delete: :cascade
    add_foreign_key :solid_queue_blocked_executions, :solid_queue_jobs, column: :job_id, on_delete: :cascade
    add_foreign_key :solid_queue_failed_executions, :solid_queue_jobs, column: :job_id, on_delete: :cascade
  end
end 