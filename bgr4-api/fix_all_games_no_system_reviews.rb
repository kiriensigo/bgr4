#!/usr/bin/env ruby

require_relative 'config/environment'

puts "🚀 全ゲーム修正（システムレビュー廃止対応）"
puts "=" * 60
puts "📋 新ルール適用："
puts "1. システムレビューは完全廃止"
puts "2. BGGメタデータを×10で直接重み付け"
puts "3. カテゴリー・メカニクス・プレイ人数をBGG基準で設定"
puts "=" * 60

def fix_game_metadata_only(game)
  puts "\n🎯 修正中: #{game.name} (ID: #{game.id}, BGG ID: #{game.bgg_id})"
  
  # BGGからメタデータを更新（メタデータが空の場合のみ）
  if game.metadata.blank? || game.metadata.empty?
    puts "  🔄 BGGメタデータ取得中..."
    begin
      if game.update_from_bgg(true) # force_update = true
        game.reload
        puts "  ✅ BGGメタデータ更新完了"
      else
        puts "  ⚠️ BGGメタデータ取得失敗、スキップ"
        return false
      end
    rescue => e
      puts "  ❌ BGGメタデータエラー: #{e.message}"
      return false
    end
  else
    puts "  ✅ メタデータ既存、BGG変換処理のみ実行"
  end
  
  # メタデータ確認
  if game.metadata.blank? || game.metadata.empty?
    puts "  ⚠️ メタデータが依然として空、スキップ"
    return false
  end
  
  puts "  📋 メタデータ確認:"
  puts "    Categories: #{game.categories&.length || 0}個"
  puts "    Mechanics: #{game.mechanics&.length || 0}個"
  puts "    Best Players: #{game.best_num_players}"
  puts "    Recommended Players: #{game.recommended_num_players}"
  
  # BGG変換されたカテゴリーとメカニクスを取得
  converted_categories = game.get_bgg_converted_categories
  converted_mechanics = game.get_bgg_converted_mechanics
  
  puts "  🔄 BGG→サイト変換結果:"
  puts "    カテゴリー: #{converted_categories.join(', ')}"
  puts "    メカニクス: #{converted_mechanics.join(', ')}"
  
  # 既存のBGG重み付けカテゴリーを削除（システムレビューに紐づかない直接登録分）
  # レビューと紐づいていないGameCategoryReviewを特定して削除
  existing_bgg_cat_reviews = game.game_category_reviews.left_joins(:review).where(reviews: { id: nil })
  if existing_bgg_cat_reviews.any?
    puts "  🗑️ 既存BGGカテゴリー重み付け削除: #{existing_bgg_cat_reviews.count}件"
    existing_bgg_cat_reviews.destroy_all
  end
  
  existing_bgg_mech_reviews = game.game_mechanic_reviews.left_joins(:review).where(reviews: { id: nil })
  if existing_bgg_mech_reviews.any?
    puts "  🗑️ 既存BGGメカニクス重み付け削除: #{existing_bgg_mech_reviews.count}件"
    existing_bgg_mech_reviews.destroy_all
  end
  
  # カテゴリーを×10で直接登録（レビューと紐づけない）
  converted_categories.each do |category_name|
    begin
      category = GameCategory.find_or_create_by!(name: category_name)
      
      10.times do
        GameCategoryReview.create!(
          game: game,
          game_category: category,
          review_id: nil  # レビューと紐づけない
        )
      end
      puts "    📂 #{category_name} を×10で直接登録"
    rescue => e
      puts "    ❌ カテゴリー登録エラー (#{category_name}): #{e.message}"
    end
  end
  
  # メカニクスを×10で直接登録（レビューと紐づけない）
  converted_mechanics.each do |mechanic_name|
    begin
      mechanic = GameMechanic.find_or_create_by!(name: mechanic_name)
      
      10.times do
        GameMechanicReview.create!(
          game: game,
          game_mechanic: mechanic,
          review_id: nil  # レビューと紐づけない
        )
      end
      puts "    🔧 #{mechanic_name} を×10で直接登録"
    rescue => e
      puts "    ❌ メカニクス登録エラー (#{mechanic_name}): #{e.message}"
    end
  end
  
  # プレイ人数推奨設定を更新（BGG重み付け）
  begin
    game.update_site_recommended_players
    puts "  🎮 プレイ人数推奨設定更新完了"
  rescue => e
    puts "  ❌ プレイ人数推奨設定エラー: #{e.message}"
  end
  
  puts "  🎉 #{game.name} の修正完了！"
  true
end

# メイン処理
total_games = Game.count
puts "\n📊 処理対象: #{total_games}件のゲーム"
puts "開始時刻: #{Time.current}"

processed = 0
success = 0
errors = 0
skipped = 0

Game.find_each.with_index do |game, index|
  begin
    result = fix_game_metadata_only(game)
    if result
      success += 1
    else
      skipped += 1
    end
    processed += 1
    
    if (index + 1) % 10 == 0
      progress = ((index + 1).to_f / total_games * 100).round(1)
      puts "\n📈 進捗: #{index + 1}/#{total_games} (#{progress}%) | 成功: #{success} | スキップ: #{skipped} | エラー: #{errors}"
    end
    
  rescue => e
    errors += 1
    puts "\n❌ 致命的エラー (#{game.name}): #{e.message}"
    puts e.backtrace.first(3).join("\n")
  end
end

puts "\n" + "=" * 60
puts "🎉 全ゲーム修正完了！"
puts "=" * 60
puts "📊 最終結果:"
puts "  総処理数: #{processed}件"
puts "  成功: #{success}件"
puts "  スキップ: #{skipped}件"
puts "  エラー: #{errors}件"
puts "  成功率: #{(success.to_f / processed * 100).round(1)}%"
puts "完了時刻: #{Time.current}"
puts ""
puts "💪 システムレビュー廃止ルールに従って修正完了！"
puts "🌟 BGG重み付け×10方式でカテゴリー・メカニクス・プレイ人数が正常表示されます！" 