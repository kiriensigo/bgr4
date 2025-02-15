# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

# サンプルユーザーの作成
user = User.create!(
  username: "test_user",
  email: "test@example.com",
  password: "password123"
)

# サンプルゲームデータの作成
games = [
  {
    name: "カタン",
    description: "資源を集めて開拓地を発展させる定番ボードゲーム。プレイヤーは開拓者となり、資源を集めて道路や集落を建設し、勝利点を競い合います。",
    image_url: "http://localhost:3001/images/games/catan.jpg",
    min_players: 3,
    max_players: 4,
    play_time: 90,
    average_score: 8.5
  },
  {
    name: "カルカソンヌ",
    description: "タイルを配置して街や道路を作っていく戦略ゲーム。中世フランスの街を舞台に、城壁や修道院、道路を作りながら領地を広げていきます。",
    image_url: "http://localhost:3001/images/games/carcassonne.jpg",
    min_players: 2,
    max_players: 5,
    play_time: 45,
    average_score: 8.0
  },
  {
    name: "ドミニオン",
    description: "デッキ構築型カードゲームの先駆け。中世の領主となって領地を広げ、効率的なデッキを作り上げていきます。",
    image_url: "/images/games/dominion.jpg",
    min_players: 2,
    max_players: 4,
    play_time: 30,
    average_score: 8.2
  },
  {
    name: "パンデミック",
    description: "協力型ボードゲーム。プレイヤーたちは疾病対策チームのメンバーとなり、世界的な感染症の蔓延を防ぐために協力します。",
    image_url: "/images/games/pandemic.jpg",
    min_players: 2,
    max_players: 4,
    play_time: 60,
    average_score: 8.7
  },
  {
    name: "宝石の煌き",
    description: "宝石商となってトークンを集め、カードを獲得していく軽量級エンジンビルディングゲーム。",
    image_url: "/images/games/splendor.jpg",
    min_players: 2,
    max_players: 4,
    play_time: 30,
    average_score: 7.8
  }
]

# ゲームデータの作成
games.each do |game_data|
  Game.create!(game_data)
end

# サンプルレビューの作成
Game.all.each do |game|
  Review.create!(
    user: user,
    game_id: game.id.to_s,
    overall_score: rand(6.0..9.0).round(1),
    play_time: rand(1..5),
    rule_complexity: rand(1.0..5.0).round(1),
    luck_factor: rand(1.0..5.0).round(1),
    interaction: rand(1.0..5.0).round(1),
    downtime: rand(1.0..5.0).round(1),
    recommended_players: ["2人", "3人", "4人"],
    mechanics: ["Worker Placement", "Resource Management"],
    tags: ["戦略", "交渉"],
    custom_tags: ["お気に入り"],
    short_comment: "とても面白いゲームです！戦略性が高く、何度でも遊びたくなります。"
  )
end
