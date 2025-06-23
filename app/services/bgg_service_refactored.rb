# frozen_string_literal: true

# 既存のBggServiceの互換性を保つファサードクラス
class BggServiceRefactored
  # ゲーム検索・取得
  def self.search_games(query)
    Bgg::GameService.search_games(query)
  end
  
  def self.get_game_details(bgg_id)
    Bgg::GameService.get_game_details(bgg_id)
  end
  
  def self.get_games_details_batch(bgg_ids)
    Bgg::GameService.get_games_details_batch(bgg_ids)
  end
  
  def self.get_expansions(bgg_id)
    Bgg::GameService.get_expansions(bgg_id)
  end
  
  # 人気・ホットゲーム
  def self.get_popular_games(limit = 50)
    Bgg::PopularGamesService.get_popular_games(limit)
  end
  
  def self.get_hot_games
    Bgg::PopularGamesService.get_hot_games
  end
  
  def self.get_top_games_from_browse(page = 1)
    Bgg::PopularGamesService.get_top_games_from_browse(page)
  end
  
  def self.parse_hot_games(response)
    Bgg::PopularGamesService.parse_hot_games(response)
  end
  
  # 日本語版情報
  def self.get_japanese_version_info(bgg_id)
    Bgg::JapaneseVersionService.get_japanese_version_info(bgg_id)
  end
  
  def self.search_japanese_version_image(bgg_id, japanese_name)
    Bgg::JapaneseVersionService.search_japanese_version_image(bgg_id, japanese_name)
  end
  
  def self.get_version_details(version_id)
    Bgg::JapaneseVersionService.get_version_details(version_id)
  end
  
  def self.search_version_image_by_id(version_id)
    Bgg::JapaneseVersionService.search_version_image_by_id(version_id)
  end
  
  def self.extract_japanese_publisher(item)
    Bgg::JapaneseVersionService.extract_japanese_publisher(item)
  end
  
  # パーサー（直接的なアクセス）
  def self.parse_game_item(item)
    Bgg::GameParser.parse_game_item(item)
  end
end 