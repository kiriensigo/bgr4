import { MockGameRepository } from '@/infrastructure/repositories/MockGameRepository'
import { MockReviewRepository } from '@/infrastructure/repositories/MockReviewRepository'
import { MockUserRepository } from '@/infrastructure/repositories/MockUserRepository'
import { MappingService } from '@/domain/services/MappingService'
import { GameUseCaseImpl } from '@/application/usecases/GameUseCaseImpl'
import { ReviewUseCaseImpl } from '@/application/usecases/ReviewUseCaseImpl'
import { container, SERVICE_TOKENS } from './DIContainer'
import type { GameRepository } from '@/domain/repositories/GameRepository'
import type { ReviewRepository } from '@/domain/repositories/ReviewRepository'
import type { UserRepository } from '@/domain/repositories/UserRepository'
import type { GameUseCase } from '@/application/usecases/GameUseCase'
import type { ReviewUseCase } from '@/application/usecases/ReviewUseCase'

// Test mappings configuration
const testMappings = {
  categoryToSiteCategory: {
    'Card Game': 'カードゲーム',
    'Strategy Game': '戦略',
    'Party Game': 'パーティー'
  },
  categoryToSiteMechanic: {
    'Dice': 'ダイスロール'
  },
  mechanicToSiteCategory: {
    'Acting': '演技',
    'Deduction': '推理',
    'Solo / Solitaire Game': 'ソロ向き'
  },
  mechanicToSiteMechanic: {
    'Area Majority / Influence': 'エリア支配',
    'Auction / Bidding': 'オークション',
    'Worker Placement': 'ワカプレ',
    'Deck, Bag, and Pool Building': 'デッキ/バッグビルド'
  },
  playerCountToSiteCategory: {
    '1': 'ソロ向き',
    '2': 'ペア向き',
    '6以上': '多人数向き'
  },
  publisherMapping: {
    'Days of Wonder': 'デイズ・オブ・ワンダー',
    'Fantasy Flight Games': 'ファンタジーフライト'
  }
}

export function registerTestServices(): void {
  // Clear existing registrations
  container.clear()

  // Register Mock Repositories
  container.registerClass<GameRepository>(
    SERVICE_TOKENS.GAME_REPOSITORY,
    MockGameRepository,
    [],
    { singleton: true }
  )

  container.registerClass<ReviewRepository>(
    SERVICE_TOKENS.REVIEW_REPOSITORY,
    MockReviewRepository,
    [],
    { singleton: true }
  )

  container.registerClass<UserRepository>(
    SERVICE_TOKENS.USER_REPOSITORY,
    MockUserRepository,
    [],
    { singleton: true }
  )

  // Register Test Mapping Service
  container.register<MappingService>(
    SERVICE_TOKENS.MAPPING_SERVICE,
    () => new MappingService(testMappings),
    { singleton: true }
  )

  // Register UseCases with Mock dependencies
  container.registerClass<GameUseCase>(
    SERVICE_TOKENS.GAME_USE_CASE,
    GameUseCaseImpl,
    [SERVICE_TOKENS.GAME_REPOSITORY, SERVICE_TOKENS.MAPPING_SERVICE],
    { singleton: true }
  )

  container.registerClass<ReviewUseCase>(
    SERVICE_TOKENS.REVIEW_USE_CASE,
    ReviewUseCaseImpl,
    [SERVICE_TOKENS.REVIEW_REPOSITORY, SERVICE_TOKENS.GAME_REPOSITORY],
    { singleton: true }
  )
}

// Test-specific convenience functions
export async function getTestGameUseCase(): Promise<GameUseCase> {
  return container.resolve<GameUseCase>(SERVICE_TOKENS.GAME_USE_CASE)
}

export async function getTestReviewUseCase(): Promise<ReviewUseCase> {
  return container.resolve<ReviewUseCase>(SERVICE_TOKENS.REVIEW_USE_CASE)
}

export async function getTestGameRepository(): Promise<GameRepository> {
  return container.resolve<GameRepository>(SERVICE_TOKENS.GAME_REPOSITORY)
}

export async function getTestReviewRepository(): Promise<ReviewRepository> {
  return container.resolve<ReviewRepository>(SERVICE_TOKENS.REVIEW_REPOSITORY)
}

export async function getTestUserRepository(): Promise<UserRepository> {
  return container.resolve<UserRepository>(SERVICE_TOKENS.USER_REPOSITORY)
}

export async function getTestMappingService(): Promise<MappingService> {
  return container.resolve<MappingService>(SERVICE_TOKENS.MAPPING_SERVICE)
}