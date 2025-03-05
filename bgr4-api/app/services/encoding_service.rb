# encoding: utf-8

# 日本語文字列のエンコーディング処理を一元化するサービスクラス
class EncodingService
  # 文字列をUTF-8エンコーディングに変換する
  # @param [String] text 変換する文字列
  # @return [String] UTF-8エンコーディングに変換された文字列
  def self.ensure_utf8(text)
    return nil if text.nil?
    
    # 文字列が既にUTF-8エンコーディングであるか確認
    if text.encoding == Encoding::UTF_8 && text.valid_encoding?
      return text
    end
    
    # 文字列のコピーを作成し、UTF-8エンコーディングに変換
    begin
      text.dup.force_encoding('UTF-8')
    rescue => e
      Rails.logger.error "エンコーディング変換エラー: #{e.message}"
      # エラーが発生した場合は元の文字列を返す
      text
    end
  end
  
  # 日本語文字列の配列をUTF-8エンコーディングに変換する
  # @param [Array<String>] texts 変換する文字列の配列
  # @return [Array<String>] UTF-8エンコーディングに変換された文字列の配列
  def self.ensure_utf8_array(texts)
    return [] if texts.nil? || texts.empty?
    
    texts.map { |text| ensure_utf8(text) }
  end
  
  # ハッシュの値をUTF-8エンコーディングに変換する
  # @param [Hash] hash 変換するハッシュ
  # @return [Hash] 値がUTF-8エンコーディングに変換されたハッシュ
  def self.ensure_utf8_hash_values(hash)
    return {} if hash.nil? || hash.empty?
    
    result = {}
    hash.each do |key, value|
      if value.is_a?(String)
        result[key] = ensure_utf8(value)
      elsif value.is_a?(Array)
        result[key] = ensure_utf8_array(value)
      elsif value.is_a?(Hash)
        result[key] = ensure_utf8_hash_values(value)
      else
        result[key] = value
      end
    end
    result
  end
end 