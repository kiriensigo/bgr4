import { parseString } from 'xml2js'
import { promisify } from 'util'
import type { BGGGameDetail } from '@/types/bgg'

const parseXML = promisify(parseString)

export interface JapaneseVersionInfo {
  name?: string
  publisher?: string
  releaseDate?: string
  imageUrl?: string
}

export interface EnhancedBGGGameDetail extends BGGGameDetail {
  japaneseName?: string
  japanesePublisher?: string
  japaneseReleaseDate?: string
  japaneseImageUrl?: string
}

// 日本語文字（ひらがな、カタカナ、漢字）の検出
export function containsJapaneseChars(text: string): boolean {
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)
}

// ひらがな・カタカナの検出
export function containsKana(text: string): boolean {
  return /[\u3040-\u309F\u30A0-\u30FF]/.test(text)
}

// 漢字のみの検出
export function containsKanjiOnly(text: string): boolean {
  return /[\u4E00-\u9FAF]/.test(text) && !/[\u3040-\u309F\u30A0-\u30FF]/.test(text)
}

// 中国語の簡体字・繁体字の特徴的な文字を検出
export function containsChineseChars(text: string): boolean {
  // 中国語特有の簡体字・繁体字パターン
  const chineseOnlyChars = /[\u4E00-\u4FFF\u5000-\u5FFF\u6000-\u6FFF\u7000-\u7FFF\u8000-\u8FFF\u9000-\u9FFF]/
  const traditionalChars = /[們們個們動們動們們動們動]/  // 繁体字の特徴的文字
  const simplifiedChars = /[们个动]/  // 简体字の特徴的文字
  
  return traditionalChars.test(text) || simplifiedChars.test(text)
}

// 日本語名として有効かどうかの判定
export function isValidJapaneseName(name: string | undefined): boolean {
  if (!name) return false

  // 実際に日本語文字（ひらがな、カタカナ、漢字）を含むか確認
  const hasJapaneseChars = containsJapaneseChars(name)

  // ひらがな・カタカナを含むか確認（最優先）
  const hasKana = containsKana(name)

  // 漢字のみを含むか確認
  const hasKanjiOnly = containsKanjiOnly(name)

  // 中国語の特徴を含むかチェック
  const hasChinese = containsChineseChars(name)

  // 「Japanese」「Japan」などの英語表記のみの場合は除外
  const isOnlyEnglishJapaneseReference =
    !hasJapaneseChars &&
    (name.toLowerCase().includes('japanese') ||
      name.toLowerCase().includes('japan edition') ||
      name.toLowerCase().includes('japan version'))

  console.log(`Japanese name analysis for "${name}":`, {
    hasJapaneseChars,
    hasKana,
    hasKanjiOnly,
    hasChinese,
    isOnlyEnglishJapaneseReference,
  })

  // 中国語の特徴がある場合は日本語名として扱わない
  if (hasChinese) {
    console.log(`Rejected as Chinese name: ${name}`)
    return false
  }

  // 有効な日本語名の条件
  return hasJapaneseChars && !isOnlyEnglishJapaneseReference
}

// 日本語版の出版社を判定
export function isJapanesePublisher(publisher: string): boolean {
  const japanesePublishers = [
    // 専門ボードゲーム出版社
    'Hobby Japan', 'ホビージャパン',
    'Arclight', 'アークライト',
    'Ten Days Games', 'テンデイズゲームズ',
    'Japon Brand',
    'Grounding', 'グラウンディング',
    'Oink Games', 'オインクゲームズ',
    'Sugorokuya', 'すごろくや',
    'COLON ARC', 'コロンアーク',
    'Analog Lunchbox', 'アナログランチボックス',
    'Domina Games', 'ドミナゲームズ',
    'OKAZU Brand', 'おかず',
    'Suki Games', '数寄ゲームズ',
    'Yanagisawa', '柳澤',
    'Ayatsurare Ningyoukan', 'あやつられ人形館',
    'BakaFire', 'バカファイア',
    'Manifest Destiny', 'マニフェストデスティニー',
    'Saien', '彩園',
    'Sato Familie', '佐藤ファミリー',
    'Shinojo', '紫猫',
    'Takoashi Games', 'タコアシゲームズ',
    'Takuya Ono', '小野卓也',
    'Yocto Games', 'ヨクト',
    'Yuhodo', '遊歩堂',
    'Itten', 'いつつ',
    'Jelly Jelly Games', 'ジェリージェリーゲームズ',
    'Kocchiya', 'こっちや',
    'Kuuri', 'くうり',
    'New Games Order', 'ニューゲームズオーダー',
    'Qvinta', 'クインタ',
    'Route11', 'ルート11',
    'Suki Games Mk2', 'スキゲームズMk2',
    'Taikikennai Games', '耐気圏内ゲームズ',
    'Team Saien', 'チーム彩園',
    'Tokyo Game Market', '東京ゲームマーケット',
    'Toshiki Sato', '佐藤敏樹',
    'Yuuai Kikaku', '遊愛企画',

    // 大手出版社・メーカー
    'Capcom', 'カプコン',
    'Bandai', 'バンダイ',
    'Konami', 'コナミ',
    'Nintendo', '任天堂',
    'Sega', 'セガ',
    'Square Enix', 'スクウェア・エニックス',
    'Taito', 'タイトー',
    'Takara Tomy', 'タカラトミー',
    'Kadokawa', '角川',
    'Shogakukan', '小学館',
    'Shueisha', '集英社',
    'Kodansha', '講談社',
    'Gentosha', '幻冬舎',
    'Hayakawa', '早川',
    'Kawada', 'カワダ',
    'Ensky', 'エンスカイ',
    'Megahouse', 'メガハウス',
    'Hanayama', 'ハナヤマ',
    'Beverly', 'ビバリー',
    'Tenyo', 'テンヨー',
    'Epoch', 'エポック',

    // 海外メーカーの日本法人
    'Hasbro Japan', 'ハズブロジャパン',
    'Asmodee Japan', 'アズモデージャパン',

    // その他
    'G Games', 'Gゲームズ',
    'Engames', 'エンゲームズ',
    'Mobius Games', 'メビウスゲームズ',
    'Moaideas', 'モアイデアズ',
    'Analog Game', 'アナログゲーム',
    'Kenbill',
    'Yellow Submarine',
    'Namco',
  ]

  return japanesePublishers.some(jp => 
    publisher.includes(jp) ||
    containsJapaneseChars(publisher) ||
    publisher.toLowerCase().includes('japan')
  )
}

// BGGのゲーム詳細から日本語版情報を抽出
export async function extractJapaneseVersionInfo(
  gameId: number,
  includeVersions: boolean = true
): Promise<JapaneseVersionInfo | null> {
  try {
    const BGG_BASE_URL = process.env['BGG_API_BASE_URL'] || 'https://boardgamegeek.com/xmlapi2'
    const versionsParam = includeVersions ? '&versions=1' : ''
    const url = `${BGG_BASE_URL}/thing?id=${gameId}&stats=1${versionsParam}`

    console.log(`Fetching Japanese version info for game ID: ${gameId}`)

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BGR-BoardGameReview/1.0 (https://bgrq.netlify.app)',
      },
    })

    if (!response.ok) {
      console.error(`BGG API request failed: ${response.status}`)
      return null
    }

    const xmlData = await response.text()
    const parsed = await parseXML(xmlData)

    if (!parsed.items?.item?.[0]) {
      console.log('No game data found')
      return null
    }

    const item = parsed.items.item[0]
    let bestJapaneseVersion: JapaneseVersionInfo | null = null
    let highestPriority = 0

    // 1. メイン名前から日本語名を検索
    if (item.name) {
      const names = Array.isArray(item.name) ? item.name : [item.name]
      
      // ひらがな・カタカナを含む名前を最優先で探す
      const nameWithKana = names.find((n: any) => 
        containsKana(n.$.value)
      )?.$.value

      // 漢字のみの名前を探す（中国語を除外）
      const nameWithKanjiOnly = names.find((n: any) =>
        containsKanjiOnly(n.$.value) && !containsChineseChars(n.$.value)
      )?.$.value

      const japaneseName = nameWithKana || nameWithKanjiOnly

      if (isValidJapaneseName(japaneseName)) {
        console.log(`Found Japanese name in main names: ${japaneseName}`)
        
        bestJapaneseVersion = {
          name: japaneseName,
          publisher: undefined,
          releaseDate: undefined,
          imageUrl: item.image?.[0] || undefined,
        }
        highestPriority = nameWithKana ? 4 : 1
      }
    }

    // 2. 出版社から日本の出版社を検索
    let japanesePublisher: string | undefined
    if (item.link) {
      const publisherLinks = item.link.filter((link: any) => link.$.type === 'boardgamepublisher')
      japanesePublisher = publisherLinks.find((link: any) => 
        isJapanesePublisher(link.$.value)
      )?.$.value
    }

    // 3. バージョン情報から日本語版を検索（より詳細な情報）
    if (includeVersions && item.versions?.[0]?.version) {
      const versions = Array.isArray(item.versions[0].version) 
        ? item.versions[0].version 
        : [item.versions[0].version]

      for (const version of versions) {
        const versionName = version.name?.[0]?.$.value || ''
        let versionPriority = 0
        let isJapaneseVersion = false

        // バージョン名の日本語判定
        const hasKana = containsKana(versionName)
        const hasKanjiOnly = containsKanjiOnly(versionName) && !containsChineseChars(versionName)
        const containsJapanKeyword = 
          versionName.toLowerCase().includes('japanese') ||
          versionName.toLowerCase().includes('japan') ||
          versionName.toLowerCase().includes('日本語')

        // バージョンの出版社を確認
        let hasJapanesePublisher = false
        const versionPublishers: string[] = []
        
        if (version.link) {
          const publisherLinks = Array.isArray(version.link) ? version.link : [version.link]
          publisherLinks.forEach((link: any) => {
            if (link.$.type === 'boardgamepublisher') {
              const publisherName = link.$.value
              versionPublishers.push(publisherName)
              if (isJapanesePublisher(publisherName)) {
                hasJapanesePublisher = true
              }
            }
          })
        }

        // 優先順位の判定
        if (hasKana) {
          isJapaneseVersion = true
          versionPriority = 4 // 最高優先度
        } else if (containsJapanKeyword && hasJapanesePublisher) {
          isJapaneseVersion = true
          versionPriority = 3
        } else if (containsJapanKeyword) {
          isJapaneseVersion = true
          versionPriority = 2
        } else if (hasKanjiOnly) {
          isJapaneseVersion = true
          versionPriority = 1
        }

        if (isJapaneseVersion && versionPriority > highestPriority) {
          console.log(`Found Japanese version: ${versionName} (Priority: ${versionPriority})`)
          
          // 発売日の取得
          let releaseDate: string | undefined
          if (version.yearpublished?.[0]?.$.value) {
            const year = version.yearpublished[0].$.value
            releaseDate = `${year}-01-01`
          }

          bestJapaneseVersion = {
            name: isValidJapaneseName(versionName) ? versionName : bestJapaneseVersion?.name,
            publisher: versionPublishers.find(p => isJapanesePublisher(p)) || japanesePublisher,
            releaseDate,
            imageUrl: version.image?.[0] || bestJapaneseVersion?.imageUrl,
          }
          highestPriority = versionPriority

          // ひらがな・カタカナを含む場合は即座に採用
          if (hasKana) break
        }
      }
    }

    // 4. 日本の出版社が見つかった場合は、それを追加
    if (japanesePublisher && bestJapaneseVersion) {
      bestJapaneseVersion.publisher = bestJapaneseVersion.publisher || japanesePublisher
    } else if (japanesePublisher && !bestJapaneseVersion) {
      // 日本語名がなくても日本の出版社がある場合は記録
      bestJapaneseVersion = {
        name: undefined,
        publisher: japanesePublisher,
        releaseDate: undefined,
        imageUrl: item.image?.[0] || undefined,
      }
    }

    console.log('Final Japanese version info:', bestJapaneseVersion)
    return bestJapaneseVersion

  } catch (error) {
    console.error('Error extracting Japanese version info:', error)
    return null
  }
}

// BGGゲーム詳細に日本語版情報を統合
export async function enhanceGameWithJapaneseVersion(
  gameDetail: BGGGameDetail
): Promise<EnhancedBGGGameDetail> {
  try {
    const japaneseInfo = await extractJapaneseVersionInfo(gameDetail.id, true)
    
    const enhanced: EnhancedBGGGameDetail = {
      ...gameDetail,
      japaneseName: japaneseInfo?.name,
      japanesePublisher: japaneseInfo?.publisher,
      japaneseReleaseDate: japaneseInfo?.releaseDate,
      japaneseImageUrl: japaneseInfo?.imageUrl,
    }

    // 日本語版が見つかった場合、優先して使用する情報を決定
    if (japaneseInfo?.name && isValidJapaneseName(japaneseInfo.name)) {
      console.log(`Using Japanese name for registration: ${japaneseInfo.name}`)
    }

    if (japaneseInfo?.publisher) {
      console.log(`Using Japanese publisher for registration: ${japaneseInfo.publisher}`)
    }

    return enhanced

  } catch (error) {
    console.error('Error enhancing game with Japanese version:', error)
    return gameDetail as EnhancedBGGGameDetail
  }
}

// 自動登録システム用：日本語版優先の判定
export function shouldUseJapaneseVersion(
  originalName: string,
  japaneseName: string | undefined,
  originalPublisher: string | undefined,
  japanesePublisher: string | undefined
): {
  useName: string
  usePublisher: string | undefined
  reason: string
} {
  // 日本語名が有効な場合は優先
  if (japaneseName && isValidJapaneseName(japaneseName)) {
    return {
      useName: japaneseName,
      usePublisher: japanesePublisher || originalPublisher,
      reason: 'Japanese version detected with valid Japanese name'
    }
  }

  // 日本語名はないか無効だが、日本の出版社がある場合
  if (japanesePublisher) {
    return {
      useName: originalName,
      usePublisher: japanesePublisher,
      reason: 'Japanese publisher detected'
    }
  }

  // デフォルトは元の情報を使用
  return {
    useName: originalName,
    usePublisher: originalPublisher,
    reason: 'No Japanese version detected, using original'
  }
}