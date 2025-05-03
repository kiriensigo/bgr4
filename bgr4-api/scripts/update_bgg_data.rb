#!/usr/bin/env ruby
# encoding: utf-8

# Railsを読み込む
require File.expand_path('../../config/environment', __FILE__)
require 'net/http'
require 'json'
require 'optparse'

# 開始時間を記録
start_time = Time.now

# オプションの解析
options = {}
OptionParser.new do |opts|
  opts.banner = "使用法: ruby update_bgg_data.rb [options]"

  opts.on("-g", "--game ID", "更新するゲームのBGG ID") do |id|
    options[:game_id] = id
  end

  opts.on("-l", "--limit NUM", Integer, "処理するゲーム数の上限") do |limit|
    options[:limit] = limit
  end

  opts.on("-s", "--skip-existing", "既存のデータがあるゲームはスキップする") do |skip|
    options[:skip_existing] = skip
  end

  opts.on("-h", "--help", "ヘルプを表示する") do
    puts opts
    exit
  end
end.parse!

puts "BGGデータ更新ツール"
puts "============================================"

# 処理対象のゲームを取得
games = []

if options[:game_id]
  # 特定のゲームIDが指定された場合
  game = Game.find_by(bgg_id: options[:game_id])
  if game
    games << game
    puts "指定されたBGG ID: #{options[:game_id]} のゲームを処理します"
  else
    puts "BGG ID: #{options[:game_id]} のゲームが見つかりません"
    exit
  end
else
  # 全ゲームを対象とする場合
  query = Game.all.order(created_at: :desc)
  
  # 既存データがあるゲームをスキップするオプション
  if options[:skip_existing]
    query = query.where("japanese_name IS NULL OR japanese_publisher IS NULL OR japanese_release_date IS NULL")
  end
  
  # 処理数の制限
  if options[:limit]
    query = query.limit(options[:limit])
  end
  
  games = query.to_a
  puts "#{games.size}件のゲームを処理します"
end

# 進捗表示のためのカウンター
success_count = 0
error_count = 0
no_change_count = 0

# 各ゲームのBGGデータを更新
puts "\n処理を開始します..."
games.each_with_index do |game, index|
  begin
    puts "#{index + 1}/#{games.size}: #{game.name} (BGG ID: #{game.bgg_id})を処理中..."
    
    # 更新前の状態を記録
    had_japanese_name = game.japanese_name.present?
    had_japanese_publisher = game.japanese_publisher.present?
    had_japanese_release_date = game.japanese_release_date.present?
    
    # BGGからデータを更新
    result = game.update_from_bgg(true)
    
    # 更新後の状態を確認
    if result
      # 変更があったかどうかチェック
      changes = []
      changes << "日本語名" if !had_japanese_name && game.japanese_name.present?
      changes << "日本語出版社" if !had_japanese_publisher && game.japanese_publisher.present?
      changes << "日本語版発売日" if !had_japanese_release_date && game.japanese_release_date.present?
      
      if changes.any?
        puts "✅ 更新成功: #{changes.join(', ')}を更新しました"
        success_count += 1
      else
        puts "ℹ️ 変更なし: 既存のデータと同じでした"
        no_change_count += 1
      end
    else
      puts "⚠️ 警告: 更新は成功しましたが、変更はありませんでした"
      no_change_count += 1
    end
  rescue => e
    puts "❌ エラー: #{e.message}"
    error_count += 1
  end
  
  # 進捗状況を表示
  puts "進捗: #{index + 1}/#{games.size} (#{((index + 1.0) / games.size * 100).round(1)}%)"
  puts "--------------------------------------------"
  
  # APIへの負荷を減らすために少し待機
  sleep(1) unless index == games.size - 1
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
puts "変更なし: #{no_change_count}件"
puts "エラー: #{error_count}件"
puts "所要時間: #{minutes}分#{seconds}秒"
puts "============================================"