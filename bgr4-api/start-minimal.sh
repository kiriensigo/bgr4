#!/bin/bash
echo "===================================================="
echo "🚀 シンプルRailsサーバー起動モード（データベースなし）"
echo "===================================================="

# PIDファイルの削除
rm -f /app/tmp/pids/server.pid

# 環境変数の確認と設定
echo "📊 環境変数設定:"
echo "  - RAILS_ENV=${RAILS_ENV}"
echo "  - PORT=${PORT}"
echo "  - DISABLE_DATABASE_CONNECTION=${DISABLE_DATABASE_CONNECTION}"
echo "  - RAILS_MASTER_KEY is set: $([ -n "$RAILS_MASTER_KEY" ] && echo "Yes" || echo "No")"
echo "  - SECRET_KEY_BASE is set: $([ -n "$SECRET_KEY_BASE" ] && echo "Yes" || echo "No")"

# シークレットキーベースの確認（必須）
if [ -z "$SECRET_KEY_BASE" ]; then
  echo "❌ ERROR: SECRET_KEY_BASE が設定されていません！"
  echo "    一時的なキーを設定します..."
  export SECRET_KEY_BASE=$(openssl rand -hex 64)
  echo "    一時キー: ${SECRET_KEY_BASE:0:10}... を設定しました"
fi

# ディレクトリとファイル権限の確認
echo "🔍 ディレクトリの確認:"
mkdir -p /app/tmp/pids /app/tmp/cache /app/log
chmod -R 777 /app/tmp /app/log
echo "  - TMP & LOG ディレクトリの権限設定完了"

# 初期化スクリプトの存在確認
if [ -f /app/config/initializers/disable_database.rb ]; then
  echo "✅ データベース無効化の初期化スクリプトを確認: OK"
  cat /app/config/initializers/disable_database.rb | grep -E "puts|ActiveRecord" | head -n 5
else
  echo "⚠️ データベース無効化の初期化スクリプトが見つかりません。"
fi

echo "📝 アプリケーション設定の確認:"
if grep -q "DISABLE_DATABASE_CONNECTION" /app/config/application.rb; then
  echo "✅ application.rbのデータベース無効設定を確認: OK"
  cat /app/config/application.rb | grep -E "DISABLE_DATABASE_CONNECTION" | head -n 3
else
  echo "⚠️ application.rbにデータベース無効設定が見つかりません。"
fi

# ヘルスチェックエンドポイントの確認
echo "🔍 ヘルスチェックエンドポイントの確認:"
if grep -q "health" /app/config/routes.rb; then
  echo "✅ ヘルスチェックルートの設定を確認: OK"
  cat /app/config/routes.rb | grep -E "health" | head -n 3
else
  echo "⚠️ ヘルスチェックルートの設定が見つかりません。routes.rbを確認してください。"
  echo "  追加するルート設定例: get '/health', to: proc { [200, {'Content-Type' => 'application/json'}, ['{"status":"ok"}']] }"
fi

echo "🔧 詳細デバッグ情報:"
echo "  - Railsアプリケーションパス: $(pwd)"
echo "  - Railsバージョン: $(bundle exec rails -v 2>&1 || echo 'Error getting Rails version')"
echo "  - Rubyバージョン: $(ruby -v)"
echo "  - インストール済みGem:"
bundle list | grep -E "rails|active|puma|rack" | head -n 10

echo "🔎 アプリケーションファイル:"
ls -la /app/config/initializers/
ls -la /app/config/

echo "===================================================="
echo "🌐 Railsサーバーを起動します..."
echo "===================================================="

# より直接的なRailsサーバー起動方法
cd /app
RAILS_ENV=production RAILS_LOG_TO_STDOUT=true exec bundle exec puma -C config/puma.rb -b tcp://0.0.0.0:${PORT:-8080} 