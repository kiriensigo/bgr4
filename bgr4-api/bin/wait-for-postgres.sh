#!/bin/bash
# wait-for-postgres.sh

set -e

# 環境変数から接続情報を取得
if [[ -z "${DATABASE_URL}" ]]; then
  echo "DATABASE_URL is not set. Using default connection parameters."
  # デフォルトの接続情報（DATABASE_URLが設定されていない場合）
  host="db"
  user="postgres"
  password="postgres"
  database="postgres"
else
  # Cloud SQL Socketパターンのチェック (host=/cloudsql/...)
  if [[ $DATABASE_URL == *"host=/cloudsql/"* ]]; then
    # Cloud SQL Socket接続用のパース
    regex="postgres://([^:]+):([^@]+)@([^/]+)/([^?]+)\?host=(/cloudsql/[^[:space:]]+)"
    if [[ $DATABASE_URL =~ $regex ]]; then
      user="${BASH_REMATCH[1]}"
      password="${BASH_REMATCH[2]}"
      host="${BASH_REMATCH[3]}"
      database="${BASH_REMATCH[4]}"
      socket_path="${BASH_REMATCH[5]}"
      echo "Cloud SQL Socket connection detected: $socket_path"
      command="pg_isready -h $socket_path -U $user"
    else
      echo "Could not parse Cloud SQL Socket DATABASE_URL. Using default settings."
      command="pg_isready"
    fi
  else
    # 通常のTCP接続用のパース
    regex="postgres://([^:]+):([^@]+)@([^:/]+)(:([0-9]+))?/([^?]+)"
    if [[ $DATABASE_URL =~ $regex ]]; then
      user="${BASH_REMATCH[1]}"
      password="${BASH_REMATCH[2]}"
      host="${BASH_REMATCH[3]}"
      port="${BASH_REMATCH[5]:-5432}"
      database="${BASH_REMATCH[6]}"
      command="pg_isready -h $host -p $port -U $user"
    else
      echo "Could not parse standard DATABASE_URL. Using connection string directly."
      command="pg_isready"
    fi
  fi
fi

echo "Executing: $command"
until $command
do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "PostgreSQL is up - continuing" 