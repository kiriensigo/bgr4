#!/usr/bin/env ruby
# encoding: utf-8

# Railsを読み込む
require File.expand_path('../../config/environment', __FILE__)
require 'optparse'

# オプションの解析
options = {
  auto_register: true,
  create_reviews: true
}

OptionParser.new do |opts|
  opts.banner = "使用法: ruby register_bgg_game.rb BGG_ID [options]"

  opts.on("-n", "--no-auto-register", "自動登録を無効にする") do
    options[:auto_register] = false
  end

  opts.on("-r", "--no-reviews", "レビューを作成しない") do
    options[:create_reviews] = false
  end

  opts.on("-f", "--force", "既に登録されている場合も強制的に登録") do
    options[:force] = true
  end

  opts.on("-h", "--help", "ヘルプを表示する") do
    puts opts
    exit
  end
end.parse!

# BGG IDの取得と検証
bgg_id = ARGV[0]
if bgg_id.nil? || bgg_id.empty?
  puts "エラー: BGG IDを指定してください"
  puts "使用法: ruby register_bgg_game.rb BGG_ID [options]"
  exit 1
end

puts "BGGゲーム登録ツール"
puts "============================================"
puts "BGG ID: #{bgg_id} のゲームを登録します"

# 既に登録されているか確認
existing_game = Game.find_by(bgg_id: bgg_id)
if existing_game && !options[:force]
  puts "⚠️ このゲーム (#{existing_game.name}) は既に登録されています (ID: #{existing_game.id})"
  puts "強制的に登録するには -f オプションを使用してください"
  exit 1
elsif existing_game && options[:force]
  puts "⚠️ このゲーム (#{existing_game.name}) は既に登録されていますが、強制オプションが指定されています"
  puts "既存のゲームを削除します..."
  existing_game.destroy
  puts "既存のゲームを削除しました"
end

begin
  # BGGからゲーム情報を取得
  puts "BGGからゲーム情報を取得しています..."
  bgg_service = BggService
  game_data = bgg_service.get_game_details(bgg_id)
  
  if game_data.nil?
    puts "❌ エラー: BGG IDが無効か、ゲーム情報を取得できませんでした"
    exit 1
  end
  
  # ゲーム情報を表示
  puts "ゲーム情報:"
  puts "- 名前: #{game_data[:name]}"
  puts "- 日本語名: #{game_data[:japanese_name]}" if game_data[:japanese_name]
  puts "- 発売年: #{game_data[:year_published]}" if game_data[:year_published]
  puts "- プレイ人数: #{game_data[:min_players]}-#{game_data[:max_players]}人"
  puts "- プレイ時間: #{game_data[:play_time]}分"
  puts "- BGG評価: #{game_data[:average_rating]}"
  
  # ゲームを登録
  puts "\nゲームを登録しています..."
  game = Game.new(
    bgg_id: bgg_id,
    name: game_data[:name],
    japanese_name: game_data[:japanese_name],
    description: game_data[:description],
    japanese_description: game_data[:japanese_description],
    image_url: game_data[:image_url],
    japanese_image_url: game_data[:japanese_image_url],
    min_players: game_data[:min_players],
    max_players: game_data[:max_players],
    play_time: game_data[:play_time],
    min_play_time: game_data[:min_play_time],
    average_score: game_data[:average_rating],
    weight: game_data[:weight],
    publisher: game_data[:publisher],
    designer: game_data[:designer],
    release_date: game_data[:release_date],
    japanese_publisher: game_data[:japanese_publisher],
    japanese_release_date: game_data[:japanese_release_date]
  )
  
  if options[:auto_register]
    game.metadata = game_data[:metadata] if game_data[:metadata]
    puts "自動登録モードが有効です。メタデータを設定しています..."
  end
  
  # ゲームを保存
  if game.save
    puts "✅ ゲームの登録に成功しました！ (ID: #{game.id})"
    
    # システムレビューを作成
    if options[:create_reviews]
      puts "\nシステムレビューを作成しています..."
      if game.create_initial_reviews(false)
        puts "✅ システムレビューの作成に成功しました"
      else
        puts "⚠️ システムレビューの作成に失敗しました"
      end
    end
  else
    puts "❌ ゲームの登録に失敗しました: #{game.errors.full_messages.join(', ')}"
    exit 1
  end
  
rescue => e
  puts "❌ エラーが発生しました: #{e.message}"
  puts e.backtrace
  exit 1
end

puts "\n============================================"
puts "処理が完了しました"
puts "============================================" 