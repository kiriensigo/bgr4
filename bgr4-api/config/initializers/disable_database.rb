# データベース接続を無効にする設定
Rails.application.config.after_initialize do
  if ENV["DISABLE_DATABASE_CONNECTION"] == "true"
    # nulldbアダプターを使用してデータベース接続をスキップ
    require 'active_record/connection_adapters/nulldb_adapter'
    
    ActiveRecord::Base.establish_connection adapter: "nulldb", schema: "schema.rb"
    
    puts "==========================================="
    puts "Database connection is disabled."
    puts "Using nulldb adapter for in-memory operation."
    puts "This is suitable for testing and debugging only."
    puts "==========================================="
    
    # モックレスポンスを提供するための設定
    # API v1のGamesControllerにモックレスポンスを返すメソッドを追加
    if defined?(Api::V1::GamesController)
      Api::V1::GamesController.class_eval do
        # オリジナルのindexメソッドをバックアップ
        alias_method :original_index, :index if method_defined?(:index)
        
        # モックデータを返すindexメソッド
        def index
          if ENV["DISABLE_DATABASE_CONNECTION"] == "true"
            # モックデータの作成
            mock_games = [
              {
                id: 1,
                bgg_id: "174430",
                name: "Gloomhaven",
                japanese_name: "グルームヘイヴン",
                image_url: "https://cf.geekdo-images.com/sZYp_3BTDGjh2unaZfZmuA__original/img/7d-lj5Gd1e8PFnD97LVWNdhqkEU=/0x0/filters:format(jpeg)/pic2437871.jpg",
                min_players: 1,
                max_players: 4,
                play_time: 120,
                average_score: 8.7,
                weight: 3.8,
                reviews_count: 5
              },
              {
                id: 2,
                bgg_id: "167791",
                name: "Terraforming Mars",
                japanese_name: "テラフォーミング・マーズ",
                image_url: "https://cf.geekdo-images.com/wg9oOLcsKvDesSUdZQ4rxw__original/img/FS1RE8Ue6nk1pNbPI3l-OSapQRc=/0x0/filters:format(jpeg)/pic3536616.jpg", 
                min_players: 1,
                max_players: 5,
                play_time: 120,
                average_score: 8.4,
                weight: 3.2,
                reviews_count: 3
              }
            ]
            
            # ページネーション情報の作成
            pagination = {
              total_count: 2,
              total_pages: 1,
              current_page: 1,
              per_page: 24
            }
            
            # モックデータをJSONで返す
            render json: { 
              games: mock_games,
              pagination: pagination
            }
          else
            # 本来のindexメソッドを呼び出し
            original_index
          end
        end
        
        # showメソッドも同様にオーバーライド
        alias_method :original_show, :show if method_defined?(:show)
        
        def show
          if ENV["DISABLE_DATABASE_CONNECTION"] == "true"
            mock_game = {
              id: params[:id],
              bgg_id: params[:id],
              name: "Sample Game #{params[:id]}",
              japanese_name: "サンプルゲーム #{params[:id]}",
              description: "This is a mock description for testing purposes.",
              image_url: "https://example.com/sample-image.jpg",
              min_players: 2,
              max_players: 4,
              play_time: 60,
              average_score: 7.5,
              weight: 2.5,
              publisher: "Sample Publisher",
              designer: "Sample Designer",
              release_date: "2020-01-01",
              reviews_count: 10
            }
            
            render json: mock_game
          else
            original_show
          end
        end
        
        # searchメソッドをオーバーライド
        alias_method :original_search, :search if method_defined?(:search)
        
        def search
          if ENV["DISABLE_DATABASE_CONNECTION"] == "true"
            # 上記と同様のモックデータを使用
            mock_games = [
              {
                id: 1,
                bgg_id: "174430",
                name: "Gloomhaven",
                japanese_name: "グルームヘイヴン",
                image_url: "https://cf.geekdo-images.com/sZYp_3BTDGjh2unaZfZmuA__original/img/7d-lj5Gd1e8PFnD97LVWNdhqkEU=/0x0/filters:format(jpeg)/pic2437871.jpg",
                min_players: 1,
                max_players: 4,
                play_time: 120,
                average_score: 8.7,
                weight: 3.8,
                reviews_count: 5
              }
            ]
            
            # 検索結果のページネーション情報
            pagination = {
              total_count: 1,
              total_pages: 1,
              current_page: 1,
              per_page: 24
            }
            
            render json: { 
              games: mock_games,
              pagination: pagination
            }
          else
            original_search
          end
        end
      end
    end
  end
end 