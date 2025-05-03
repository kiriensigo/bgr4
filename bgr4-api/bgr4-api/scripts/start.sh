#!/bin/bash
set -e

# データベースが準備できるまで待機する関数
wait_for_db() {
  echo "データベースの準備を待機しています..."
  until PGPASSWORD=$DATABASE_PASSWORD psql -h $DATABASE_HOST -U $DATABASE_USERNAME -d $DATABASE_NAME -c '\q'; do
    echo "データベースの接続を待機しています..."
    sleep 2
  done
  echo "データベースの準備ができました！"
}

# 環境変数の設定確認
if [ -z "$DATABASE_HOST" ] || [ -z "$DATABASE_USERNAME" ] || [ -z "$DATABASE_PASSWORD" ] || [ -z "$DATABASE_NAME" ]; then
  echo "データベース接続情報が不足しています。環境変数を確認してください。"
  echo "DATABASE_HOST: $DATABASE_HOST"
  echo "DATABASE_USERNAME: $DATABASE_USERNAME"
  echo "DATABASE_NAME: $DATABASE_NAME"
  echo "DATABASE_PASSWORD: [設定されています]"
  exit 1
fi

# サーバーPIDファイルの削除（存在する場合）
if [ -f tmp/pids/server.pid ]; then
  echo "古いサーバーPIDファイルを削除しています..."
  rm tmp/pids/server.pid
fi

# データベース接続確認
wait_for_db

# データベースのセットアップ
echo "データベースのマイグレーションを実行しています..."
bundle exec rails db:migrate

# システムユーザーの作成（存在しない場合）
echo "システムユーザーが存在するか確認しています..."
bundle exec rails runner "User.find_or_create_by(email: 'system@boardgamereview.com') do |user| user.name = 'システムレビュー'; user.password = SecureRandom.hex(10); end"

# Railsサーバーの起動
echo "Railsサーバーを起動しています..."
bundle exec rails server -b 0.0.0.0 -p ${PORT:-8080} 