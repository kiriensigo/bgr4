class TranslateGameDescriptionsJob < ApplicationJob
  queue_as :default

  def perform(game_id = nil)
    if game_id
      # 特定のゲームの説明文を翻訳
      translate_game(Game.find_by(id: game_id))
    else
      # 日本語説明文がないすべてのゲームを翻訳
      Game.where(japanese_description: nil).find_each do |game|
        translate_game(game)
      end
    end
  end

  private

  def translate_game(game)
    return unless game
    return if game.description.blank?
    return if game.japanese_description.present?

    # 説明文が英語かどうかを簡易的に判定
    if english_text?(game.description)
      Rails.logger.info "Translating description for game: #{game.name} (ID: #{game.id})"
      
      # 翻訳を実行
      japanese_description = TranslationService.translate(game.description)
      
      if japanese_description.present?
        # 翻訳結果を保存
        game.update(japanese_description: japanese_description)
        Rails.logger.info "Translation completed and saved for game: #{game.name}"
      else
        Rails.logger.warn "Translation failed for game: #{game.name}"
      end
    else
      Rails.logger.info "Description for game #{game.name} doesn't appear to be in English, skipping translation"
    end
  rescue => e
    Rails.logger.error "Error translating game #{game&.name}: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
  end

  # テキストが英語かどうかを簡易的に判定するメソッド
  def english_text?(text)
    # 英数字、空白、一般的な記号のみで構成されているかをチェック
    # 日本語（ひらがな、カタカナ、漢字）が含まれていない場合は英語と判断
    text.present? && !text.match?(/[\p{Hiragana}\p{Katakana}\p{Han}]/)
  end
end 