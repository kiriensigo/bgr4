require 'net/http'
require 'uri'
require 'json'

class DeeplTranslationService
  # DeepL APIのエンドポイント
  API_URL = 'https://api-free.deepl.com/v2/translate'
  
  # 翻訳メソッド
  # text: 翻訳するテキスト
  # target_lang: 翻訳先の言語コード（デフォルトは日本語）
  # source_lang: 翻訳元の言語コード（デフォルトは自動検出）
  def self.translate(text, target_lang = 'JA', source_lang = nil)
    return nil if text.blank?
    return nil if ENV['DEEPL_API_KEY'].blank?
    
    begin
      # リクエストパラメータの設定
      params = {
        'auth_key' => ENV['DEEPL_API_KEY'],
        'text' => text,
        'target_lang' => target_lang
      }
      
      # 翻訳元の言語が指定されている場合は追加
      params['source_lang'] = source_lang if source_lang.present?
      
      # URIの作成
      uri = URI.parse(API_URL)
      
      # HTTPリクエストの作成
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      
      # POSTリクエストの作成
      request = Net::HTTP::Post.new(uri.path)
      request.set_form_data(params)
      
      # リクエストの送信
      response = http.request(request)
      
      # レスポンスの解析
      if response.code == '200'
        result = JSON.parse(response.body)
        return result['translations'][0]['text']
      else
        Rails.logger.error "DeepL API error: #{response.code} - #{response.body}"
        return nil
      end
    rescue => e
      Rails.logger.error "DeepL translation error: #{e.message}"
      return nil
    end
  end
  
  # 翻訳数の上限に達しているかどうかを確認するメソッド
  def self.translation_limit_reached?(response_body)
    return false unless response_body.is_a?(String)
    
    # エラーメッセージに「quota exceeded」や「usage limit」などの文字列が含まれているか確認
    response_body.downcase.include?('quota exceeded') || 
    response_body.downcase.include?('usage limit') ||
    response_body.downcase.include?('limit reached')
  end
end 