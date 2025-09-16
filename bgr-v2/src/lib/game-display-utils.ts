// ゲーム表示用ユーティリティ
import { convertCategoriesToJapanese, convertMechanicsToJapanese } from './display-mapping'

export interface GameDisplayData {
  id: number
  name: string
  displayCategories: string[]
  displayMechanics: string[]
  displayPublishers: string[]
  // 他のフィールドはそのまま
  [key: string]: any
}

/**
 * ゲームデータを表示用に統合
 * 優先順位: site_* > bgg_*を変換 > 既存フィールド
 */
export function prepareGameDisplayData(game: any): GameDisplayData {
  // カテゴリーの決定
  let displayCategories: string[] = []
  
  if (game.site_categories && game.site_categories.length > 0) {
    // サイト専用データを最優先
    displayCategories = game.site_categories
  } else if (game.bgg_categories && game.bgg_categories.length > 0) {
    // BGG原データを変換
    displayCategories = convertCategoriesToJapanese(game.bgg_categories)
  } else if (game.categories && game.categories.length > 0) {
    // 既存フィールドをフォールバック
    displayCategories = convertCategoriesToJapanese(game.categories)
  }
  
  // メカニクスの決定
  let displayMechanics: string[] = []
  let mechanicsCategories: string[] = []
  
  if (game.site_mechanics && game.site_mechanics.length > 0) {
    // サイト専用データを最優先
    displayMechanics = game.site_mechanics
  } else if (game.bgg_mechanics && game.bgg_mechanics.length > 0) {
    // BGG原データを変換
    const mechanicsConversion = convertMechanicsToJapanese(game.bgg_mechanics)
    displayMechanics = mechanicsConversion.mechanics
    mechanicsCategories = mechanicsConversion.categories
  } else if (game.mechanics && game.mechanics.length > 0) {
    // 既存フィールドをフォールバック
    const mechanicsConversion = convertMechanicsToJapanese(game.mechanics)
    displayMechanics = mechanicsConversion.mechanics
    mechanicsCategories = mechanicsConversion.categories
  }
  
  // メカニクス由来のカテゴリーを統合
  const allDisplayCategories = [...new Set([...displayCategories, ...mechanicsCategories])]
  
  // パブリッシャーの決定
  let displayPublishers: string[] = []
  
  if (game.site_publishers && game.site_publishers.length > 0) {
    displayPublishers = game.site_publishers
  } else if (game.bgg_publishers && game.bgg_publishers.length > 0) {
    displayPublishers = game.bgg_publishers
  } else if (game.publishers && game.publishers.length > 0) {
    displayPublishers = game.publishers
  }
  
  return {
    ...game,
    displayCategories: allDisplayCategories,
    displayMechanics,
    displayPublishers
  }
}

/**
 * 複数ゲームの一括変換
 */
export function prepareGamesDisplayData(games: any[]): GameDisplayData[] {
  return games.map(prepareGameDisplayData)
}

/**
 * データソースの確認（デバッグ用）
 */
export function getGameDataSource(game: any): {
  categoriesSource: 'site' | 'bgg' | 'legacy' | 'none'
  mechanicsSource: 'site' | 'bgg' | 'legacy' | 'none'
  publishersSource: 'site' | 'bgg' | 'legacy' | 'none'
} {
  const categoriesSource = 
    game.site_categories?.length > 0 ? 'site' :
    game.bgg_categories?.length > 0 ? 'bgg' :
    game.categories?.length > 0 ? 'legacy' : 'none'
    
  const mechanicsSource = 
    game.site_mechanics?.length > 0 ? 'site' :
    game.bgg_mechanics?.length > 0 ? 'bgg' :
    game.mechanics?.length > 0 ? 'legacy' : 'none'
    
  const publishersSource = 
    game.site_publishers?.length > 0 ? 'site' :
    game.bgg_publishers?.length > 0 ? 'bgg' :
    game.publishers?.length > 0 ? 'legacy' : 'none'
  
  return { categoriesSource, mechanicsSource, publishersSource }
}