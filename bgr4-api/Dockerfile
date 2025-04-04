FROM ruby:3.3.0-slim

# 必要なパッケージをインストール
RUN apt-get update -qq && \
    apt-get install -y build-essential libpq-dev nodejs postgresql-client && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 作業ディレクトリの設定
WORKDIR /app

# アプリケーションコードのコピー
COPY . /app/

# 環境変数の設定
ENV RAILS_ENV=production
ENV PORT=8080
ENV RAILS_SERVE_STATIC_FILES=true
ENV RAILS_LOG_TO_STDOUT=true

# スクリプトに実行権限を付与
RUN chmod +x /app/bin/wait-for-postgres.sh

# Bundlerの設定
RUN gem install bundler
RUN bundle config set --local without 'development test'
RUN bundle install

# Create a startup script
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# Wait for PostgreSQL to be ready\n\
/app/bin/wait-for-postgres.sh $DATABASE_URL\n\
\n\
# Prepare the database if needed\n\
bundle exec rails db:prepare\n\
\n\
# Start the Rails server\n\
bundle exec rails server -b 0.0.0.0 -p ${PORT:-8080}\n\
' > /app/start.sh

# Make the script executable
RUN chmod +x /app/start.sh

# ポートを公開
EXPOSE 8080

# 起動コマンド
CMD ["/app/start.sh"]
