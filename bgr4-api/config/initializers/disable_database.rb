# データベース接続を無効にする設定
if ENV['DISABLE_DATABASE_CONNECTION'] == 'true'
  puts "\n========================================================================"
  puts "🔒 DATABASE CONNECTION DISABLED MODE ACTIVATED"
  puts "========================================================================"
  puts "⚠️ データベース接続が無効化されています（DISABLE_DATABASE_CONNECTION=true）"
  
  begin
    # nulldbアダプターを読み込む
    require 'active_record/connection_adapters/nulldb_adapter'
    puts "✅ NullDBアダプターの読み込み成功"
    
    # ActiveRecordの代わりにNullDBアダプターを使用
    ActiveRecord::Base.establish_connection adapter: :nulldb, schema: "schema.rb"
    puts "✅ NullDBアダプターでの接続確立成功"
  rescue LoadError => e
    puts "❌ NullDBアダプターの読み込みに失敗しました: #{e.message}"
    puts "💡 ヒント: Gemfileに gem 'activerecord-nulldb-adapter' が含まれていることを確認してください"
    # フォールバック: モックの接続アダプターを使用
    ActiveRecord::Base.establish_connection adapter: "sqlite3", database: ":memory:"
    puts "⚠️ メモリ内SQLiteにフォールバックしました"
  rescue => e
    puts "❌ データベース接続の無効化中にエラーが発生しました: #{e.message}"
    puts "📊 スタックトレース: #{e.backtrace.join("\n")}"
  end
  
  # 初期化時の処理をシンプルにする
  ActiveRecord::Base.connection.class.class_eval do
    def execute(*args)
      puts "⚠️ 無効化されたDB操作: execute #{args.first}" if Rails.env.development?
      []
    end
    
    def exec_query(*args)
      puts "⚠️ 無効化されたDB操作: exec_query #{args.first}" if Rails.env.development?
      ActiveRecord::Result.new([], [])
    end
  end

  # 簡略化したActiveStorage無効設定
  if defined?(ActiveStorage)
    ActiveStorage::Blob.singleton_class.class_eval do
      def service
        @service ||= ActiveStorage::Service::NullService.new
      end
    end
    puts "✅ ActiveStorageのサービスを無効化しました"
  end
  
  # SolidQueueの無効化（存在する場合）
  if defined?(SolidQueue)
    Rails.configuration.solid_queue.enabled = false
    puts "✅ SolidQueueを無効化しました"
  end
  
  puts "✅ データベース関連の機能が無効化されました。最小限の機能のみ利用可能です。"
  puts "========================================================================"
end

# NullServiceをActiveStorageに提供
module ActiveStorage
  class Service::NullService < Service
    def initialize(**_options)
      puts "📄 ActiveStorage::Service::NullService初期化" if ENV['DISABLE_DATABASE_CONNECTION'] == 'true'
    end
    def upload(key, io, **_options); end
    def download(key, &_block); nil; end
    def download_chunk(key, range); nil; end
    def delete(key); end
    def delete_prefixed(prefix); end
    def exist?(key); false; end
    def url(key, **_options); ""; end
    def url_for_direct_upload(key, **_options); ""; end
    def headers_for_direct_upload(key, **_options); {}; end
  end
end 