#!/bin/bash
# wait-for-postgres.sh

set -e

host="$1"
port="$2"
shift 2
cmd="$@"

# タイムアウト設定（秒）
timeout=30
counter=0

echo "Waiting for PostgreSQL at $host:$port (timeout: ${timeout}s)..."
until pg_isready -h "$host" -p "$port" -U postgres; do
  counter=$((counter+1))
  if [ $counter -ge $timeout ]; then
    >&2 echo "PostgreSQL connection timed out after ${timeout} seconds"
    exit 1
  fi
  >&2 echo "PostgreSQL is unavailable - sleeping (${counter}/${timeout})"
  sleep 1
done

>&2 echo "PostgreSQL is up - executing command"
exec $cmd 