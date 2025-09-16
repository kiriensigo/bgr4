interface BGGMappings {
  categoryToSiteCategory: Record<string, string>
  categoryToSiteMechanic: Record<string, string>
  mechanicToSiteCategory: Record<string, string>
  mechanicToSiteMechanic: Record<string, string>
  playerCountToSiteCategory: Record<string, string>
  publisherMapping: Record<string, string>
}

export interface MappingResult {
  siteCategories: string[]
  siteMechanics: string[]
  normalizedPublishers: string[]
}

export class MappingService {
  private mappings: BGGMappings

  constructor(mappings: BGGMappings) {
    this.mappings = mappings
  }

  mapBGGToSiteData(
    bggCategories: string[],
    bggMechanics: string[],
    bggPublishers: string[],
    bestPlayerCounts: number[] = [],
    recommendedPlayerCounts: number[] = []
  ): MappingResult {
    const siteCategories = new Set<string>()
    const siteMechanics = new Set<string>()
    const normalizedPublishers = new Set<string>()

    // Map BGG categories to site categories
    for (const category of bggCategories) {
      const mapped = this.mappings.categoryToSiteCategory[category]
      if (mapped) {
        siteCategories.add(mapped)
      }
    }

    // Map BGG categories to site mechanics
    for (const category of bggCategories) {
      const mapped = this.mappings.categoryToSiteMechanic[category]
      if (mapped) {
        siteMechanics.add(mapped)
      }
    }

    // Map BGG mechanics to site categories
    for (const mechanic of bggMechanics) {
      const mapped = this.mappings.mechanicToSiteCategory[mechanic]
      if (mapped) {
        siteCategories.add(mapped)
      }
    }

    // Map BGG mechanics to site mechanics
    for (const mechanic of bggMechanics) {
      const mapped = this.mappings.mechanicToSiteMechanic[mechanic]
      if (mapped) {
        siteMechanics.add(mapped)
      }
    }

    // Map player counts to categories
    const playerCounts = [...bestPlayerCounts, ...recommendedPlayerCounts]
    for (const count of playerCounts) {
      const mapped = this.mappings.playerCountToSiteCategory[count.toString()]
      if (mapped) {
        siteCategories.add(mapped)
      }
    }

    // Handle special cases for player counts
    const maxPlayerCount = Math.max(...playerCounts, 0)
    if (maxPlayerCount >= 6) {
      siteCategories.add('多人数向き')
    }

    // Normalize publishers
    for (const publisher of bggPublishers) {
      const normalizedKey = publisher.toLowerCase().trim()
      const mapped = this.mappings.publisherMapping[normalizedKey]
      if (mapped) {
        normalizedPublishers.add(mapped)
      } else {
        // Keep original if no mapping found
        normalizedPublishers.add(publisher)
      }
    }

    return {
      siteCategories: Array.from(siteCategories),
      siteMechanics: Array.from(siteMechanics),
      normalizedPublishers: Array.from(normalizedPublishers)
    }
  }

  getCategoryMapping(bggCategory: string): string | null {
    return this.mappings.categoryToSiteCategory[bggCategory] || null
  }

  getMechanicMapping(bggMechanic: string): string | null {
    return this.mappings.mechanicToSiteMechanic[bggMechanic] || null
  }

  getPublisherMapping(bggPublisher: string): string | null {
    const normalizedKey = bggPublisher.toLowerCase().trim()
    return this.mappings.publisherMapping[normalizedKey] || null
  }

  getAllSiteCategories(): string[] {
    const categories = new Set<string>()
    
    Object.values(this.mappings.categoryToSiteCategory).forEach(cat => categories.add(cat))
    Object.values(this.mappings.mechanicToSiteCategory).forEach(cat => categories.add(cat))
    Object.values(this.mappings.playerCountToSiteCategory).forEach(cat => categories.add(cat))
    
    return Array.from(categories).sort()
  }

  getAllSiteMechanics(): string[] {
    const mechanics = new Set<string>()
    
    Object.values(this.mappings.categoryToSiteMechanic).forEach(mech => mechanics.add(mech))
    Object.values(this.mappings.mechanicToSiteMechanic).forEach(mech => mechanics.add(mech))
    
    return Array.from(mechanics).sort()
  }

  validateMappings(): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    // Check for empty mappings
    if (Object.keys(this.mappings.categoryToSiteCategory).length === 0) {
      errors.push('categoryToSiteCategory mapping is empty')
    }

    if (Object.keys(this.mappings.mechanicToSiteMechanic).length === 0) {
      errors.push('mechanicToSiteMechanic mapping is empty')
    }

    // Check for invalid values
    const invalidCategories = Object.values(this.mappings.categoryToSiteCategory)
      .filter(value => !value || value.trim().length === 0)
    
    if (invalidCategories.length > 0) {
      errors.push(`Found ${invalidCategories.length} invalid category mappings`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}