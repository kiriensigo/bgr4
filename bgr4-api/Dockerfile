FROM ruby:3.3.0-slim

# 必要なパッケージのインストール
RUN apt-get update && apt-get install -y \
    build-essential \
    postgresql-client \
    libpq-dev \
    git \
    nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 作業ディレクトリの設定
WORKDIR /app

# 環境変数の設定
ENV PORT=8080
ENV RAILS_ENV=production
ENV RAILS_SERVE_STATIC_FILES=true
ENV RAILS_LOG_TO_STDOUT=true

# Gemfileとロックファイルのコピー
COPY Gemfile Gemfile.lock ./

# Bundlerの設定とGemのインストール
RUN gem install bundler -v 2.4.10
RUN bundle config set --local without 'development test'
RUN bundle install --jobs 4 --retry 3

# アプリケーションコードのコピー
COPY . .

# アセットのプリコンパイルと不要なファイルの削除
RUN if [ -d "app/assets" ]; then \
      SECRET_KEY_BASE=dummy RAILS_ENV=production bundle exec rails assets:precompile && \
      rm -rf tmp/cache vendor/bundle/ruby/*/cache; \
    fi

# 実行権限の設定
RUN chmod +x bin/* 

# 健全性チェック用の簡易エンドポイントを追加
RUN echo "Rails.application.routes.draw do\n  get '/health', to: proc { |env| [200, {'Content-Type' => 'text/plain'}, ['healthy']] }\nend" >> config/routes.rb

# 起動スクリプトの作成
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
echo "Starting Rails in $RAILS_ENV mode"\n\
\n\
# データベース接続の確認\n\
if [[ -n "${DATABASE_URL}" ]] && [[ "${DISABLE_DATABASE_CONNECTION}" != "true" ]]; then\n\
  echo "Database URL is configured. Attempting to connect..."\n\
  # データベースの準備\n\
  if bundle exec rails db:version > /dev/null 2>&1; then\n\
    echo "Database exists, running migrations..."\n\
    bundle exec rails db:migrate\n\
  else\n\
    echo "Database does not exist or not accessible"\n\
    # データベースが存在しないか接続できない場合の処理\n\
    # この部分は環境に応じてカスタマイズ\n\
    # 本番環境では通常、手動でDBを先に準備するか、別の方法で自動化\n\
    if [[ "${RAILS_ENV}" == "development" ]]; then\n\
      echo "Creating database in development mode..."\n\
      bundle exec rails db:create db:migrate db:seed\n\
    fi\n\
  fi\n\
else\n\
  echo "DATABASE_URL is not set or database connection is disabled"\n\
  if [[ "${DISABLE_DATABASE_CONNECTION}" == "true" ]]; then\n\
    echo "Running with database connection disabled"\n\
  else\n\
    echo "WARNING: No database connection configured!"\n\
  fi\n\
fi\n\
\n\
# Railsサーバーの起動\n\
echo "Starting Rails server on port $PORT"\n\
exec bundle exec rails server -b 0.0.0.0 -p ${PORT:-8080}\n' > /app/start.sh

RUN chmod +x /app/start.sh

# ポートの公開
EXPOSE 8080

# サーバーの起動
CMD ["/app/start.sh"]
