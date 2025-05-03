#!/usr/bin/env ruby
# encoding: utf-8

# Railsを読み込む
require File.expand_path('../../config/environment', __FILE__)
require 'optparse'

# 開始時間を記録
start_time = Time.now

# オプションの解析
options = {}
OptionParser.new do |opts|
  opts.banner = "使用法: ruby update_reviews.rb [options]"

  opts.on("-g", "--game ID", "更新するゲームのID") do |id|
    options[:game_id] = id
  end

  opts.on("-l", "--limit NUM", Integer, "処理するゲーム数の上限") do |limit|
    options[:limit] = limit
  end

  opts.on("-f", "--force", "強制的に更新する（既存のレビューを削除して再作成）") do |force|
    options[:force] = force
  end

  opts.on("-b", "--bgg-id", "IDをBGG IDとして扱う") do |bgg_id|
    options[:bgg_id] = bgg_id
  end

  opts.on("-h", "--help", "ヘルプを表示する") do
    puts opts
    exit
  end
end.parse!

puts "システムレビュー更新ツール"
puts "============================================"

# システムユーザーを取得
system_user = User.find_by(email: 'system@boardgamereview.com')
if system_user.nil?
  puts "⚠️ システムユーザーが見つかりません。作成します..."
  system_user = User.create!(
    email: 'system@boardgamereview.com',
    name: 'システムレビュー',
    password: SecureRandom.hex(10)
  )
  puts "✅ システムユーザーを作成しました: ID=#{system_user.id}"
end

# 処理対象のゲームを取得
games = []

if options[:game_id]
  # 特定のゲームIDが指定された場合
  if options[:bgg_id]
    game = Game.find_by(bgg_id: options[:game_id])
    message = "BGG ID: #{options[:game_id]}"
  else
    game = Game.find_by(id: options[:game_id])
    message = "ID: #{options[:game_id]}"
  end
  
  if game
    games << game
    puts "指定された#{message}のゲームを処理します: #{game.name}"
  else
    puts "#{message}のゲームが見つかりません"
    exit
  end
else
  # 全ゲームを対象とする場合
  query = Game.all.order(created_at: :desc)
  
  # 処理数の制限
  if options[:limit]
    query = query.limit(options[:limit])
  end
  
  games = query.to_a
  puts "#{games.size}件のゲームのシステムレビューを更新します"
end

# 進捗表示のためのカウンター
success_count = 0
error_count = 0
no_reviews_count = 0

# 各ゲームのシステムレビューを更新
puts "\n処理を開始します..."
games.each_with_index do |game, index|
  begin
    puts "#{index + 1}/#{games.size}: #{game.name} (ID: #{game.id})のシステムレビューを処理中..."
    
    # 既存のシステムレビューを確認
    existing_reviews = game.reviews.where(user_id: system_user.id).count
    
    # 強制更新オプションが指定されている場合は既存のレビューを削除
    if options[:force] && existing_reviews > 0
      puts "  既存のシステムレビュー(#{existing_reviews}件)を削除します..."
      game.reviews.where(user_id: system_user.id).destroy_all
      existing_reviews = 0
    end
    
    if existing_reviews > 0 && !options[:force]
      puts "⚠️ 既に#{existing_reviews}件のシステムレビューがあります。スキップします。"
      puts "  強制的に更新するには -f オプションを使用してください。"
      no_reviews_count += 1
      next
    end
    
    # システムレビューを更新
    result = game.update_system_reviews
    
    # 結果を確認
    if result
      puts "✅ 更新成功: システムレビューを更新しました"
      success_count += 1
    else
      puts "⚠️ 警告: 更新処理を実行しましたが、変更がありませんでした"
      no_reviews_count += 1
    end
  rescue => e
    puts "❌ エラー: #{e.message}"
    puts e.backtrace[0..5].join("\n")
    error_count += 1
  end
  
  # 進捗状況を表示
  puts "進捗: #{index + 1}/#{games.size} (#{((index + 1.0) / games.size * 100).round(1)}%)"
  puts "--------------------------------------------"
  
  # 負荷を減らすために少し待機
  sleep(0.5) unless index == games.size - 1
end

# 所要時間を計算
duration = Time.now - start_time
minutes = (duration / 60).to_i
seconds = (duration % 60).round

# 結果を表示
puts "\n============================================"
puts "処理が完了しました"
puts "処理件数: #{games.size}件"
puts "成功: #{success_count}件"
puts "スキップ/変更なし: #{no_reviews_count}件"
puts "エラー: #{error_count}件"
puts "所要時間: #{minutes}分#{seconds}秒"
puts "============================================" 