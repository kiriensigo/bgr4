FROM node:20-alpine AS builder

# 作業ディレクトリを設定
WORKDIR /app

# 依存関係のファイルをコピー
COPY package.json ./

# 依存関係をインストール
RUN npm install

# ソースコードをコピー
COPY . .

# 必要なディレクトリが存在することを確認
RUN mkdir -p public

# アプリケーションをビルド
RUN npm run build

# 本番環境ステージ
FROM node:20-alpine AS runner

WORKDIR /app

# 必要なディレクトリを作成
RUN mkdir -p public

# 本番環境のみ必要なファイルをコピー
COPY --from=builder /app/package.json ./
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public

# 環境変数を設定
ENV NODE_ENV=production
ENV PORT=8080

# 非rootユーザーを使用
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app
USER nextjs

# ポートを公開
EXPOSE 8080

# サーバーを起動
CMD ["npm", "start"] 