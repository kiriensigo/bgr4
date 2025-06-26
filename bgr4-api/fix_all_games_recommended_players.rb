#!/usr/bin/env ruby

require_relative 'config/environment'

puts "🎮 全ゲームプレイ人数推奨設定修正"
puts "=" * 60
puts "📋 処理内容："
puts "1. BGGの投票データ（Best + Recommended ≥ 50%）に基づく正確な推奨人数設定"
puts "2. 1人・2人などの低推奨度人数を適切に除外"
puts "3. site_recommended_playersを正しい値に更新"
puts "=" * 60

def fix_recommended_players(game)
  puts "\n🎯 処理中: #{game.name} (ID: #{game.id}, BGG ID: #{game.bgg_id})"
  
  # 現在の設定を表示
  current_recommended = game.read_attribute(:site_recommended_players) || []
  puts "  📋 現在の推奨人数: #{current_recommended.inspect}"
  
  # BGGメタデータを確認
  if game.metadata.present? && game.metadata['recommended_num_players'].present?
    bgg_recommended = game.metadata['recommended_num_players']
    puts "  🎯 BGG推奨人数: #{bgg_recommended.inspect}"
    
    # 更新実行
    begin
      result = game.update_site_recommended_players
      puts "  ✅ 更新完了: #{result.inspect}"
      
      # 変更があったかチェック
      if current_recommended != result
        puts "  🔄 変更あり: #{current_recommended.inspect} → #{result.inspect}"
        return { updated: true, before: current_recommended, after: result }
      else
        puts "  ➖ 変更なし: #{result.inspect}"
        return { updated: false, value: result }
      end
    rescue => e
      puts "  ❌ エラー: #{e.message}"
      return { error: e.message }
    end
  else
    puts "  ⚠️ BGGメタデータなし、スキップ"
    return { skipped: true, reason: 'no_bgg_metadata' }
  end
end

# メイン処理
total_games = Game.count
puts "\n📊 処理対象: #{total_games}件のゲーム"
puts "開始時刻: #{Time.current}"

processed = 0
updated = 0
no_change = 0
skipped = 0
errors = 0
changes_log = []

Game.find_each.with_index do |game, index|
  begin
    result = fix_recommended_players(game)
    
    if result[:updated]
      updated += 1
      changes_log << {
        game: game.name,
        bgg_id: game.bgg_id,
        before: result[:before],
        after: result[:after]
      }
    elsif result[:skipped]
      skipped += 1
    elsif result[:error]
      errors += 1
    else
      no_change += 1
    end
    
    processed += 1
    
    # 進捗表示（10件ごと）
    if (index + 1) % 10 == 0
      progress = ((index + 1).to_f / total_games * 100).round(1)
      puts "\n📈 進捗: #{index + 1}/#{total_games} (#{progress}%) | 更新: #{updated} | 変更なし: #{no_change} | スキップ: #{skipped} | エラー: #{errors}"
    end
    
  rescue => e
    errors += 1
    puts "\n❌ 致命的エラー (#{game.name}): #{e.message}"
    puts e.backtrace.first(3).join("\n")
  end
end

puts "\n" + "=" * 60
puts "🎉 全ゲームプレイ人数推奨設定修正完了！"
puts "=" * 60
puts "📊 最終結果:"
puts "  総処理数: #{processed}件"
puts "  更新: #{updated}件"
puts "  変更なし: #{no_change}件"
puts "  スキップ: #{skipped}件"
puts "  エラー: #{errors}件"
puts "  更新率: #{(updated.to_f / processed * 100).round(1)}%"
puts "完了時刻: #{Time.current}"

if changes_log.any?
  puts "\n📋 更新されたゲーム一覧:"
  changes_log.each do |change|
    puts "  🎮 #{change[:game]} (BGG: #{change[:bgg_id]})"
    puts "    変更: #{change[:before].inspect} → #{change[:after].inspect}"
  end
end

puts "\n🌟 BGGの投票データに基づく正確なプレイ人数推奨設定が完了しました！"
puts "💪 50%未満の低推奨度人数は適切に除外されています！" 