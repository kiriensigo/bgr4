FROM ruby:3.3.0-slim

# 必要なパッケージをインストール（Gitを含む）
RUN apt-get update && apt-get install -y \
    build-essential \
    postgresql-client \
    libpq-dev \
    git \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 作業ディレクトリの設定
WORKDIR /app

# 環境変数の設定
ENV PORT=8080
ENV RAILS_ENV=production
ENV RAILS_LOG_TO_STDOUT=true
ENV RAILS_SERVE_STATIC_FILES=true
ENV DISABLE_DATABASE_ENVIRONMENT_CHECK=1

# Gemfileとロックファイルをコピー
COPY Gemfile Gemfile.lock ./

# 必要なGemをインストール
RUN gem install bundler
RUN bundle config set --local without 'development test'
RUN bundle install --jobs 4

# アプリケーションコードをコピー
COPY . .

# nulldb adapterを使用できるように追加
RUN bundle add activerecord-nulldb-adapter --group production

# データベースなしでも動作するための設定ファイルを作成
RUN mkdir -p config/initializers
RUN echo 'Rails.application.config.after_initialize do\n  if ENV["DISABLE_DATABASE_CONNECTION"] == "true"\n    ActiveRecord::Base.establish_connection adapter: "nulldb", schema: "schema.rb"\n    puts "Database connection is disabled. Using nulldb adapter."\n  end\nend' > config/initializers/disable_database.rb

# 実行権限を付与
RUN chmod +x bin/*

# 起動スクリプトの作成（拡張デバッグ情報付き）
RUN echo '#!/bin/bash\nset -e\n\necho "Starting Rails in $RAILS_ENV mode..."\necho "Environment: $RAILS_ENV"\necho "Port: $PORT"\necho "RAILS_MASTER_KEY is set: $([ -n "$RAILS_MASTER_KEY" ] && echo Yes || echo No)"\necho "SECRET_KEY_BASE is set: $([ -n "$SECRET_KEY_BASE" ] && echo Yes || echo No)"\necho "DISABLE_DATABASE_CONNECTION: $DISABLE_DATABASE_CONNECTION"\n\nif [ "$DISABLE_DATABASE_CONNECTION" = "true" ]; then\n  echo "Database connection is disabled. Skipping database operations."\nelse\n  echo "Database connection is enabled. Checking database..."\n  if [[ -z "${DATABASE_URL}" ]]; then\n    echo "WARNING: DATABASE_URL is not set. Using memory database."\n    export DISABLE_DATABASE_CONNECTION=true\n  else\n    echo "Waiting for database..."\n    # PostgreSQLの起動を待つシンプルなチェック\n    timeout=30\n    while ! pg_isready -h $(echo $DATABASE_URL | sed -e "s/.*@\\(.*\\):.*/\\1/") > /dev/null 2>&1; do\n      timeout=$((timeout - 1))\n      if [ $timeout -eq 0 ]; then\n        echo "Could not connect to database, switching to memory mode"\n        export DISABLE_DATABASE_CONNECTION=true\n        break\n      fi\n      echo "Waiting for database... $timeout seconds left"\n      sleep 1\n    done\n  fi\nfi\n\necho "Starting Rails server on port $PORT"\nexec bundle exec rails server -b 0.0.0.0 -p ${PORT:-8080}\n' > /app/start.sh
RUN chmod +x /app/start.sh

# ポートを公開
EXPOSE 8080

# 起動コマンド
CMD ["/app/start.sh"]
