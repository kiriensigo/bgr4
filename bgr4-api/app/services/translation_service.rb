require "google/cloud/translate"

class TranslationService
  def self.translate_text(text, target_language = "ja", source_language = "en")
    return nil if text.blank?

    begin
      # Google Cloud Translate クライアントを初期化
      # 注意: 環境変数 GOOGLE_APPLICATION_CREDENTIALS に認証情報のパスが設定されている必要があります
      translate = Google::Cloud::Translate.translation_service

      # 翻訳リクエストを作成
      response = translate.translate_text(
        contents: [text],
        target_language_code: target_language,
        source_language_code: source_language,
        parent: "projects/#{project_id}"
      )

      # 翻訳結果を返す
      response.translations.first.translated_text
    rescue => e
      Rails.logger.error "Translation error: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      nil
    end
  end

  # フォールバックとして簡易的な翻訳を行うメソッド
  # Google Cloud Translate APIの認証情報がない場合に使用
  def self.simple_translate(text)
    return nil if text.blank?

    begin
      # 簡易的な翻訳APIを使用（例: DeepL API、Microsoft Translator APIなど）
      # ここでは例として実装していませんが、別のAPIを使用することができます
      
      # 開発環境では翻訳APIが利用できない場合のモック
      if Rails.env.development? || Rails.env.test?
        "[翻訳] #{text[0..100]}..." # 開発用に簡易的な文字列を返す
      else
        # 本番環境では別の翻訳APIを使用するか、エラーを返す
        nil
      end
    rescue => e
      Rails.logger.error "Simple translation error: #{e.message}"
      nil
    end
  end

  # 環境変数からプロジェクトIDを取得
  def self.project_id
    ENV["GOOGLE_CLOUD_PROJECT"] || "your-project-id"
  end

  # 翻訳を試みる（Google APIが失敗した場合は簡易翻訳にフォールバック）
  def self.translate(text, target_language = "ja", source_language = "en")
    result = translate_text(text, target_language, source_language)
    result || simple_translate(text)
  end
end 