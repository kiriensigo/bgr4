namespace :bgg do
  desc "BGGからランキング上位のゲームを取得してデータベースに登録する"
  task import_top_games: :environment do
    require 'net/http'
    require 'rexml/document'
    require 'cgi'

    # BGG APIのエンドポイント
    BGG_API_BASE_URL = "https://www.boardgamegeek.com/xmlapi2"

    def fetch_bgg_hot_items
      url = URI("#{BGG_API_BASE_URL}/hot?type=boardgame")
      puts "Fetching hot items from: #{url}"
      
      response_xml = nil
      # BGG APIは時々空のレスポンスを返すため、リトライ処理を入れる
      5.times do |i|
        response = Net::HTTP.get(url)
        # 202 Acceptedは処理中を示すため、リトライする
        if response.include?('<items termsofuse="https://boardgamegeek.com/xmlapi/termsofuse">') && !response.strip.end_with?("</items>")
            puts "BGG API is processing... Retrying in #{i + 1} seconds."
            sleep(i + 1)
            next
        end
        response_xml = response
        break
      end

      if response_xml.nil?
        puts "Failed to get a valid response from BGG API after multiple retries."
        return []
      end

      doc = REXML::Document.new(response_xml)
      
      game_ids = []
      doc.elements.each('items/item') do |item_element|
        game_ids << item_element.attributes['id']
      end
      puts "Found #{game_ids.length} hot game IDs."
      game_ids
    rescue => e
      puts "Error fetching hot items: #{e.message}"
      []
    end

    def create_game_from_bgg(bgg_id)
      puts "Processing BGG ID: #{bgg_id}..."
      
      # 既に存在するか確認
      if Game.exists?(bgg_id: bgg_id)
        puts "Game with BGG ID #{bgg_id} already exists. Skipping."
        return
      end

      # BGGからゲーム情報を取得するサービスを呼び出す (既存のロジックを再利用)
      bgg_game_info = BggService.get_game_details(bgg_id)
      
      if bgg_game_info.nil?
        puts "Failed to fetch details for BGG ID #{bgg_id}."
        return
      end

      # ゲームを作成
      game = Game.new(
        bgg_id: bgg_id,
        name: bgg_game_info[:name],
        description: bgg_game_info[:description],
        image_url: bgg_game_info[:image_url],
        min_players: bgg_game_info[:min_players],
        max_players: bgg_game_info[:max_players],
        play_time: bgg_game_info[:play_time],
        min_play_time: bgg_game_info[:min_play_time],
        weight: bgg_game_info[:weight],
        publisher: bgg_game_info[:publisher],
        designer: bgg_game_info[:designer],
        release_date: bgg_game_info[:release_date],
        registered_on_site: true # サイトに登録済みとしてマーク
      )
      
      if game.save
        puts "Successfully created game: #{game.name} (BGG ID: #{bgg_id})"
        # BGGからの詳細情報（日本語名など）を取得・更新する
        game.update_from_bgg(true)
        puts "Updated details for #{game.name}."
      else
        puts "Failed to create game for BGG ID #{bgg_id}. Errors: #{game.errors.full_messages.join(", ")}"
      end
    rescue => e
      puts "An error occurred while processing BGG ID #{bgg_id}: #{e.message}"
    end

    puts "Starting to import top games from BGG..."
    
    # BGGの"hot"リストはランキング上位約50件を取得
    # 1000件を取得するにはより複雑なスクレイピング等が必要になるため、
    # まずはhotリストのゲームでテストします。
    game_ids = fetch_bgg_hot_items
    
    game_ids.each do |id|
      create_game_from_bgg(id)
      # API制限を避けるために少し待つ
      sleep(2)
    end

    puts "Finished importing games."
  end
end 