namespace :reviews do
  desc "Slay the Spire: The Board Game (BGG ID: 338960)に対して3件のシステムレビューを作成する"
  task create_slay_the_spire_reviews: :environment do
    system_user = User.find_by(email: 'system@boardgamereview.com')
    game = Game.find_by(bgg_id: '338960')
    
    if system_user.nil?
      puts "システムユーザーが見つかりません。タスクを中止します。"
      exit
    end
    
    if game.nil?
      puts "Slay the Spire: The Board Game (BGG ID: 338960)が見つかりません。タスクを中止します。"
      exit
    end
    
    puts "ゲーム「#{game.name}」(BGG ID: #{game.bgg_id})のシステムレビューを作成中..."
    
    # 1つ目のレビュー
    review1 = Review.create!(
      user: system_user,
      game_id: game.bgg_id,
      overall_score: 8.5,
      rule_complexity: 3.5,
      luck_factor: 2.5,
      interaction: 2.0,
      downtime: 2.0,
      recommended_players: ['1', '2', '3', '4'],
      mechanics: ['デッキ/バッグビルド', '協力'],
      tags: ['戦略', 'ソロ向き'],
      short_comment: 'デジタルゲームの雰囲気をうまく再現した協力型デッキビルドゲーム。ソロプレイでも十分楽しめます。'
    )
    
    puts "レビュー1を作成しました: #{review1.short_comment}"
    
    # 2つ目のレビュー
    review2 = Review.create!(
      user: system_user,
      game_id: game.bgg_id,
      overall_score: 7.8,
      rule_complexity: 3.0,
      luck_factor: 3.0,
      interaction: 2.5,
      downtime: 2.5,
      recommended_players: ['2', '3'],
      mechanics: ['デッキ/バッグビルド', 'ダイスロール'],
      tags: ['戦略', 'ファンタジー'],
      short_comment: 'ビデオゲームのファンなら楽しめる作品。協力して敵を倒す爽快感があります。'
    )
    
    puts "レビュー2を作成しました: #{review2.short_comment}"
    
    # 3つ目のレビュー
    review3 = Review.create!(
      user: system_user,
      game_id: game.bgg_id,
      overall_score: 8.0,
      rule_complexity: 3.2,
      luck_factor: 2.8,
      interaction: 2.2,
      downtime: 2.3,
      recommended_players: ['1', '2', '3'],
      mechanics: ['デッキ/バッグビルド', 'レガシー・キャンペーン'],
      tags: ['戦略', 'ファンタジー', 'ソロ向き'],
      short_comment: 'デジタル版のファンにはたまらない一作。カードの組み合わせを考えるのが楽しいデッキビルドゲームです。'
    )
    
    puts "レビュー3を作成しました: #{review3.short_comment}"
    
    puts "システムレビューの作成が完了しました。"
  end
end 