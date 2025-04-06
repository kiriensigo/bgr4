#!/bin/bash
# wait-for-postgres.sh

set -e

# タイムアウト設定（秒）
MAX_TRIES=${POSTGRES_MAX_TRIES:-60}
SLEEP_TIME=${POSTGRES_SLEEP_TIME:-2}

# 環境変数から接続情報を取得
if [[ -z "${DATABASE_URL}" ]]; then
  echo "DATABASE_URL is not set. Using default connection parameters."
  # デフォルトの接続情報（DATABASE_URLが設定されていない場合）
  host="db"
  user="postgres"
  password="postgres"
  database="postgres"
  command="pg_isready -h $host -U $user"
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
      
      # ソケットディレクトリの存在確認
      if [ ! -d "$socket_path" ]; then
        echo "警告: Cloud SQLソケットディレクトリ $socket_path が見つかりません"
        echo "接続にはGoogle Cloud Run側でCloud SQLインスタンスが正しく設定されている必要があります"
        echo "--add-cloudsql-instances=$_CLOUDSQL_CONNECTION_NAME が設定されていることを確認してください"
        
        # ディレクトリが存在しない場合でも、ソケットファイルのチェックは継続
      fi
      
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

echo "PostgreSQL 接続チェックコマンド: $command"
echo "最大試行回数: $MAX_TRIES 回、間隔: $SLEEP_TIME 秒"

# 接続試行カウンター
tries=0

# 接続状態変数
connected=false

# PostgreSQLへの接続確認
while [ $tries -lt $MAX_TRIES ]; do
  tries=$((tries+1))
  
  echo "PostgreSQL接続試行 $tries/$MAX_TRIES..."
  
  if $command; then
    echo "PostgreSQL接続成功！"
    connected=true
    break
  else
    echo "PostgreSQL接続不可 - $SLEEP_TIME 秒待機中..."
    sleep $SLEEP_TIME
  fi
done

# 接続タイムアウト処理
if [ "$connected" = false ]; then
  echo "警告: PostgreSQLへの接続がタイムアウトしました ($MAX_TRIES 回試行)"
  
  # 環境変数で強制継続が設定されている場合
  if [[ "${POSTGRES_CONTINUE_ON_ERROR}" == "true" ]]; then
    echo "POSTGRES_CONTINUE_ON_ERROR=true が設定されているため、処理を継続します"
  else
    echo "PostgreSQLに接続できないため終了します。環境変数 POSTGRES_CONTINUE_ON_ERROR=true を設定すると、接続エラーを無視して続行できます"
    exit 1
  fi
else
  echo "PostgreSQLは起動しています - 処理を継続します"
fi 