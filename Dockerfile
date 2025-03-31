FROM ruby:3.3.0-slim

# 必要最低限のパッケージをインストール
RUN apt-get update -qq && \
    apt-get install -y build-essential && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 作業ディレクトリを設定
WORKDIR /app

# 必要なgemのインストール
RUN gem install rack puma webrick

# 単純なRackアプリケーションの作成
RUN echo 'require "rack"\n\napp = Rack::Builder.new do\n  map "/" do\n    run lambda { |env| [200, {"Content-Type" => "text/html"}, ["<h1>Hello from BGR4 API!</h1><p>Simple Rack application deployed on Cloud Run</p>"]]}  \n  end\nend\n\nrun app' > config.ru

# ポート設定
ENV PORT=8080

# ヘルスチェック用スクリプト作成
RUN echo '#!/bin/bash\necho "Starting simple Rack server on port $PORT"\necho "Current directory: $(pwd)"\necho "Contents of directory:"\nls -la\necho "Content of config.ru:"\ncat config.ru\necho "Now starting puma server..."\nexec ruby -rpuma -e "puts \"Ruby version: #{RUBY_VERSION}\"; puts \"Starting Puma server...\"; server = Puma::Server.new(Rack::Builder.parse_file(\"config.ru\")[0], Puma::Events.new); server.add_tcp_listener(\"0.0.0.0\", ENV[\"PORT\"].to_i); puts \"Puma server started and listening on port #{ENV[\"PORT\"]}\"; server.run.join"' > /app/start.sh && \
    chmod +x /app/start.sh

# サーバー起動
CMD ["/app/start.sh"] 