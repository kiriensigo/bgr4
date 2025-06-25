class LanguageDetectionService
  # 日本語のひらがな・カタカナの文字範囲
  HIRAGANA_RANGE = /[\u3040-\u309F]/
  KATAKANA_RANGE = /[\u30A0-\u30FF]/
  
  # 繁体字特有の漢字（簡体字では使われない字）
  TRADITIONAL_CHINESE_CHARS = /[
    繁體體爲處見還進進開開來來個個時時動動國國學學後後發發電電們們實實經經應應長長車車點點義義興興數數樂樂機機歷歷話話會會標標題題門門業業東東風風華華幣幣黨黨樂樂識識覺覺養養響響類類團團運運醫醫關關準準農農將將導導產產術術專專處處價價設設層層聲聲質質變變單單龍龍選選條條書書買買資資網網樣樣創創製製財財務務調調飯飯場場紅紅務務並並
  ]/x
  
  # 簡体字特有の漢字（繁体字では使われない字）
  SIMPLIFIED_CHINESE_CHARS = /[
    为处见还进开来个时动国学后发电们实经应长车点义兴数乐机历话会标题门业东风华币党乐识觉养响类团运医关准农将导产术专处价设层声质变单龙选条书买资网样创制财务调饭场红务并
  ]/x
  
  # 漢字の文字範囲
  CHINESE_CHARS = /[\u4E00-\u9FFF]/
  
  # 明確に中国語と判定すべき単語・フレーズ
  CHINESE_PHRASES = [
    '大领主',    # El Grande の中国語名
    '翼展',      # Wingspan の中国語名  
    '石器时代',  # Stone Age の中国語名
    '藍色夏威夷', # Blue Hawaii の中国語名（繁体字）
    '蓝色夏威夷', # Blue Hawaii の中国語名（簡体字）
    '棕櫚島',    # Palm Island の中国語名（繁体字）
  ].freeze
  
  # 明確に日本語と判定すべき単語・フレーズ
  JAPANESE_PHRASES = [
    '戦国時代',  # 日本の歴史用語
    '石器時代',  # 日本語表記
    '王国',      # 短い漢字は日本語として扱う
    '帝国',
    '共和国',
    '時代',
    '世界',
    '大戦',
    '革命'
  ].freeze
  
  def self.detect_language(text)
    return nil if text.blank?
    
    # フレーズベースの判定（最優先）
    return :simplified_chinese if CHINESE_PHRASES.include?(text)
    return :japanese if JAPANESE_PHRASES.include?(text)
    
    # ひらがな・カタカナが含まれていれば日本語
    if text.match?(HIRAGANA_RANGE) || text.match?(KATAKANA_RANGE)
      return :japanese
    end
    
    # 漢字のみの場合の判定
    if text.match?(CHINESE_CHARS)
      # 繁体字特有の文字が含まれていれば繁体字中国語
      if text.match?(TRADITIONAL_CHINESE_CHARS)
        return :traditional_chinese
      end
      
      # 簡体字特有の文字が含まれていれば簡体字中国語
      if text.match?(SIMPLIFIED_CHINESE_CHARS)
        return :simplified_chinese
      end
      
      # 漢字のみで特定できない場合は、文字数や文脈で判断
      # 短い場合（3文字以下）は日本語の可能性が高い
      if text.length <= 3
        return :japanese
      end
      
      # 長い場合は中国語の可能性が高い（正確な判定は困難）
      return :unknown_chinese
    end
    
    # 英数字のみの場合
    return :english
  end
  
  # 日本語かどうかの判定
  def self.japanese?(text)
    detect_language(text) == :japanese
  end
  
  # 中国語かどうかの判定
  def self.chinese?(text)
    lang = detect_language(text)
    [:traditional_chinese, :simplified_chinese, :unknown_chinese].include?(lang)
  end
  
  # 言語判定の詳細情報を返す
  def self.analyze_text(text)
    return { language: nil, details: {} } if text.blank?
    
    details = {
      has_hiragana: text.match?(HIRAGANA_RANGE),
      has_katakana: text.match?(KATAKANA_RANGE),
      has_traditional_chinese: text.match?(TRADITIONAL_CHINESE_CHARS),
      has_simplified_chinese: text.match?(SIMPLIFIED_CHINESE_CHARS),
      has_chinese_chars: text.match?(CHINESE_CHARS),
      length: text.length,
      char_types: analyze_char_types(text)
    }
    
    {
      language: detect_language(text),
      details: details
    }
  end
  
  private
  
  def self.analyze_char_types(text)
    types = []
    types << :hiragana if text.match?(HIRAGANA_RANGE)
    types << :katakana if text.match?(KATAKANA_RANGE)
    types << :chinese if text.match?(CHINESE_CHARS)
    types << :english if text.match?(/[a-zA-Z]/)
    types << :numbers if text.match?(/[0-9]/)
    types
  end
end 