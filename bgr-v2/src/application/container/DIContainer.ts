export type Constructor<T = {}> = new (...args: any[]) => T

export interface ServiceRegistry {
  [key: string]: {
    instance?: any
    factory?: () => any | Promise<any>
    dependencies?: string[]
    singleton?: boolean
  }
}

export class DIContainer {
  private services = new Map<string, any>()
  private factories = new Map<string, () => any | Promise<any>>()
  private singletons = new Set<string>()

  register<T>(
    token: string,
    factory: () => T | Promise<T>,
    options: { singleton?: boolean } = {}
  ): void {
    this.factories.set(token, factory)
    
    if (options.singleton) {
      this.singletons.add(token)
    }
  }

  registerClass<T>(
    token: string,
    constructor: Constructor<T>,
    dependencies: string[] = [],
    options: { singleton?: boolean } = {}
  ): void {
    this.register(
      token,
      async () => {
        const resolvedDependencies = await Promise.all(
          dependencies.map(dep => this.resolve(dep))
        )
        return new constructor(...resolvedDependencies)
      },
      options
    )
  }

  registerInstance<T>(token: string, instance: T): void {
    this.services.set(token, instance)
    this.singletons.add(token)
  }

  async resolve<T>(token: string): Promise<T> {
    // Check if already instantiated
    if (this.services.has(token)) {
      return this.services.get(token)
    }

    // Get factory
    const factory = this.factories.get(token)
    if (!factory) {
      throw new Error(`Service '${token}' is not registered`)
    }

    // Create instance
    const instance = await factory()

    // Cache if singleton
    if (this.singletons.has(token)) {
      this.services.set(token, instance)
    }

    return instance
  }

  isRegistered(token: string): boolean {
    return this.services.has(token) || this.factories.has(token)
  }

  clear(): void {
    this.services.clear()
    this.factories.clear()
    this.singletons.clear()
  }
}

// Global container instance
export const container = new DIContainer()

// Service tokens
export const SERVICE_TOKENS = {
  // Repositories
  GAME_REPOSITORY: 'GameRepository',
  REVIEW_REPOSITORY: 'ReviewRepository',
  USER_REPOSITORY: 'UserRepository',
  
  // Services
  MAPPING_SERVICE: 'MappingService',
  JAPANESE_GAME_ID_SERVICE: 'JapaneseGameIdService',
  
  // UseCases
  GAME_USE_CASE: 'GameUseCase',
  REVIEW_USE_CASE: 'ReviewUseCase',
  
  // External Services
  SUPABASE_CLIENT: 'SupabaseClient'
} as const