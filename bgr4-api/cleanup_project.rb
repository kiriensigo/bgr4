# プロジェクト整理スクリプト

puts "=== プロジェクト整理開始 ==="

# 削除対象ファイル一覧
files_to_delete = [
  # テスト・デバッグファイル
  "bulk_update_all_games.rb",
  "debug_simple_poll.rb", 
  "debug_dune_poll.rb",
  "test_dune_imperium.rb",
  "quick_progress_check.rb",
  "batch_update_japanese_names.rb",
  "manual_fix_last_entity.rb",
  "cleanup_english_descriptions.rb",
  "cleanup_descriptions.rb",
  "translate_all_games.rb",
  "check_translation_status.rb",
  "fix_incomplete_reviews.rb",
  "create_remaining_system_reviews.rb",
  "create_system_user.rb",
  
  # レスポンス・テストファイル
  "test_response2.json",
  "test_response.json", 
  "response2.json",
  "response.json",
  
  # HTMLファイル
  "game_detail.html",
  
  # XML一時ファイル
  "japanese_version.xml",
  "planet_x_versions.xml", 
  "planet_x.xml",
  "game_info.xml",
  "version_info.xml",
  
  # ログファイル
  "update_log.txt"
]

deleted_count = 0
error_count = 0

files_to_delete.each do |file_path|
  begin
    if File.exist?(file_path)
      File.delete(file_path)
      puts "✅ 削除: #{file_path}"
      deleted_count += 1
    else
      puts "⚠️  ファイルなし: #{file_path}"
    end
  rescue => e
    puts "❌ 削除エラー: #{file_path} - #{e.message}"
    error_count += 1
  end
end

puts "\n=== 削除結果 ==="
puts "削除成功: #{deleted_count}件"
puts "エラー: #{error_count}件"

# 次に削除予定のネストしたbgr4-apiディレクトリ
nested_dir = "bgr4-api"
if Dir.exist?(nested_dir)
  puts "\n⚠️  ネストしたbgr4-apiディレクトリが存在します"
  puts "手動で確認後に削除してください: #{nested_dir}"
end

puts "\n=== 整理完了 ===" 