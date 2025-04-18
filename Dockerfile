FROM ruby:3.3.0-slim

# 必要なパッケージのインストール
RUN apt-get update && apt-get install -y \
    build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 作業ディレクトリの設定
WORKDIR /app

# 環境変数の設定
ENV PORT=8080
ENV RAILS_ENV=production

# シンプルなRackアプリケーションの作成
RUN echo 'require "rack"' > config.ru
RUN echo 'app = Proc.new { |env| [200, {"Content-Type" => "text/html"}, ["Hello from BGRv4 API on Cloud Run!"]] }' >> config.ru
RUN echo 'run app' >> config.ru

# Rackとpumaのインストール
RUN gem install rack puma

# アプリケーションをサーブするためのスクリプト作成
RUN echo '#!/bin/bash' > start.sh
RUN echo 'puma -p ${PORT:-8080}' >> start.sh
RUN chmod +x start.sh

# ポート8080を公開
EXPOSE 8080

# サーバーの起動
CMD ["./start.sh"] 