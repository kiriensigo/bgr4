import { parseString } from 'xml2js'
import { promisify } from 'util'
import {
  BGGSearchResponse,
  BGGGameResponse,
  BGGHotResponse,
  BGGSearchResult,
  BGGGameDetail,
  BGGApiError,
  type BGGGameItem,
  type BGGLink
} from '@/types/bgg'
import { convertBggToSiteData } from './bgg-mapping'
import { 
  enhanceGameWithJapaneseVersion, 
  shouldUseJapaneseVersion,
  type EnhancedBGGGameDetail 
} from './bgg-japanese-version'

const parseXML = promisify(parseString)

const BGG_BASE_URL = process.env['BGG_API_BASE_URL'] || 'https://boardgamegeek.com/xmlapi2'
const RATE_LIMIT_MS = 1000 // BGG API レート制限: 1秒間隔

// レート制限用のキュー
let lastRequestTime = 0

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  
  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS - timeSinceLastRequest))
  }
  
  lastRequestTime = Date.now()
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'BGR-BoardGameReview/1.0 (https://bgrq.netlify.app)',
    },
    next: {
      revalidate: 3600, // 1時間キャッシュ
    },
  })
  
  if (!response.ok) {
    throw new BGGApiError(
      `BGG API request failed: ${response.status} ${response.statusText}`,
      response.status
    )
  }
  
  return response
}

export async function searchGames(query: string): Promise<BGGSearchResult[]> {
  try {
    const url = `${BGG_BASE_URL}/search?query=${encodeURIComponent(query)}&type=boardgame`
    const response = await rateLimitedFetch(url)
    const xmlData = await response.text()
    
    const parsed = await parseXML(xmlData) as BGGSearchResponse
    
    if (!parsed.items?.item) {
      return []
    }
    
    const items = Array.isArray(parsed.items.item) ? parsed.items.item : [parsed.items.item]
    
    return items.map(item => ({
      id: parseInt(item.$.id),
      name: item.name?.[0]?.$.value || '',
      yearPublished: item.yearpublished?.[0] ? parseInt(item.yearpublished[0].$.value) : undefined,
    }))
  } catch (error) {
    if (error instanceof BGGApiError) throw error
    throw new BGGApiError(`Failed to search games: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function getGameDetail(gameId: number, retries = 3): Promise<BGGGameDetail | null> {
  try {
    const url = `${BGG_BASE_URL}/thing?id=${gameId}&stats=1`
    const response = await rateLimitedFetch(url)
    const xmlData = await response.text()
    
    const parsed = await parseXML(xmlData) as BGGGameResponse
    
    if (!parsed.items?.item?.[0]) {
      return null
    }
    
    const item = parsed.items.item[0]
    return parseBGGGameItem(item)
  } catch (error) {
    if (retries > 0 && !(error instanceof BGGApiError && error.statusCode === 404)) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      return getGameDetail(gameId, retries - 1)
    }
    
    if (error instanceof BGGApiError) throw error
    throw new BGGApiError(`Failed to get game detail: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// 日本語版判定付きのゲーム詳細取得
export async function getGameDetailWithJapaneseVersion(gameId: number, retries = 3): Promise<EnhancedBGGGameDetail | null> {
  try {
    const basicDetail = await getGameDetail(gameId, retries)
    if (!basicDetail) return null
    
    console.log(`Enhancing game ${gameId} with Japanese version detection...`)
    const enhanced = await enhanceGameWithJapaneseVersion(basicDetail)
    
    return enhanced
  } catch (error) {
    console.error(`Failed to get enhanced game detail for ${gameId}:`, error)
    
    // エラーが発生した場合は基本の情報のみを返す
    try {
      const basicDetail = await getGameDetail(gameId, retries)
      return basicDetail as EnhancedBGGGameDetail
    } catch {
      return null
    }
  }
}

// 自動登録用：日本語版優先のゲーム詳細取得
export async function getGameDetailForAutoRegistration(gameId: number): Promise<{
  gameDetail: EnhancedBGGGameDetail
  registrationData: {
    useName: string
    usePublisher: string | undefined
    reason: string
  }
} | null> {
  try {
    const enhanced = await getGameDetailWithJapaneseVersion(gameId)
    if (!enhanced) return null
    
    const registrationDecision = shouldUseJapaneseVersion(
      enhanced.name,
      enhanced.japaneseName,
      enhanced.publishers?.[0],
      enhanced.japanesePublisher
    )
    
    console.log(`Registration decision for ${enhanced.name}:`, registrationDecision)
    
    return {
      gameDetail: enhanced,
      registrationData: registrationDecision
    }
  } catch (error) {
    console.error(`Failed to get game detail for auto registration:`, error)
    return null
  }
}

export async function getBggGameRawData(gameId: number, retries = 3): Promise<BGGGameDetail | null> {
  try {
    const url = `${BGG_BASE_URL}/thing?id=${gameId}&stats=1`
    const response = await rateLimitedFetch(url)
    const xmlData = await response.text()
    
    const parsed = await parseXML(xmlData) as BGGGameResponse
    
    if (!parsed.items?.item?.[0]) {
      return null
    }
    
    const item = parsed.items.item[0]
    return parseBGGGameItemRaw(item)
  } catch (error) {
    if (retries > 0 && !(error instanceof BGGApiError && error.statusCode === 404)) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      return getBggGameRawData(gameId, retries - 1)
    }
    
    if (error instanceof BGGApiError) throw error
    throw new BGGApiError(`Failed to get raw BGG game data: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function getHotGames(): Promise<BGGSearchResult[]> {
  try {
    const url = `${BGG_BASE_URL}/hot?type=boardgame`
    const response = await rateLimitedFetch(url)
    const xmlData = await response.text()
    
    const parsed = await parseXML(xmlData) as BGGHotResponse
    
    if (!parsed.items?.item) {
      return []
    }
    
    return parsed.items.item.map(item => ({
      id: parseInt(item.$.id),
      name: item.name?.[0]?.$.value || '',
      yearPublished: item.yearpublished?.[0] ? parseInt(item.yearpublished[0].$.value) : undefined,
    }))
  } catch (error) {
    if (error instanceof BGGApiError) throw error
    throw new BGGApiError(`Failed to get hot games: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

function parseBGGGameItem(item: BGGGameItem): BGGGameDetail {
  // 名前を取得（primary nameを優先）
  const primaryName = item.name.find(n => n.$.type === 'primary')
  const name = primaryName?.$.value || item.name[0]?.$.value || 'Unknown Game'
  
  // 各種リンクを分類（BGG生データ）
  const bggMechanics: string[] = []
  const bggCategories: string[] = []
  const designers: string[] = []
  const publishers: string[] = []
  
  if (item.link) {
    item.link.forEach((link: BGGLink) => {
      switch (link.$.type) {
        case 'boardgamemechanic':
          bggMechanics.push(link.$.value)
          break
        case 'boardgamecategory':
          bggCategories.push(link.$.value)
          break
        case 'boardgamedesigner':
          designers.push(link.$.value)
          break
        case 'boardgamepublisher':
          publishers.push(link.$.value)
          break
      }
    })
  }
  
  // BGGデータをサイト向けデータに変換
  const convertedData = convertBggToSiteData(
    bggCategories,
    bggMechanics,
    publishers,
    [], // bestPlayerCounts (後で実装)
    []  // recommendedPlayerCounts (後で実装)
  )
  
  // 統計情報
  const statistics = item.statistics?.[0]?.ratings?.[0]
  const averageRating = statistics?.average?.[0]?.$.value ? parseFloat(statistics.average[0].$.value) : undefined
  const ratingCount = statistics?.usersrated?.[0]?.$.value ? parseInt(statistics.usersrated[0].$.value) : undefined
  
  return {
    id: parseInt(item.$.id),
    name,
    description: item.description?.[0] ? cleanDescription(item.description[0]) : undefined,
    yearPublished: item.yearpublished?.[0] ? parseInt(item.yearpublished[0].$.value) : undefined,
    minPlayers: item.minplayers?.[0] ? parseInt(item.minplayers[0].$.value) : undefined,
    maxPlayers: item.maxplayers?.[0] ? parseInt(item.maxplayers[0].$.value) : undefined,
    playingTime: item.playingtime?.[0] ? parseInt(item.playingtime[0].$.value) : undefined,
    minPlayingTime: (item as any).minplaytime?.[0]?.$.value ? parseInt((item as any).minplaytime[0].$.value) : undefined,
    maxPlayingTime: (item as any).maxplaytime?.[0]?.$.value ? parseInt((item as any).maxplaytime[0].$.value) : undefined,
    minPlayingTime: item.minplaytime?.[0]?.$.value ? parseInt(item.minplaytime[0].$.value) : undefined,
    maxPlayingTime: item.maxplaytime?.[0]?.$.value ? parseInt(item.maxplaytime[0].$.value) : undefined,
    minAge: item.minage?.[0] ? parseInt(item.minage[0].$.value) : undefined,
    imageUrl: item.image?.[0] || undefined,
    thumbnailUrl: item.thumbnail?.[0] || undefined,
    // 変換されたサイト向けデータを使用
    mechanics: convertedData.siteMechanics,
    categories: convertedData.siteCategories,
    designers,
    publishers: convertedData.normalizedPublishers,
    averageRating,
    ratingCount,
  }
}

function parseBGGGameItemRaw(item: BGGGameItem): BGGGameDetail {
  // 名前を取得（primary nameを優先）
  const primaryName = item.name.find(n => n.$.type === 'primary')
  const name = primaryName?.$.value || item.name[0]?.$.value || 'Unknown Game'
  
  // 各種リンクを分類（BGG生データをそのまま保持）
  const mechanics: string[] = []
  const categories: string[] = []
  const designers: string[] = []
  const publishers: string[] = []
  
  if (item.link) {
    item.link.forEach((link: BGGLink) => {
      switch (link.$.type) {
        case 'boardgamemechanic':
          mechanics.push(link.$.value)
          break
        case 'boardgamecategory':
          categories.push(link.$.value)
          break
        case 'boardgamedesigner':
          designers.push(link.$.value)
          break
        case 'boardgamepublisher':
          publishers.push(link.$.value)
          break
      }
    })
  }
  
  // 統計情報
  const statistics = item.statistics?.[0]?.ratings?.[0]
  const averageRating = statistics?.average?.[0]?.$.value ? parseFloat(statistics.average[0].$.value) : undefined
  const ratingCount = statistics?.usersrated?.[0]?.$.value ? parseInt(statistics.usersrated[0].$.value) : undefined
  
  return {
    id: parseInt(item.$.id),
    name,
    description: item.description?.[0] ? cleanDescription(item.description[0]) : undefined,
    yearPublished: item.yearpublished?.[0] ? parseInt(item.yearpublished[0].$.value) : undefined,
    minPlayers: item.minplayers?.[0] ? parseInt(item.minplayers[0].$.value) : undefined,
    maxPlayers: item.maxplayers?.[0] ? parseInt(item.maxplayers[0].$.value) : undefined,
    playingTime: item.playingtime?.[0] ? parseInt(item.playingtime[0].$.value) : undefined,
    minAge: item.minage?.[0] ? parseInt(item.minage[0].$.value) : undefined,
    imageUrl: item.image?.[0] || undefined,
    thumbnailUrl: item.thumbnail?.[0] || undefined,
    // BGG生データをそのまま返す（変換なし）
    mechanics,
    categories,
    designers,
    publishers,
    averageRating,
    ratingCount,
  }
}

function cleanDescription(description: string): string {
  // HTMLタグを削除し、エンティティをデコード
  return description
    .replace(/<[^>]*>/g, '') // HTMLタグ削除
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#10;/g, '\n')
    .trim()
}

export function parseBGGResponse(xmlData: any): any[] {
  try {
    if (!xmlData?.items?.item) {
      return []
    }

    const items = Array.isArray(xmlData.items.item) ? xmlData.items.item : [xmlData.items.item]

    return items
      .map((item: any) => {
        try {
          return {
            id: parseInt(item.$.id),
            name: item.name?.[0]?.$.value || '',
            description: item.description?.[0] || '',
            yearPublished: item.yearpublished?.[0] ? parseInt(item.yearpublished[0].$.value) : undefined,
            minPlayers: item.minplayers?.[0] ? parseInt(item.minplayers[0].$.value) : undefined,
            maxPlayers: item.maxplayers?.[0] ? parseInt(item.maxplayers[0].$.value) : undefined,
            playingTime: item.playingtime?.[0] ? parseInt(item.playingtime[0].$.value) : undefined,
            imageUrl: item.image?.[0] || undefined
          }
        } catch {
          return null
        }
      })
      .filter((item: any) => item && validateBGGData(item))
  } catch {
    return []
  }
}

export function validateBGGData(data: any): boolean {
  try {
    return (
      data &&
      typeof data.id === 'number' &&
      !isNaN(data.id) &&
      typeof data.name === 'string' &&
      data.name.length > 0 &&
      (data.yearPublished === undefined || (typeof data.yearPublished === 'number' && data.yearPublished >= 1900)) &&
      (data.minPlayers === undefined || (typeof data.minPlayers === 'number' && data.minPlayers >= 1)) &&
      (data.maxPlayers === undefined || (typeof data.maxPlayers === 'number' && data.maxPlayers >= 1))
    )
  } catch {
    return false
  }
}

export async function getBggRankings(type: string = 'boardgame', page: number = 1): Promise<BGGSearchResult[]> {
  try {
    // BGG APIにはランキング専用エンドポイントがないため、
    // ホットゲームエンドポイントを使用して疑似的にランキングを取得
    const url = `${BGG_BASE_URL}/hot?type=${encodeURIComponent(type)}`
    const response = await rateLimitedFetch(url)
    const xmlData = await response.text()
    
    const parsed = await parseXML(xmlData) as BGGHotResponse
    
    if (!parsed.items?.item) {
      return []
    }
    
    // ランキング情報を含むゲームリストを返す
    return parsed.items.item.map((item, index) => ({
      id: parseInt(item.$.id),
      name: item.name?.[0]?.$.value || '',
      yearPublished: item.yearpublished?.[0] ? parseInt(item.yearpublished[0].$.value) : undefined,
      rank: parseInt(item.$.rank) || (page - 1) * 50 + index + 1 // BGGランクまたは疑似ランク
    }))
  } catch (error) {
    if (error instanceof BGGApiError) throw error
    throw new BGGApiError(`Failed to get BGG rankings: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
