import { translateToJapanese, translateMultipleToJapanese, TranslationResult } from '@/lib/translate'

// DeepL APIをモック
jest.mock('deepl-node', () => {
  return {
    Translator: jest.fn().mockImplementation(() => ({
      translateText: jest.fn().mockImplementation((text: string) => {
        // モック翻訳結果
        const mockTranslations = {
          'Hello World': 'こんにちは世界',
          'Board Game': 'ボードゲーム',
          'This is a strategy game': 'これは戦略ゲームです',
          '': '', // 空文字列
        }
        
        const translated = mockTranslations[text as keyof typeof mockTranslations] || `翻訳: ${text}`
        return Promise.resolve({
          text: translated,
          detectedSourceLang: 'en'
        })
      })
    }))
  }
})

// 環境変数をモック
const originalEnv = process.env
beforeEach(() => {
  jest.resetModules()
  process.env = {
    ...originalEnv,
    DEEPL_API_KEY: 'mock-deepl-api-key'
  }
})

afterEach(() => {
  process.env = originalEnv
})

describe('Translation Utility Functions', () => {
  describe('translateToJapanese', () => {
    it('should translate English text to Japanese', async () => {
      const result = await translateToJapanese('Hello World')
      
      expect(result).toEqual({
        translatedText: 'こんにちは世界',
        originalText: 'Hello World',
        detectedSourceLanguage: 'en'
      })
    })

    it('should handle empty string input', async () => {
      const result = await translateToJapanese('')
      
      expect(result).toEqual({
        translatedText: '',
        originalText: '',
      })
    })

    it('should handle whitespace-only input', async () => {
      const result = await translateToJapanese('   ')
      
      expect(result).toEqual({
        translatedText: '',
        originalText: '   ',
      })
    })

    it('should translate complex game description', async () => {
      const gameDescription = 'This is a strategy game'
      const result = await translateToJapanese(gameDescription)
      
      expect(result).toEqual({
        translatedText: 'これは戦略ゲームです',
        originalText: gameDescription,
        detectedSourceLanguage: 'en'
      })
    })

    it('should handle translation errors gracefully', async () => {
      // 環境変数を削除してエラーを発生させる
      delete process.env.DEEPL_API_KEY
      
      const { translateToJapanese: translateWithoutKey } = await import('@/lib/translate')
      const result = await translateWithoutKey('Hello World')
      
      // エラー時は原文を返す
      expect(result).toEqual({
        translatedText: 'Hello World',
        originalText: 'Hello World',
        detectedSourceLanguage: 'unknown'
      })
    })
  })

  describe('translateMultipleToJapanese', () => {
    it('should translate multiple texts', async () => {
      const texts = ['Hello World', 'Board Game']
      const results = await translateMultipleToJapanese(texts)
      
      expect(results).toHaveLength(2)
      expect(results[0]).toEqual({
        translatedText: 'こんにちは世界',
        originalText: 'Hello World',
        detectedSourceLanguage: 'en'
      })
      expect(results[1]).toEqual({
        translatedText: 'ボードゲーム',
        originalText: 'Board Game',
        detectedSourceLanguage: 'en'
      })
    })

    it('should handle empty array', async () => {
      const results = await translateMultipleToJapanese([])
      expect(results).toEqual([])
    })

    it('should handle mixed content including empty strings', async () => {
      const texts = ['Hello World', '', 'Board Game']
      const results = await translateMultipleToJapanese(texts)
      
      expect(results).toHaveLength(3)
      expect(results[0].translatedText).toBe('こんにちは世界')
      expect(results[1].translatedText).toBe('')
      expect(results[2].translatedText).toBe('ボードゲーム')
    })
  })

  describe('Translation Error Handling', () => {
    it('should handle API key missing error', async () => {
      // 環境変数を削除
      delete process.env.DEEPL_API_KEY
      
      const { translateToJapanese: translateWithoutKey } = await import('@/lib/translate')
      
      // エラーが発生してもフォールバック処理で動作継続
      const result = await translateWithoutKey('Test')
      expect(result.translatedText).toBe('Test')
      expect(result.originalText).toBe('Test')
    })
  })

  describe('Translation Result Type', () => {
    it('should return correct TranslationResult type', async () => {
      const result: TranslationResult = await translateToJapanese('Test')
      
      expect(typeof result.translatedText).toBe('string')
      expect(typeof result.originalText).toBe('string')
      expect(result.detectedSourceLanguage).toMatch(/en|unknown/)
    })
  })
})