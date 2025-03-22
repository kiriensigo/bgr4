FROM postgres:17

# タイムゾーンを日本に設定
ENV TZ=Asia/Tokyo

# 初期化スクリプトをコンテナにコピー
COPY ./init-db.sh /docker-entrypoint-initdb.d/

# Postgresの設定をカスタマイズする場合はここに追加
# COPY ./postgresql.conf /etc/postgresql/postgresql.conf

# ボリュームを設定
VOLUME ["/var/lib/postgresql/data"]

# ポートを公開
EXPOSE 5432 