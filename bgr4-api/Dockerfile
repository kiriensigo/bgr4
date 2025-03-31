FROM ruby:3.3.0-slim

# 必要なパッケージのインストール
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    postgresql-client \
    curl \
    git \
    less \
    libjemalloc2 \
    lsof \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 作業ディレクトリの設定
WORKDIR /rails

# jemalloc設定（メモリ使用量削減のため）
ENV LD_PRELOAD=/usr/lib/x86_64-linux-gnu/libjemalloc.so.2

# アプリケーションの依存関係をインストール
COPY Gemfile Gemfile.lock ./
RUN gem install bundler && \
    bundle config set --local without 'development test' && \
    bundle install --jobs 4 --retry 3

# アプリケーションコードをコピー
COPY . .

# ファイルの実行権限を確保
RUN chmod +x bin/* && \
    chmod +x /rails/bin/docker-entrypoint

# Cloud SQLソケットディレクトリを作成
RUN mkdir -p /cloudsql

# 環境変数を設定
ENV PORT=8080
ENV RAILS_ENV=production
ENV RAILS_LOG_TO_STDOUT=true
ENV RAILS_SERVE_STATIC_FILES=true
ENV BINDING="tcp://0.0.0.0:${PORT}"
ENV PIDFILE="/rails/tmp/pids/server.pid"

# 起動時に古いPIDファイルがあれば削除
RUN mkdir -p /rails/tmp/pids && \
    if [ -f /rails/tmp/pids/server.pid ]; then rm -f /rails/tmp/pids/server.pid; fi

# Railsサーバーを起動
CMD ["bash", "-c", "rm -f /rails/tmp/pids/server.pid && bundle exec rails server -b 0.0.0.0 -p ${PORT}"]
