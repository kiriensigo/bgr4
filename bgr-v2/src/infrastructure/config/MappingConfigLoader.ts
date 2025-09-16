import { promises as fs } from 'fs'
import { join } from 'path'
import { MappingService } from '@/domain/services/MappingService'

interface BGGMappings {
  categoryToSiteCategory: Record<string, string>
  categoryToSiteMechanic: Record<string, string>
  mechanicToSiteCategory: Record<string, string>
  mechanicToSiteMechanic: Record<string, string>
  playerCountToSiteCategory: Record<string, string>
  publisherMapping: Record<string, string>
}

export class MappingConfigLoader {
  private static instance: MappingService | null = null
  private static mappings: BGGMappings | null = null

  static async loadMappings(): Promise<BGGMappings> {
    if (this.mappings) {
      return this.mappings
    }

    try {
      const configPath = join(process.cwd(), 'src', 'infrastructure', 'config', 'bgg-mappings.json')
      const configContent = await fs.readFile(configPath, 'utf-8')
      this.mappings = JSON.parse(configContent) as BGGMappings
      
      return this.mappings
    } catch (error) {
      console.error('Failed to load BGG mappings:', error)
      // Fallback to empty mappings
      this.mappings = {
        categoryToSiteCategory: {},
        categoryToSiteMechanic: {},
        mechanicToSiteCategory: {},
        mechanicToSiteMechanic: {},
        playerCountToSiteCategory: {},
        publisherMapping: {}
      }
      return this.mappings
    }
  }

  static async getMappingService(): Promise<MappingService> {
    if (this.instance) {
      return this.instance
    }

    const mappings = await this.loadMappings()
    this.instance = new MappingService(mappings)
    
    // Validate mappings on startup
    const validation = this.instance.validateMappings()
    if (!validation.isValid) {
      console.warn('BGG Mappings validation failed:', validation.errors)
    }

    return this.instance
  }

  static async reloadMappings(): Promise<MappingService> {
    this.mappings = null
    this.instance = null
    return this.getMappingService()
  }

  // Development helper for hot-reloading configurations
  static async watchMappings(callback?: (service: MappingService) => void): Promise<void> {
    if (process.env.NODE_ENV !== 'development') {
      return
    }

    try {
      const configPath = join(process.cwd(), 'src', 'infrastructure', 'config', 'bgg-mappings.json')
      
      // Note: In a real implementation, you might use chokidar for file watching
      // For now, this is a placeholder for the concept
      console.log(`Watching BGG mappings at: ${configPath}`)
      
      if (callback) {
        const service = await this.getMappingService()
        callback(service)
      }
    } catch (error) {
      console.error('Failed to setup mapping file watcher:', error)
    }
  }
}