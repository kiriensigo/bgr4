#!/usr/bin/env ruby

puts "=== システムレビュー削除処理開始 ==="

# システムユーザーを取得
system_user = User.find_by(email: 'system@boardgamereview.com')

if system_user
  puts "システムユーザーID: #{system_user.id}"
  
  # システムレビュー総数を確認
  system_reviews_count = Review.where(user: system_user).count
  puts "削除対象システムレビュー数: #{system_reviews_count}件"
  
  if system_reviews_count > 0
    puts "\n削除を実行しますか？ (y/N)"
    puts "※この操作は取り消せません"
    
    # 実際の削除処理（自動実行）
    puts "\n=== 削除処理実行中 ==="
    
    # バッチ処理で削除（パフォーマンス向上）
    deleted_count = 0
    Review.where(user: system_user).find_in_batches(batch_size: 100) do |batch|
      batch_count = batch.size
      batch.each(&:destroy)
      deleted_count += batch_count
      puts "削除済み: #{deleted_count}/#{system_reviews_count}件"
    end
    
    puts "\n✅ システムレビュー削除完了"
    puts "削除されたレビュー数: #{deleted_count}件"
    
    # 削除後の確認
    remaining_count = Review.where(user: system_user).count
    puts "残存システムレビュー数: #{remaining_count}件"
    
    if remaining_count == 0
      puts "🎉 すべてのシステムレビューが正常に削除されました"
    else
      puts "⚠️ 一部のシステムレビューが残っています"
    end
    
  else
    puts "削除対象のシステムレビューはありません"
  end
  
else
  puts "❌ システムユーザーが見つかりません"
end

puts "\n=== システムレビュー削除処理完了 ===" 