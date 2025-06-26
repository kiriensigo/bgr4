#!/usr/bin/env ruby

require_relative 'config/environment'

puts "=== メタデータ構造の詳細調査 ==="
puts ""

# ゲームID: 296151を確認
game_id = "296151"
game = Game.find_by(bgg_id: game_id)

if game && game.metadata.present?
  puts "ゲーム名: #{game.name}"
  puts ""
  
  metadata = game.metadata
  puts "=== メタデータの型と内容 ==="
  puts "メタデータのクラス: #{metadata.class}"
  puts ""
  
  puts "=== カテゴリとメカニクスの詳細 ==="
  puts "BGGカテゴリ: #{metadata['categories'].inspect}"
  puts "BGGメカニクス: #{metadata['mechanics'].inspect}"
  puts ""
  
  puts "=== BGG変換テスト ==="
  bgg_cats = game.get_bgg_converted_categories
  bgg_mechs = game.get_bgg_converted_mechanics
  
  puts "BGG変換カテゴリ: #{bgg_cats}"
  puts "BGG変換メカニクス: #{bgg_mechs}"
  puts ""
  
  puts "=== 人気カテゴリ・メカニクス ==="
  pop_cats = game.popular_categories
  pop_mechs = game.popular_mechanics
  
  puts "人気カテゴリ: #{pop_cats.map { |c| c[:name] }.join(', ')}"
  puts "人気メカニクス: #{pop_mechs.map { |m| m[:name] }.join(', ')}"
  puts ""
  
  # レビュー数確認
  puts "=== レビュー情報 ==="
  reviews_count = game.reviews.count
  puts "レビュー数: #{reviews_count}"
  
  # 変換の詳細を確認
  puts ""
  puts "=== 変換の詳細確認 ==="
  
  if metadata['categories'].is_a?(Array)
    puts "カテゴリ変換:"
    bgg_category_to_site_category_map = {
      'Animals' => '動物',
      'Bluffing' => 'ブラフ',
      'Card Game' => 'カードゲーム',
      "Children's Game" => '子供向け',
      'Deduction' => '推理',
      'Memory' => '記憶',
      'Negotiation' => '交渉',
      'Party Game' => 'パーティー',
      'Puzzle' => 'パズル',
      'Wargame' => 'ウォーゲーム',
      'Word Game' => 'ワードゲーム'
    }
    
    metadata['categories'].each do |cat|
      converted = bgg_category_to_site_category_map[cat]
      puts "  #{cat} → #{converted || '変換なし'}"
    end
  end
  
  if metadata['mechanics'].is_a?(Array)
    puts "メカニクス変換:"
    bgg_mechanic_to_site_mechanic_map = {
      'Area Majority / Influence' => 'エリア支配',
      'Auction / Bidding' => 'オークション',
      'Cooperative Game' => '協力',
      'Deck, Bag, and Pool Building' => 'デッキ/バッグビルド',
      'Dice Rolling' => 'ダイスロール',
      'Hidden Roles' => '正体隠匿',
      'Worker Placement' => 'ワカプレ',
      'Set Collection' => 'セット収集',
      'Tile Placement' => 'タイル配置',
      'Variable Player Powers' => 'プレイヤー別能力',
      'Network and Route Building' => 'ルート構築',
      'Open Drafting' => 'ドラフト',
      'Closed Drafting' => 'ドラフト',
      'Push Your Luck' => 'バースト',
      'Simultaneous Action Selection' => '同時手番',
      'Modular Board' => 'モジュラーボード',
      'Betting and Bluffing' => '賭け',
      'Deck Construction' => 'デッキ/バッグビルド',
      'Variable Set-up' => 'プレイヤー別能力',
      'Worker Placement with Dice Workers' => 'ワカプレ',
      'Worker Placement, Different Worker Types' => 'ワカプレ'
    }
    
    metadata['mechanics'].each do |mech|
      converted = bgg_mechanic_to_site_mechanic_map[mech]
      puts "  #{mech} → #{converted || '変換なし'}"
    end
  end
  
else
  puts "ゲームまたはメタデータが見つかりません"
end 