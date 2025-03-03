require "google/cloud/translate"
require 'net/http'
require 'uri'
require 'json'

class TranslationService
  # DeepL APIのエンドポイント
  DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate'
  
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

  # DeepL APIを使用してテキストを翻訳するメソッド
  def self.translate_text(text, source_lang = 'EN', target_lang = 'JA')
    return nil if text.blank?
    
    # 環境変数からAPIキーを取得
    api_key = ENV['DEEPL_API_KEY']
    
    # APIキーが設定されていない場合はエラーログを出力して終了
    unless api_key
      Rails.logger.error "DeepL API key is not set. Please set DEEPL_API_KEY environment variable."
      return nil
    end
    
    begin
      # リクエストパラメータを設定
      uri = URI.parse(DEEPL_API_URL)
      request = Net::HTTP::Post.new(uri)
      request.set_form_data({
        'auth_key' => api_key,
        'text' => text,
        'source_lang' => source_lang,
        'target_lang' => target_lang
      })
      
      # リクエストを送信
      response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
        http.request(request)
      end
      
      # レスポンスを解析
      if response.is_a?(Net::HTTPSuccess)
        result = JSON.parse(response.body)
        if result['translations'] && result['translations'].first
          return result['translations'].first['text']
        end
      else
        Rails.logger.error "DeepL API error: #{response.code} - #{response.message}"
        Rails.logger.error "Response body: #{response.body}"
      end
    rescue => e
      Rails.logger.error "Error translating text: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
    end
    
    nil
  end

  # ゲーム説明文を翻訳するメソッド
  def self.translate_game_description(description)
    return nil if description.blank?
    
    # 長いテキストを分割して翻訳する（DeepL APIの制限に対応）
    if description.length > 5000
      # 5000文字ごとに分割
      chunks = description.scan(/.{1,5000}/m)
      translated_chunks = chunks.map { |chunk| translate_text(chunk) }
      translated_chunks.join
    else
      translate_text(description)
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
    result = translate_text(text, source_language.upcase, target_language.upcase)
    result || simple_translate(text)
  end
end 