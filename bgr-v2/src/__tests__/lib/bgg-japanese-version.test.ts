import {
  containsJapaneseChars,
  containsKana,
  containsKanjiOnly,
  containsChineseChars,
  isValidJapaneseName,
  isJapanesePublisher,
  shouldUseJapaneseVersion,
} from '@/lib/bgg-japanese-version'

describe('BGG Japanese Version Detection', () => {
  describe('containsJapaneseChars', () => {
    it('should detect hiragana', () => {
      expect(containsJapaneseChars('ひらがな')).toBe(true)
      expect(containsJapaneseChars('あいうえお')).toBe(true)
    })

    it('should detect katakana', () => {
      expect(containsJapaneseChars('カタカナ')).toBe(true)
      expect(containsJapaneseChars('アイウエオ')).toBe(true)
    })

    it('should detect kanji', () => {
      expect(containsJapaneseChars('漢字')).toBe(true)
      expect(containsJapaneseChars('日本語')).toBe(true)
    })

    it('should not detect English only', () => {
      expect(containsJapaneseChars('English')).toBe(false)
      expect(containsJapaneseChars('Love Letter')).toBe(false)
    })

    it('should detect mixed Japanese and English', () => {
      expect(containsJapaneseChars('Love ラブレター')).toBe(true)
      expect(containsJapaneseChars('ドミニオン Dominion')).toBe(true)
    })
  })

  describe('containsKana', () => {
    it('should detect hiragana', () => {
      expect(containsKana('ひらがな')).toBe(true)
      expect(containsKana('あいうえお')).toBe(true)
    })

    it('should detect katakana', () => {
      expect(containsKana('カタカナ')).toBe(true)
      expect(containsKana('アイウエオ')).toBe(true)
    })

    it('should not detect kanji only', () => {
      expect(containsKana('漢字')).toBe(false)
      expect(containsKana('日本語')).toBe(false)
    })

    it('should detect mixed kana and kanji', () => {
      expect(containsKana('ひらがな漢字')).toBe(true)
      expect(containsKana('カタカナ日本')).toBe(true)
    })
  })

  describe('containsKanjiOnly', () => {
    it('should detect kanji only', () => {
      expect(containsKanjiOnly('漢字')).toBe(true)
      expect(containsKanjiOnly('日本語')).toBe(true)
    })

    it('should not detect when kana is present', () => {
      expect(containsKanjiOnly('ひらがな漢字')).toBe(false)
      expect(containsKanjiOnly('カタカナ日本')).toBe(false)
    })

    it('should not detect English', () => {
      expect(containsKanjiOnly('English')).toBe(false)
      expect(containsKanjiOnly('Love Letter')).toBe(false)
    })
  })

  describe('containsChineseChars', () => {
    it('should detect simplified Chinese characters', () => {
      expect(containsChineseChars('们个动')).toBe(true)
    })

    it('should detect traditional Chinese characters', () => {
      expect(containsChineseChars('們個動')).toBe(true)
    })

    it('should not detect Japanese text', () => {
      expect(containsChineseChars('ひらがな')).toBe(false)
      expect(containsChineseChars('カタカナ')).toBe(false)
      expect(containsChineseChars('日本語')).toBe(false)
    })

    it('should not detect English', () => {
      expect(containsChineseChars('English')).toBe(false)
      expect(containsChineseChars('Love Letter')).toBe(false)
    })
  })

  describe('isValidJapaneseName', () => {
    it('should validate names with kana (highest priority)', () => {
      expect(isValidJapaneseName('ラブレター')).toBe(true)
      expect(isValidJapaneseName('ドミニオン')).toBe(true)
      expect(isValidJapaneseName('あずま')).toBe(true)
      expect(isValidJapaneseName('ひらがなカタカナ')).toBe(true)
    })

    it('should validate names with kanji only', () => {
      expect(isValidJapaneseName('日本語')).toBe(true)
      expect(isValidJapaneseName('漢字')).toBe(true)
    })

    it('should reject Chinese names', () => {
      expect(isValidJapaneseName('们个动')).toBe(false)
      expect(isValidJapaneseName('們個動')).toBe(false)
    })

    it('should reject English-only Japanese references', () => {
      expect(isValidJapaneseName('Japanese edition')).toBe(false)
      expect(isValidJapaneseName('Japan version')).toBe(false)
      expect(isValidJapaneseName('japanese')).toBe(false)
    })

    it('should reject undefined or empty names', () => {
      expect(isValidJapaneseName(undefined)).toBe(false)
      expect(isValidJapaneseName('')).toBe(false)
    })

    it('should reject pure English names', () => {
      expect(isValidJapaneseName('Love Letter')).toBe(false)
      expect(isValidJapaneseName('Dominion')).toBe(false)
    })
  })

  describe('isJapanesePublisher', () => {
    it('should detect major Japanese publishers', () => {
      expect(isJapanesePublisher('Hobby Japan')).toBe(true)
      expect(isJapanesePublisher('ホビージャパン')).toBe(true)
      expect(isJapanesePublisher('Arclight')).toBe(true)
      expect(isJapanesePublisher('アークライト')).toBe(true)
      expect(isJapanesePublisher('Ten Days Games')).toBe(true)
      expect(isJapanesePublisher('テンデイズゲームズ')).toBe(true)
    })

    it('should detect Japanese game companies', () => {
      expect(isJapanesePublisher('Nintendo')).toBe(true)
      expect(isJapanesePublisher('任天堂')).toBe(true)
      expect(isJapanesePublisher('Capcom')).toBe(true)
      expect(isJapanesePublisher('カプコン')).toBe(true)
    })

    it('should detect publishers with Japanese characters', () => {
      expect(isJapanesePublisher('カナイ製作所')).toBe(true)
      expect(isJapanesePublisher('すごろくや')).toBe(true)
    })

    it('should detect publishers with Japan keyword', () => {
      expect(isJapanesePublisher('Asmodee Japan')).toBe(true)
      expect(isJapanesePublisher('Hasbro Japan')).toBe(true)
    })

    it('should not detect non-Japanese publishers', () => {
      expect(isJapanesePublisher('Rio Grande Games')).toBe(false)
      expect(isJapanesePublisher('Z-Man Games')).toBe(false)
      expect(isJapanesePublisher('Alderac Entertainment Group')).toBe(false)
    })
  })

  describe('shouldUseJapaneseVersion', () => {
    it('should prefer Japanese name when available', () => {
      const result = shouldUseJapaneseVersion(
        'Love Letter',
        'ラブレター',
        'Alderac Entertainment Group',
        'Arclight'
      )

      expect(result.useName).toBe('ラブレター')
      expect(result.usePublisher).toBe('Arclight')
      expect(result.reason).toBe('Japanese version detected with valid Japanese name')
    })

    it('should use Japanese publisher even without Japanese name', () => {
      const result = shouldUseJapaneseVersion(
        'Love Letter',
        undefined,
        'Alderac Entertainment Group',
        'ホビージャパン'
      )

      expect(result.useName).toBe('Love Letter')
      expect(result.usePublisher).toBe('ホビージャパン')
      expect(result.reason).toBe('Japanese publisher detected')
    })

    it('should fallback to original when no Japanese version detected', () => {
      const result = shouldUseJapaneseVersion(
        'Dominion',
        undefined,
        'Rio Grande Games',
        undefined
      )

      expect(result.useName).toBe('Dominion')
      expect(result.usePublisher).toBe('Rio Grande Games')
      expect(result.reason).toBe('No Japanese version detected, using original')
    })

    it('should reject invalid Japanese names but use Japanese publisher', () => {
      const result = shouldUseJapaneseVersion(
        'Love Letter',
        'Japanese edition', // Invalid Japanese name
        'Alderac Entertainment Group',
        'Arclight'
      )

      expect(result.useName).toBe('Love Letter')
      expect(result.usePublisher).toBe('Arclight') // Japanese publisher is still used
      expect(result.reason).toBe('Japanese publisher detected')
    })

    it('should handle mixed scenarios correctly', () => {
      const result = shouldUseJapaneseVersion(
        'CATAN',
        undefined, // No Japanese name
        'Kosmos',
        'アズモデージャパン' // Japanese publisher
      )

      expect(result.useName).toBe('CATAN')
      expect(result.usePublisher).toBe('アズモデージャパン')
      expect(result.reason).toBe('Japanese publisher detected')
    })
  })

  describe('Edge cases and special scenarios', () => {
    it('should handle names with numbers and symbols', () => {
      expect(isValidJapaneseName('7ワンダーズ')).toBe(true)
      expect(isValidJapaneseName('カタン: スタンダード版')).toBe(true)
    })

    it('should handle mixed Japanese and English names', () => {
      expect(isValidJapaneseName('Love ラブレター')).toBe(true)
      expect(isValidJapaneseName('ドミニオン Dominion')).toBe(true)
    })

    it('should prioritize kana over kanji-only names', () => {
      const resultKana = shouldUseJapaneseVersion(
        'Original',
        'ひらがな',
        'Original Publisher',
        'Japanese Publisher'
      )
      
      const resultKanji = shouldUseJapaneseVersion(
        'Original',
        '漢字名',
        'Original Publisher',
        'Japanese Publisher'
      )

      expect(resultKana.useName).toBe('ひらがな')
      expect(resultKanji.useName).toBe('漢字名')
      // Both should be accepted, but kana has higher internal priority
    })
  })
})