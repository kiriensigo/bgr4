# ベースイメージとしてRubyを使用
FROM ruby:3.2.0 AS base

# Node.jsをインストール
RUN apt-get update -qq && apt-get install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y nodejs
# 互換性のあるnpmバージョンを指定
RUN npm install -g npm@10.2.4

# 作業ディレクトリを設定
WORKDIR /app

# フロントエンドの依存関係をインストール
COPY bgr4-front/package*.json ./bgr4-front/
RUN cd bgr4-front && npm install

# Bundlerをインストール
RUN gem install bundler

# バックエンドの依存関係をインストール
COPY bgr4-api/Gemfile bgr4-api/Gemfile.lock ./bgr4-api/
RUN cd bgr4-api && bundle install

# アプリケーションのソースコードをコピー
COPY . .

# 環境変数の設定
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV ESLINT_NO_DEV_ERRORS=true
ENV DISABLE_ESLINT_PLUGIN=true
ENV NEXT_SKIP_TYPECHECKING=true

# ESLintと型チェックをスキップしてフロントエンドをビルド
RUN cd bgr4-front && NODE_OPTIONS=--max_old_space_size=4096 npx next build --no-lint

# バックエンドのプリコンパイル
RUN cd bgr4-api && bundle exec bootsnap precompile app/ lib/

# 実行可能ファイルの調整
RUN cd bgr4-api && chmod +x bin/* && sed -i "s/\r$//g" bin/*

# アプリケーションの起動
CMD ["sh", "-c", "cd bgr4-api && rails server -b 0.0.0.0 & cd bgr4-front && npm start"] 