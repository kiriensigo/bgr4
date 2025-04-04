#!/bin/bash
set -ex

# スクリプト実行時に環境変数をダンプ
echo "============ ENVIRONMENT VARIABLES ============"
env | sort
echo "============================================"

# Rubyとgemのバージョン確認
echo "Ruby version: $(ruby -v)"
echo "Bundler version: $(gem list bundler)"
echo "Rack version: $(gem list rack)"
echo "Puma version: $(gem list puma)"

# ファイルシステムの確認
echo "Files in working directory:"
ls -la

# ネットワーク設定の確認
echo "Network configuration:"
ip addr show || echo "ip command not available"
netstat -tuln || echo "netstat command not available"

# デバッグメッセージ
echo "Starting debug server on port ${PORT}"

# より詳細な出力でpumaを起動
exec puma -v -b tcp://0.0.0.0:${PORT} -e production 