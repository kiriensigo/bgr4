FROM node:20-alpine

# 作業ディレクトリを設定
WORKDIR /app

# 依存関係のファイルをコピー
COPY package.json package-lock.json ./

# 依存関係をインストール
RUN npm ci

# 開発環境として設定
ENV NODE_ENV=development
ENV PORT=3001

# ポートを公開
EXPOSE 3001

# 開発サーバーを起動
CMD ["npm", "run", "dev"] 