class UpdateGameAverageValuesJob < ApplicationJob
  queue_as :default

  def perform(game_id)
    # ゲームを取得
    game = Game.find_by(bgg_id: game_id)
    return unless game
    
    # ゲームの平均値を更新
    game.update_average_values
  end
end
