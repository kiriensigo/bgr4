#!/usr/bin/env ruby
require_relative 'config/environment'

# BGG Top 100 (2024年12月時点)のゲームリスト
# https://boardgamegeek.com/browse/boardgame/page/1?sort=rank から取得したBGG IDリスト
TOP_100_GAMES = [
  224517,  # 1. Brass: Birmingham
  161936,  # 2. Pandemic Legacy: Season 1
  342942,  # 3. Ark Nova
  174430,  # 4. Gloomhaven
  233078,  # 5. Twilight Imperium: Fourth Edition
  316554,  # 6. Dune: Imperium
  167791,  # 7. Terraforming Mars
  115746,  # 8. War of the Ring: Second Edition
  187645,  # 9. Star Wars: Rebellion
  162886,  # 10. Spirit Island
  397598,  # 11. Dune: Imperium – Uprising
  291457,  # 12. Gloomhaven: Jaws of the Lion
  220308,  # 13. Gaia Project
  12333,   # 14. Twilight Struggle
  182028,  # 15. Through the Ages: A New Story of Civilization
  84876,   # 16. The Castles of Burgundy
  193738,  # 17. Great Western Trail
  246900,  # 18. Eclipse: Second Dawn for the Galaxy
  169786,  # 19. Scythe
  36218,   # 20. Dominion
  173346,  # 21. 7 Wonders Duel
  251247,  # 22. Everdell
  62219,   # 23. Pandemic
  312484,  # 24. Lost Ruins of Arnak
  199792,  # 25. Mansions of Madness: Second Edition
  176494,  # 26. Anachrony
  129622,  # 27. Love Letter
  139030,  # 28. Codenames
  205637,  # 29. Arkham Horror: The Card Game
  128882,  # 30. Keyflower
  181304,  # 31. Orléans
  124742,  # 32. Android: Netrunner
  317985,  # 33. It's a Wonderful World
  244521,  # 34. Brass: Lancashire
  253344,  # 35. Great Western Trail: Rails to the North
  214054,  # 36. Sherlock Holmes Consulting Detective
  253618,  # 37. Azul: Summer Pavilion
  205059,  # 38. Clank! Legacy: Acquisitions Incorporated
  317928,  # 39. Dune: A Game of Conquest and Diplomacy
  266830,  # 40. Spirit Island: Jagged Earth
  161533,  # 41. Viticulture Essential Edition
  172386,  # 42. Spirit Island: Branch & Claw
  283155,  # 43. Fireball Island: The Curse of Vul-Kar
  226320,  # 44. My Little Scythe
  300327,  # 45. Barrage
  233398,  # 46. Azul: Stained Glass of Sintra
  148949,  # 47. Azul: Stained Glass of Sintra
  284435,  # 48. Gloomhaven: Forgotten Circles
  253614,  # 49. Architects of the West Kingdom
  168435,  # 50. Between Two Cities
  266192,  # 51. Wingspan
  414317,  # 52. Harmonies
  200680,  # 53. Agricola (Revised Edition)
  209010,  # 54. Mechs vs. Minions
  390092,  # 55. Ticket to Ride Legacy: Legends of the West
  284083,  # 56. The Crew: The Quest for Planet Nine
  371942,  # 57. The White Castle
  55690,   # 58. Kingdom Death: Monster
  28143,   # 59. Race for the Galaxy
  230802,  # 60. Azul
  157354,  # 61. Five Tribes: The Djinns of Naqala
  332772,  # 62. Revive
  201808,  # 63. Clank!: A Deck-Building Adventure
  159675,  # 64. Fields of Arle
  322289,  # 65. Darwin's Journey
  380607,  # 66. Great Western Trail: New Zealand
  72125,   # 67. Eclipse: New Dawn for the Galaxy
  191189,  # 68. Aeon's End
  240980,  # 69. Blood on the Clocktower
  366161,  # 70. Wingspan Asia
  93,      # 71. El Grande
  110327,  # 72. Lords of Waterdeep
  31260,   # 73. Agricola
  102794,  # 74. Tzolk'in: The Mayan Calendar
  120677,  # 75. Terra Mystica
  183394,  # 76. Viticulture: Visit from the Rhine Valley
  148228,  # 77. Splendor
  161936,  # 78. Pandemic Legacy: Season 1 (duplicate)
  9609,    # 79. Ticket to Ride
  264241,  # 80. Paladins of the West Kingdom
  70323,   # 81. King of Tokyo
  30549,   # 82. Pandemic
  167355,  # 83. Nemesis
  35677,   # 84. Dominion: Intrigue
  13,      # 85. Catan
  39856,   # 86. Dixit
  42,      # 87. Tigris & Euphrates
  131357,  # 88. Coup
  127398,  # 89. Bears!
  178900,  # 90. Codenames: Duet
  4098,    # 91. Lords of Waterdeep
  266330,  # 92. Spirit Island: Feather and Flame
  155703,  # 93. Cthulhu: Death May Die
  164928,  # 94. Outlive
  266830,  # 95. Spirit Island: Jagged Earth (duplicate)
  276182,  # 96. John Company: Second Edition
  290448,  # 97. Marvel United
  346703,  # 98. Cascadia: Landmarks
  229853,  # 99.Root: The Underworld Expansion
  247763   # 100. Pandemic Legacy: Season 0
].uniq # 重複を除去

puts "=" * 60
puts "🎮 BGG Top 100 ゲーム登録スクリプト開始"
puts "登録対象ゲーム数: #{TOP_100_GAMES.size}"
puts "=" * 60

success_count = 0
skip_count = 0
error_count = 0
errors = []

TOP_100_GAMES.each_with_index do |bgg_id, index|
  begin
    puts "\n[#{index + 1}/#{TOP_100_GAMES.size}] BGG ID: #{bgg_id} を処理中..."
    
    # 既存ゲームをチェック
    existing_game = Game.find_by(bgg_id: bgg_id)
    if existing_game
      puts "  ✓ 既に登録済み: #{existing_game.japanese_name.presence || existing_game.name}"
      skip_count += 1
      next
    end
    
    # BGGサービスを使用してゲーム情報を取得
    Rails.logger.info "Fetching game data for BGG ID: #{bgg_id}"
    game_data = BggService.get_game_details(bgg_id)
    
    if game_data && game_data[:name].present?
      # ゲームを作成（Gameモデルに存在する属性のみ使用）
      game_attributes = {
        bgg_id: bgg_id,
        name: game_data[:name],
        japanese_name: game_data[:japanese_name],
        description: game_data[:description],
        japanese_description: game_data[:japanese_description],
        min_players: game_data[:min_players],
        max_players: game_data[:max_players],
        play_time: game_data[:play_time],
        min_play_time: game_data[:min_play_time],
        min_age: game_data[:min_age],
        image_url: game_data[:image_url],
        thumbnail_url: game_data[:thumbnail_url],
        bgg_score: game_data[:average_score],
        weight: game_data[:weight],
        designer: game_data[:designer],
        publisher: game_data[:publisher],
        japanese_publisher: game_data[:japanese_publisher],
        release_date: game_data[:release_date],
        japanese_release_date: game_data[:japanese_release_date],
        registered_on_site: true
      }
      
      # nilや空の値を除去
      game_attributes = game_attributes.compact
      
      game = Game.new(game_attributes)
      
      # メタデータを保存
      if game_data[:expansions].present?
        game.store_metadata(:expansions, game_data[:expansions])
      end
      
      if game_data[:best_num_players].present?
        game.store_metadata(:best_num_players, game_data[:best_num_players])
      end
      
      if game_data[:recommended_num_players].present?
        game.store_metadata(:recommended_num_players, game_data[:recommended_num_players])
      end
      
      if game_data[:categories].present?
        game.store_metadata(:categories, game_data[:categories])
      end
      
      if game_data[:mechanics].present?
        game.store_metadata(:mechanics, game_data[:mechanics])
      end
      
      if game.save
        puts "  ✅ 登録成功: #{game.japanese_name.presence || game.name}"
        puts "     プレイ人数: #{game.min_players}-#{game.max_players}人, プレイ時間: #{game.play_time}分"
        success_count += 1
      else
        puts "  ❌ 保存エラー: #{game.errors.full_messages.join(', ')}"
        error_count += 1
        errors << "BGG ID #{bgg_id}: #{game.errors.full_messages.join(', ')}"
      end
    else
      puts "  ❌ BGGからデータを取得できませんでした"
      error_count += 1
      errors << "BGG ID #{bgg_id}: データ取得失敗"
    end
    
    # API制限を考慮して待機
    sleep(2)
    
  rescue => e
    puts "  ❌ エラー: #{e.message}"
    Rails.logger.error "Error processing BGG ID #{bgg_id}: #{e.message}\n#{e.backtrace.join("\n")}"
    error_count += 1
    errors << "BGG ID #{bgg_id}: #{e.message}"
    
    # エラーが発生した場合も少し待機
    sleep(1)
  end
end

puts "\n" + "=" * 60
puts "🎯 BGG Top 100 ゲーム登録完了"
puts "=" * 60
puts "✅ 新規登録: #{success_count}件"
puts "⏭️  既存スキップ: #{skip_count}件"
puts "❌ エラー: #{error_count}件"
puts "📊 合計処理: #{success_count + skip_count + error_count}件"

if errors.any?
  puts "\n⚠️  エラー詳細:"
  errors.each { |error| puts "  - #{error}" }
end

puts "\n🚀 BGRシステムに BGG Top 100 ゲームの登録が完了しました！"
puts "📈 新しく#{success_count}件のゲームが追加されました" 