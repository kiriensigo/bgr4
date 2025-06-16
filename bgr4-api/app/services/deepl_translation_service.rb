require 'net/http'
require 'uri'
require 'json'

class DeeplTranslationService
  # DeepL APIのエンドポイント
  API_URL = 'https://api-free.deepl.com/v2/translate'
  
  # HTMLエンティティをクリーンアップするメソッド（最強化版）
  def self.cleanup_html_entities(text)
    return nil if text.blank?
    
    # HTMLエンティティを適切な文字に変換
    cleaned_text = text.dup
    
    # 複数回処理して連続するエンティティにも対応
    3.times do
      # 改行関連のエンティティを改行に変換（全角セミコロンにも対応）
      cleaned_text.gsub!(/&#10[;；]?/, "\n")
      cleaned_text.gsub!(/&#13[;；]?/, "\r")
      cleaned_text.gsub!(/&lt;br&gt;/, "\n")
      cleaned_text.gsub!(/&lt;br\/&gt;/, "\n")
      cleaned_text.gsub!(/&lt;br \/&gt;/, "\n")
      
      # その他の一般的なHTMLエンティティを変換（全角セミコロンにも対応）
      cleaned_text.gsub!(/&amp[;；]?/, "&")
      cleaned_text.gsub!(/&lt[;；]?/, "<")
      cleaned_text.gsub!(/&gt[;；]?/, ">")
      cleaned_text.gsub!(/&quot[;；]?/, '"')
      cleaned_text.gsub!(/&#39[;；]?/, "'")
      cleaned_text.gsub!(/&apos[;；]?/, "'")
      cleaned_text.gsub!(/&nbsp[;；]?/, " ")
      
      # 特殊文字のエンティティ（全角セミコロンにも対応）
      cleaned_text.gsub!(/&ndash[;；]?/, "–")
      cleaned_text.gsub!(/&mdash[;；]?/, "—")
      cleaned_text.gsub!(/&hellip[;；]?/, "…")
      cleaned_text.gsub!(/&rsquo[;；]?/, "'")
      cleaned_text.gsub!(/&lsquo[;；]?/, "'")
      cleaned_text.gsub!(/&rdquo[;；]?/, """)
      cleaned_text.gsub!(/&ldquo[;；]?/, """)
      
      # アクセント付き文字（全角セミコロンにも対応）
      cleaned_text.gsub!(/&eacute[;；]?/, "é")
      cleaned_text.gsub!(/&egrave[;；]?/, "è")
      cleaned_text.gsub!(/&ecirc[;；]?/, "ê")
      cleaned_text.gsub!(/&ouml[;；]?/, "ö")
      cleaned_text.gsub!(/&uuml[;；]?/, "ü")
      cleaned_text.gsub!(/&auml[;；]?/, "ä")
      cleaned_text.gsub!(/&aring[;；]?/, "å")
      cleaned_text.gsub!(/&ccedil[;；]?/, "ç")
      cleaned_text.gsub!(/&ntilde[;；]?/, "ñ")
      
      # 数値エンティティを文字に変換（全角・半角セミコロンに対応）
      cleaned_text.gsub!(/&#(\d+)[;；]?/) do |match|
        code = $1.to_i
        if code > 0 && code < 1114112  # Unicode範囲内
          [code].pack('U*')
        else
          match  # 変換できない場合はそのまま
        end
      end
      
      # 16進数エンティティを文字に変換（全角・半角セミコロンに対応）
      cleaned_text.gsub!(/&#x([0-9a-fA-F]+)[;；]?/) do |match|
        code = $1.to_i(16)
        if code > 0 && code < 1114112  # Unicode範囲内
          [code].pack('U*')
        else
          match  # 変換できない場合はそのまま
        end
      end
    end
    
    # 残った不完全なHTMLエンティティを除去（セミコロンなしのもの）
    cleaned_text.gsub!(/&#\d+[^;；\s]*/, "")
    cleaned_text.gsub!(/&#x[0-9a-fA-F]+[^;；\s]*/, "")
    cleaned_text.gsub!(/&[a-zA-Z]+[^;；\s]*/, "")
    
    # 連続する改行を整理
    cleaned_text.gsub!(/\n{3,}/, "\n\n")
    
    # 前後の空白を除去
    cleaned_text.strip!
    
    # 末尾のセミコロン（全角・半角）を除去
    cleaned_text.gsub!(/[;；]+\s*$/, "")
    
    # 再度前後の空白を除去
    cleaned_text.strip
  end
  
  # 翻訳メソッド（HTMLエンティティクリーンアップ付き）
  def self.translate(text, target_lang = 'JA', source_lang = 'EN')
    return nil if text.blank?
    
    # 翻訳前にHTMLエンティティをクリーンアップ
    cleaned_text = cleanup_html_entities(text)
    return nil if cleaned_text.blank?
    
    api_key = ENV['DEEPL_API_KEY']
    return nil if api_key.blank?
    
    uri = URI(API_URL)
    
    params = {
      'auth_key' => api_key,
      'text' => cleaned_text,
      'target_lang' => target_lang,
      'source_lang' => source_lang
    }
    
    begin
      response = Net::HTTP.post_form(uri, params)
      
      if response.code == '200'
        result = JSON.parse(response.body)
        translated_text = result['translations']&.first&.dig('text')
        
        # 翻訳後にもHTMLエンティティクリーンアップを適用
        translated_text.present? ? cleanup_html_entities(translated_text) : nil
      else
        Rails.logger.error "DeepL API error: #{response.code} - #{response.body}"
        nil
      end
    rescue => e
      Rails.logger.error "DeepL translation error: #{e.message}"
      nil
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