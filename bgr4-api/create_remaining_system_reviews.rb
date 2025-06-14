#!/usr/bin/env ruby

# 残りの全ゲームにシステムレビューを作成するスクリプト
puts "=== 残りの全ゲームのシステムレビュー作成開始 ==="

system_user = User.find_by(email: 'system@boardgamereview.com')

if !system_user
  puts "エラー: システムユーザーが見つかりません"
  exit 1
end

puts "システムユーザー: #{system_user.name} (ID: #{system_user.id})"

# 現在のシステムレビュー状況を確認
current_reviews = Review.where(user_id: system_user.id)
games_with_reviews = current_reviews.group(:game_id).count

# システムレビューが不足しているゲームを特定
all_games = Game.all
games_needing_reviews = all_games.select do |game|
  current_count = games_with_reviews[game.bgg_id] || 0
  current_count < 10
end

puts "対象ゲーム数: #{games_needing_reviews.count}"
puts "現在の総システムレビュー数: #{current_reviews.count}"
puts ""

if games_needing_reviews.empty?
  puts "全てのゲームで10件のシステムレビューが作成済みです。"
  exit 0
end

# デフォルトのゲームデータ（BGGの平均的な評価を基準）
default_game_data = {
  overall: 7.0,
  complexity: 3.0,
  categories: ['戦略ゲーム'],
  mechanics: []
}

# 特定のゲームの詳細データ（BGGの実際のデータに基づく）
specific_game_data = {
  115746 => { overall: 8.4, complexity: 4.2, categories: ['戦略ゲーム'], mechanics: ['エリア支配', 'ダイス'] }, # War of the Ring: Second Edition
  182028 => { overall: 8.3, complexity: 4.4, categories: ['戦略ゲーム'], mechanics: ['カード', 'ドラフト'] }, # Through the Ages: A New Story of Civilization
  193738 => { overall: 8.2, complexity: 3.7, categories: ['戦略ゲーム'], mechanics: ['デッキ/バッグビルド'] }, # Great Western Trail
  246900 => { overall: 8.1, complexity: 3.7, categories: ['戦略ゲーム'], mechanics: ['エリア支配'] }, # Eclipse: Second Dawn for the Galaxy
  295770 => { overall: 8.8, complexity: 3.9, categories: ['戦略ゲーム', 'ソロ向き'], mechanics: ['協力', 'レガシー・キャンペーン'] }, # Frosthaven
  167355 => { overall: 8.1, complexity: 3.4, categories: ['戦略ゲーム'], mechanics: ['協力'] }, # Nemesis
  177736 => { overall: 8.1, complexity: 3.9, categories: ['戦略ゲーム'], mechanics: ['ワカプレ', 'パズル'] }, # A Feast for Odin
  341169 => { overall: 8.3, complexity: 3.8, categories: ['戦略ゲーム'], mechanics: ['デッキ/バッグビルド'] }, # Great Western Trail: Second Edition
  205637 => { overall: 8.3, complexity: 3.2, categories: ['戦略ゲーム'], mechanics: ['協力', 'カード'] }, # Arkham Horror: The Card Game
  192135 => { overall: 8.2, complexity: 3.6, categories: ['戦略ゲーム'], mechanics: ['ダイス', 'RPG'] }, # Too Many Bones
  373106 => { overall: 7.9, complexity: 2.0, categories: ['ペア向き'], mechanics: ['協力', 'リアルタイム'] }, # Sky Team
  96848 => { overall: 8.1, complexity: 4.3, categories: ['戦略ゲーム', 'ソロ向き'], mechanics: ['デッキ/バッグビルド'] }, # Mage Knight Board Game
  251247 => { overall: 8.0, complexity: 3.9, categories: ['戦略ゲーム'], mechanics: ['ワカプレ'] }, # Barrage
  324856 => { overall: 8.0, complexity: 2.0, categories: ['協力ゲーム'], mechanics: ['協力', 'トリックテイキング'] }, # The Crew: Mission Deep Sea
  366013 => { overall: 8.0, complexity: 2.2, categories: ['レースゲーム'], mechanics: ['プログラム', 'シミュレーション'] }, # Heat: Pedal to the Metal
  285774 => { overall: 8.1, complexity: 2.9, categories: ['戦略ゲーム'], mechanics: ['協力', 'カード'] }, # Marvel Champions: The Card Game
  521 => { overall: 7.8, complexity: 1.3, categories: ['アクション'], mechanics: ['フリック'] }, # Crokinole
  247763 => { overall: 8.0, complexity: 3.4, categories: ['戦略ゲーム'], mechanics: ['ワカプレ', 'カード'] }, # Underwater Cities
  253344 => { overall: 8.0, complexity: 2.8, categories: ['戦略ゲーム'], mechanics: ['協力', 'ダイス'] }, # Cthulhu: Death May Die
  255984 => { overall: 8.2, complexity: 3.0, categories: ['戦略ゲーム', 'ソロ向き'], mechanics: ['協力', 'ストーリーテリング'] }, # Sleeping Gods
  205059 => { overall: 7.8, complexity: 2.6, categories: ['戦略ゲーム'], mechanics: ['協力', 'アプリ'] }, # Mansions of Madness: Second Edition
  35677 => { overall: 7.9, complexity: 3.8, categories: ['戦略ゲーム'], mechanics: ['ワカプレ'] }, # Le Havre
  284083 => { overall: 7.8, complexity: 2.0, categories: ['協力ゲーム'], mechanics: ['協力', 'トリックテイキング'] }, # The Crew: The Quest for Planet Nine
  157354 => { overall: 8.0, complexity: 2.8, categories: ['戦略ゲーム'], mechanics: ['エリア支配', 'オークション'] }, # Five Tribes: The Djinns of Naqala
  191189 => { overall: 7.9, complexity: 2.8, categories: ['戦略ゲーム'], mechanics: ['協力', 'デッキ/バッグビルド'] }, # Aeon's End
  175914 => { overall: 8.1, complexity: 4.2, categories: ['戦略ゲーム'], mechanics: ['ルート構築'] }, # Food Chain Magnate
  256960 => { overall: 8.1, complexity: 3.8, categories: ['戦略ゲーム'], mechanics: ['エリア支配', 'カード'] }, # Pax Pamir: Second Edition
  314040 => { overall: 8.4, complexity: 3.0, categories: ['戦略ゲーム'], mechanics: ['協力', 'レガシー・キャンペーン'] }, # Pandemic Legacy: Season 0
  102794 => { overall: 8.1, complexity: 3.8, categories: ['戦略ゲーム'], mechanics: ['ワカプレ', 'タイル配置'] }, # Caverna: The Cave Farmers
  185343 => { overall: 8.1, complexity: 4.5, categories: ['戦略ゲーム'], mechanics: ['ワカプレ'] }, # Anachrony
  184267 => { overall: 8.1, complexity: 4.6, categories: ['戦略ゲーム'], mechanics: ['ワカプレ'] }, # On Mars
  170216 => { overall: 8.0, complexity: 2.9, categories: ['戦略ゲーム'], mechanics: ['エリア支配', 'ドラフト'] }, # Blood Rage
  161533 => { overall: 8.1, complexity: 4.5, categories: ['戦略ゲーム'], mechanics: ['ワカプレ'] }, # Lisboa
  231733 => { overall: 8.0, complexity: 3.6, categories: ['戦略ゲーム'], mechanics: ['ワカプレ'] }, # Obsession
  221107 => { overall: 8.3, complexity: 3.2, categories: ['戦略ゲーム'], mechanics: ['協力', 'レガシー・キャンペーン'] }, # Pandemic Legacy: Season 2
  126163 => { overall: 8.1, complexity: 4.0, categories: ['戦略ゲーム'], mechanics: ['ワカプレ'] }, # Tzolk'in: The Mayan Calendar
  2651 => { overall: 7.9, complexity: 3.3, categories: ['戦略ゲーム'], mechanics: ['オークション', 'ルート構築'] }, # Power Grid
  244521 => { overall: 7.8, complexity: 1.9, categories: ['ファミリーゲーム'], mechanics: ['デッキ/バッグビルド'] }, # Quacks
  216132 => { overall: 8.0, complexity: 3.4, categories: ['戦略ゲーム'], mechanics: ['ワカプレ'] }, # Clans of Caledonia
  266810 => { overall: 8.0, complexity: 3.6, categories: ['戦略ゲーム'], mechanics: ['ワカプレ'] }, # Paladins of the West Kingdom
  125153 => { overall: 8.0, complexity: 4.2, categories: ['戦略ゲーム'], mechanics: ['ワカプレ'] }, # The Gallerist
  276025 => { overall: 8.0, complexity: 3.8, categories: ['戦略ゲーム'], mechanics: ['ワカプレ'] }, # Maracaibo
  164153 => { overall: 8.1, complexity: 3.2, categories: ['戦略ゲーム'], mechanics: ['ダイス', 'RPG'] }, # Star Wars: Imperial Assault
  124742 => { overall: 8.0, complexity: 3.0, categories: ['カードゲーム'], mechanics: ['カード', 'ブラフ'] }, # Android: Netrunner
  209010 => { overall: 8.2, complexity: 2.4, categories: ['戦略ゲーム'], mechanics: ['協力', 'プログラム'] }, # Mechs vs. Minions
  200680 => { overall: 8.0, complexity: 3.6, categories: ['戦略ゲーム'], mechanics: ['ワカプレ'] }, # Agricola (Revised Edition)
  28143 => { overall: 7.8, complexity: 2.8, categories: ['戦略ゲーム'], mechanics: ['カード', 'エンジンビルド'] }, # Race for the Galaxy
  201808 => { overall: 7.7, complexity: 2.5, categories: ['戦略ゲーム'], mechanics: ['デッキ/バッグビルド'] }, # Clank!: A Deck-Building Adventure
  72125 => { overall: 7.6, complexity: 3.6, categories: ['戦略ゲーム'], mechanics: ['エリア支配'] }, # Eclipse: New Dawn for the Galaxy
  159675 => { overall: 8.0, complexity: 3.9, categories: ['戦略ゲーム'], mechanics: ['ワカプレ'] }, # Fields of Arle
  62219 => { overall: 7.9, complexity: 4.0, categories: ['戦略ゲーム'], mechanics: ['エリア支配'] }, # Dominant Species
  68448 => { overall: 7.8, complexity: 2.3, categories: ['戦略ゲーム'], mechanics: ['ドラフト', 'セット収集'] }, # 7 Wonders
  121921 => { overall: 7.9, complexity: 3.8, categories: ['戦略ゲーム'], mechanics: ['協力', 'ストーリーテリング'] }, # Robinson Crusoe: Adventures on the Cursed Island
  171623 => { overall: 8.1, complexity: 3.2, categories: ['戦略ゲーム'], mechanics: ['ワカプレ'] }, # The Voyages of Polo
  225694 => { overall: 7.9, complexity: 1.8, categories: ['パーティーゲーム'], mechanics: ['協力', 'コミュニケーション'] }, # Decrypto
  163068 => { overall: 8.1, complexity: 4.2, categories: ['戦略ゲーム'], mechanics: ['ワカプレ'] }, # Trickerion: Legends of Illusion
  155821 => { overall: 7.9, complexity: 3.2, categories: ['戦略ゲーム'], mechanics: ['エリア支配', 'ドラフト'] }, # Inis
  37111 => { overall: 7.6, complexity: 3.2, categories: ['戦略ゲーム'], mechanics: ['協力', 'ブラフ'] }, # Battlestar Galactica: The Board Game
  310873 => { overall: 8.0, complexity: 3.8, categories: ['戦略ゲーム'], mechanics: ['ワカプレ'] }, # Carnegie
  236457 => { overall: 8.0, complexity: 2.9, categories: ['戦略ゲーム'], mechanics: ['ワカプレ'] }, # Architects of the West Kingdom
  217372 => { overall: 7.8, complexity: 2.3, categories: ['ファミリーゲーム'], mechanics: ['デッキ/バッグビルド'] }, # The Quest for El Dorado
  122515 => { overall: 8.1, complexity: 3.3, categories: ['戦略ゲーム'], mechanics: ['オークション', 'ワカプレ'] }, # Keyflower
  170042 => { overall: 8.0, complexity: 2.5, categories: ['戦略ゲーム'], mechanics: ['ワカプレ'] }, # Raiders of the North Sea
  42 => { overall: 7.8, complexity: 3.5, categories: ['戦略ゲーム'], mechanics: ['エリア支配', 'タイル配置'] }, # Tigris & Euphrates
  40834 => { overall: 7.6, complexity: 2.4, categories: ['戦略ゲーム'], mechanics: ['カード', 'ドラフト'] }, # Dominion: Intrigue
  12 => { overall: 7.3, complexity: 2.5, categories: ['戦略ゲーム'], mechanics: ['オークション', 'セット収集'] }, # Ra
  18602 => { overall: 7.4, complexity: 3.6, categories: ['戦略ゲーム'], mechanics: ['ワカプレ'] }, # Caylus
  73439 => { overall: 8.1, complexity: 3.4, categories: ['戦略ゲーム'], mechanics: ['ワカプレ', 'ダイス'] }, # Troyes
  203993 => { overall: 8.0, complexity: 3.2, categories: ['戦略ゲーム'], mechanics: ['ワカプレ'] }, # Lorenzo il Magnifico
  146021 => { overall: 7.8, complexity: 3.2, categories: ['戦略ゲーム'], mechanics: ['協力', 'ダイス'] }, # Eldritch Horror
  172386 => { overall: 8.0, complexity: 3.4, categories: ['戦略ゲーム'], mechanics: ['ワカプレ'] }, # Mombasa
  4098 => { overall: 7.4, complexity: 4.3, categories: ['戦略ゲーム'], mechanics: ['ルート構築'] }, # Age of Steam
  163412 => { overall: 7.6, complexity: 1.6, categories: ['ファミリーゲーム'], mechanics: ['タイル配置', 'パズル'] }, # Patchwork
  12493 => { overall: 7.5, complexity: 4.2, categories: ['戦略ゲーム'], mechanics: ['エリア支配'] }, # Twilight Imperium: Third Edition
  36218 => { overall: 7.6, complexity: 2.4, categories: ['戦略ゲーム'], mechanics: ['カード', 'デッキ/バッグビルド'] }, # Dominion
  102680 => { overall: 8.0, complexity: 4.2, categories: ['戦略ゲーム'], mechanics: ['ワカプレ'] }, # Trajan
  144733 => { overall: 8.0, complexity: 3.4, categories: ['戦略ゲーム'], mechanics: ['ワカプレ'] }, # Russian Railroads
  218417 => { overall: 8.0, complexity: 2.8, categories: ['戦略ゲーム'], mechanics: ['協力', 'デッキ/バッグビルド'] }, # Aeon's End: War Eternal
  43015 => { overall: 7.4, complexity: 3.0, categories: ['戦略ゲーム'], mechanics: ['ルート構築'] }, # Hansa Teutonica
  205896 => { overall: 8.0, complexity: 3.3, categories: ['戦略ゲーム'], mechanics: ['エリア支配', 'ドラフト'] }, # Rising Sun
  180263 => { overall: 8.1, complexity: 2.3, categories: ['戦略ゲーム', 'ソロ向き'], mechanics: ['協力', 'ストーリーテリング'] }, # The 7th Continent
  196340 => { overall: 8.0, complexity: 3.4, categories: ['戦略ゲーム'], mechanics: ['ワカプレ'] }, # Yokohama
  233371 => { overall: 7.8, complexity: 2.6, categories: ['戦略ゲーム'], mechanics: ['デッキ/バッグビルド'] }, # Clank! In! Space!: A Deck-Building Adventure
  175155 => { overall: 7.9, complexity: 3.9, categories: ['戦略ゲーム'], mechanics: ['エリア支配'] }, # Forbidden Stars
  254640 => { overall: 7.8, complexity: 1.1, categories: ['パーティーゲーム'], mechanics: ['協力', 'コミュニケーション'] }, # Just One
  178900 => { overall: 7.7, complexity: 1.2, categories: ['パーティーゲーム'], mechanics: ['協力', 'コミュニケーション'] }, # Codenames
  172287 => { overall: 7.7, complexity: 2.9, categories: ['戦略ゲーム'], mechanics: ['ワカプレ', 'ダイス'] }, # Champions of Midgard
  266524 => { overall: 7.8, complexity: 2.2, categories: ['ファミリーゲーム'], mechanics: ['セット収集', 'ルート構築'] }, # PARKS
  220877 => { overall: 8.0, complexity: 3.4, categories: ['戦略ゲーム'], mechanics: ['ワカプレ'] }, # Rajas of the Ganges
  304783 => { overall: 7.9, complexity: 1.9, categories: ['ファミリーゲーム'], mechanics: ['ロール&ライト'] }, # Hadrian's Wall
  132531 => { overall: 7.5, complexity: 2.8, categories: ['戦略ゲーム'], mechanics: ['ダイス', 'エンジンビルド'] }, # Roll for the Galaxy
  30549 => { overall: 7.6, complexity: 2.4, categories: ['戦略ゲーム'], mechanics: ['協力', 'セット収集'] }, # Pandemic
  189932 => { overall: 7.8, complexity: 3.2, categories: ['戦略ゲーム'], mechanics: ['エリア支配', 'デッキ/バッグビルド'] }, # Tyrants of the Underdark
  118048 => { overall: 7.4, complexity: 2.2, categories: ['ペア向き'], mechanics: ['セット収集'] }, # Targi
  463 => { overall: 7.2, complexity: 3.0, categories: ['カードゲーム'], mechanics: ['カード', 'デッキ/バッグビルド'] }, # Magic: The Gathering
  147020 => { overall: 7.6, complexity: 2.1, categories: ['カードゲーム'], mechanics: ['デッキ/バッグビルド'] }, # Star Realms
  262712 => { overall: 7.8, complexity: 3.1, categories: ['戦略ゲーム'], mechanics: ['エンジンビルド', 'セット収集'] }, # Res Arcana
  263918 => { overall: 7.8, complexity: 1.9, categories: ['ファミリーゲーム'], mechanics: ['ロール&ライト'] }, # Cartographers
  161970 => { overall: 7.9, complexity: 4.0, categories: ['戦略ゲーム'], mechanics: ['ワカプレ'] }, # Alchemists
  14996 => { overall: 7.4, complexity: 1.8, categories: ['ファミリーゲーム'], mechanics: ['ルート構築', 'セット収集'] }, # Ticket to Ride: Europe
  274364 => { overall: 7.9, complexity: 2.2, categories: ['ペア向き'], mechanics: ['カード', 'エリア支配'] }, # Watergate
  271324 => { overall: 7.8, complexity: 2.4, categories: ['戦略ゲーム'], mechanics: ['ドラフト', 'エンジンビルド'] }, # It's a Wonderful World
  281259 => { overall: 7.8, complexity: 1.4, categories: ['ファミリーゲーム'], mechanics: ['ドラフト', 'パズル'] }, # The Isle of Cats
  268864 => { overall: 8.0, complexity: 2.0, categories: ['戦略ゲーム'], mechanics: ['カード', 'シナリオ'] }, # Undaunted: Normandy
  77423 => { overall: 7.8, complexity: 2.9, categories: ['戦略ゲーム'], mechanics: ['協力', 'カード'] }, # The Lord of the Rings: The Card Game
  34635 => { overall: 7.6, complexity: 2.4, categories: ['戦略ゲーム'], mechanics: ['ワカプレ'] }, # Stone Age
  209418 => { overall: 7.6, complexity: 2.4, categories: ['戦略ゲーム'], mechanics: ['カード', 'デッキ/バッグビルド'] }, # Dominion (Second Edition)
  249259 => { overall: 7.8, complexity: 2.1, categories: ['戦略ゲーム'], mechanics: ['エリア支配', 'デッキ/バッグビルド'] }, # War Chest
  127023 => { overall: 7.8, complexity: 2.9, categories: ['戦略ゲーム'], mechanics: ['エリア支配', 'プレイヤー別能力'] }, # Kemet
  328871 => { overall: 7.4, complexity: 2.4, categories: ['戦略ゲーム'], mechanics: ['カード', 'エンジンビルド'] }, # Terraforming Mars: Ares Expedition
  2511 => { overall: 7.7, complexity: 2.7, categories: ['推理ゲーム'], mechanics: ['協力', 'ストーリーテリング'] }, # Sherlock Holmes Consulting Detective: The Thames Murders & Other Cases
  148949 => { overall: 7.6, complexity: 2.6, categories: ['戦略ゲーム'], mechanics: ['セット収集'] }, # Istanbul
  233398 => { overall: 7.9, complexity: 3.0, categories: ['戦略ゲーム'], mechanics: ['ワカプレ'] }, # Endeavor: Age of Sail
  296151 => { overall: 8.0, complexity: 3.6, categories: ['戦略ゲーム'], mechanics: ['ワカプレ'] }, # Viscounts of the West Kingdom
  146652 => { overall: 7.9, complexity: 2.8, categories: ['戦略ゲーム'], mechanics: ['協力', 'デッキ/バッグビルド'] }, # Legendary Encounters: An Alien Deck Building Game
  82222 => { overall: 7.9, complexity: 3.1, categories: ['戦略ゲーム'], mechanics: ['モジュラーボード'] }, # Xia: Legends of a Drift System
  103885 => { overall: 7.8, complexity: 2.3, categories: ['戦略ゲーム'], mechanics: ['ダイス', 'シミュレーション'] }, # Star Wars: X-Wing Miniatures Game
  283948 => { overall: 8.1, complexity: 3.2, categories: ['戦略ゲーム'], mechanics: ['ワカプレ'] }, # Marco Polo II: In the Service of the Khan
  244522 => { overall: 7.8, complexity: 2.0, categories: ['ファミリーゲーム'], mechanics: ['ダイス', 'ロール&ライト'] }, # That's Pretty Clever!
  233867 => { overall: 7.8, complexity: 1.9, categories: ['ファミリーゲーム'], mechanics: ['ロール&ライト'] }, # Welcome To...
  350184 => { overall: 8.0, complexity: 2.4, categories: ['戦略ゲーム'], mechanics: ['エンジンビルド', 'タイル配置'] } # Earth
}

puts "バッチ処理でシステムレビューを作成中..."
puts ""

created_count = 0
error_count = 0

games_needing_reviews.each_with_index do |game, index|
  current_count = games_with_reviews[game.bgg_id] || 0
  needed_count = 10 - current_count
  
  print "#{index + 1}/#{games_needing_reviews.count}: #{game.name} (#{needed_count}件) "
  
  # ゲーム固有のデータまたはデフォルトデータを使用
  game_data = specific_game_data[game.bgg_id] || default_game_data
  
  needed_count.times do |i|
    begin
      review = Review.create!(
        user_id: system_user.id,
        game_id: game.bgg_id,
        overall_score: game_data[:overall],
        rule_complexity: game_data[:complexity],
        luck_factor: 3.0,
        interaction: 3.0,
        downtime: 3.0,
        recommended_players: [],
        categories: game_data[:categories],
        mechanics: game_data[:mechanics],
        short_comment: "BGG APIベースのシステムレビュー"
      )
      
      created_count += 1
      print "."
      
    rescue => e
      error_count += 1
      print "E"
    end
  end
  
  puts " 完了"
  
  # 進捗表示（50ゲームごと）
  if (index + 1) % 50 == 0
    puts "進捗: #{index + 1}/#{games_needing_reviews.count} (#{((index + 1).to_f / games_needing_reviews.count * 100).round(1)}%)"
    puts "作成済み: #{created_count}件, エラー: #{error_count}件"
    puts ""
  end
end

puts "\n=== 最終確認 ==="
final_reviews = Review.where(user_id: system_user.id)
final_game_counts = final_reviews.group(:game_id).count

complete_games = final_game_counts.select { |game_id, count| count >= 10 }.count
incomplete_games = final_game_counts.select { |game_id, count| count < 10 }.count

puts "システムレビュー完了ゲーム: #{complete_games}ゲーム"
puts "システムレビュー不完全ゲーム: #{incomplete_games}ゲーム"
puts "総システムレビュー数: #{final_reviews.count}件"
puts "新規作成: #{created_count}件"
puts "エラー: #{error_count}件"

puts "\n=== 全ゲームのシステムレビュー作成完了 ===" 