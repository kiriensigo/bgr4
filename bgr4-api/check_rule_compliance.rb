#!/usr/bin/env ruby

require_relative 'config/environment'

puts "=== ルール準拠チェック ==="

game = Game.find_by(bgg_id: '296151')

puts "ゲーム: #{game.name}"
puts
puts "=== BGGメタデータ ==="
puts "Categories: #{game.metadata['categories']}"
puts "Mechanics: #{game.metadata['mechanics']}"

puts
puts "=== ルールに従った変換結果 ==="
converted_categories = game.get_bgg_converted_categories
converted_mechanics = game.get_bgg_converted_mechanics

puts "Categories: #{converted_categories}"
puts "Mechanics: #{converted_mechanics}"

puts
puts "=== 詳細な変換チェック ==="
puts "BGG Categories:"
game.metadata['categories'].each do |cat|
  puts "  #{cat} → 変換なし（ルールに含まれていない）"
end

puts
puts "BGG Mechanics:"
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

bgg_mechanic_to_site_category_map = {
  'Acting' => '演技',
  'Deduction' => '推理',
  'Legacy Game' => 'レガシー・キャンペーン',
  'Memory' => '記憶',
  'Negotiation' => '交渉',
  'Paper-and-Pencil' => '紙ペン',
  'Scenario / Mission / Campaign Game' => 'レガシー・キャンペーン',
  'Solo / Solitaire Game' => 'ソロ向き',
  'Pattern Building' => 'パズル',
  'Trick-taking' => 'トリテ'
}

game.metadata['mechanics'].each do |mech|
  site_mechanic = bgg_mechanic_to_site_mechanic_map[mech]
  site_category = bgg_mechanic_to_site_category_map[mech]
  
  if site_mechanic.present?
    puts "  #{mech} → #{site_mechanic} (メカニクス)"
  elsif site_category.present?
    puts "  #{mech} → #{site_category} (カテゴリー)"
  else
    puts "  #{mech} → 変換なし（ルールに含まれていない）"
  end
end 