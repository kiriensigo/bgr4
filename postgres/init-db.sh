#!/bin/bash
set -e

# データベース作成
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE bgr4_api_production;
    GRANT ALL PRIVILEGES ON DATABASE bgr4_api_production TO $POSTGRES_USER;
EOSQL

echo "PostgreSQL 初期化が完了しました" 