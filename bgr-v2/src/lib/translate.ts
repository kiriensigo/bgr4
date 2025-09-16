import * as deepl from 'deepl-node'

let translateClient: deepl.Translator | null = null

function getTranslateClient(): deepl.Translator {
  if (!translateClient) {
    const apiKey = process.env.DEEPL_API_KEY

    if (!apiKey) {
      throw new Error('DEEPL_API_KEY environment variable is required')
    }

    translateClient = new deepl.Translator(apiKey)
  }

  return translateClient
}

export interface TranslationResult {
  translatedText: string
  originalText: string
  detectedSourceLanguage?: string
}

export async function translateToJapanese(text: string): Promise<TranslationResult> {
  if (!text || text.trim().length === 0) {
    return {
      translatedText: '',
      originalText: text,
    }
  }

  try {
    const translator = getTranslateClient()
    
    const result = await translator.translateText(text, null, 'ja')
    
    return {
      translatedText: result.text,
      originalText: text,
      detectedSourceLanguage: result.detectedSourceLang || 'en',
    }
  } catch (error) {
    console.error('DeepL translation failed:', error)
    
    // Return original text if translation fails
    return {
      translatedText: text,
      originalText: text,
      detectedSourceLanguage: 'unknown',
    }
  }
}

export async function translateMultipleToJapanese(texts: string[]): Promise<TranslationResult[]> {
  const results: TranslationResult[] = []
  
  for (const text of texts) {
    const result = await translateToJapanese(text)
    results.push(result)
  }
  
  return results
}