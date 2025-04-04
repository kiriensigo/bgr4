require "rack"

class DebugApp
  def call(env)
    # 環境変数をログ出力
    puts "======== DEBUG INFORMATION ========"
    puts "PORT: #{ENV["PORT"]}"
    puts "PWD: #{Dir.pwd}"
    puts "Files in current dir: #{Dir.entries(".").join(", ")}"
    puts "Process ID: #{Process.pid}"
    puts "User: #{`whoami`.strip}"
    puts "==================================="
    
    # レスポンス
    body = "<html><body><h1>BGRv4 API Debug Mode</h1>"
    body += "<p>This is a debug version of the BGRv4 API running on Cloud Run</p>"
    body += "<h2>Environment Variables:</h2>"
    body += "<ul>"
    ENV.sort.each do |key, value|
      # 機密情報は表示しない
      safe_value = key.include?("SECRET") || key.include?("KEY") || key.include?("PASSWORD") ? "[REDACTED]" : value
      body += "<li>#{key}: #{safe_value}</li>"
    end
    body += "</ul>"
    body += "<h2>System Info:</h2>"
    body += "<pre>Ruby version: #{RUBY_VERSION}\nRails env: #{ENV["RAILS_ENV"]}\nPORT: #{ENV["PORT"]}</pre>"
    body += "</body></html>"
    
    [200, {"Content-Type" => "text/html"}, [body]]
  end
end

run DebugApp.new 