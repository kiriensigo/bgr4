import { SupabaseGameRepository } from '@/infrastructure/repositories/SupabaseGameRepository'
import { SupabaseReviewRepository } from '@/infrastructure/repositories/SupabaseReviewRepository'
import { SupabaseUserRepository } from '@/infrastructure/repositories/SupabaseUserRepository'
import { JapaneseGameIdService } from '@/infrastructure/services/JapaneseGameIdService'
import { MappingConfigLoader } from '@/infrastructure/config/MappingConfigLoader'
import { GameUseCaseImpl } from '@/application/usecases/GameUseCaseImpl'
import { ReviewUseCaseImpl } from '@/application/usecases/ReviewUseCaseImpl'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { container, SERVICE_TOKENS } from './DIContainer'
import type { GameRepository } from '@/domain/repositories/GameRepository'
import type { ReviewRepository } from '@/domain/repositories/ReviewRepository'
import type { UserRepository } from '@/domain/repositories/UserRepository'
import type { GameUseCase } from '@/application/usecases/GameUseCase'
import type { ReviewUseCase } from '@/application/usecases/ReviewUseCase'
import type { MappingService } from '@/domain/services/MappingService'

export async function registerServices(): Promise<void> {
  // Clear existing registrations
  container.clear()

  // Register Supabase Client
  container.register(
    SERVICE_TOKENS.SUPABASE_CLIENT,
    async () => await createServerSupabaseClient(),
    { singleton: true }
  )

  // Register Repositories
  container.registerClass<GameRepository>(
    SERVICE_TOKENS.GAME_REPOSITORY,
    SupabaseGameRepository,
    [SERVICE_TOKENS.SUPABASE_CLIENT],
    { singleton: true }
  )

  container.registerClass<ReviewRepository>(
    SERVICE_TOKENS.REVIEW_REPOSITORY,
    SupabaseReviewRepository,
    [SERVICE_TOKENS.SUPABASE_CLIENT],
    { singleton: true }
  )

  container.registerClass<UserRepository>(
    SERVICE_TOKENS.USER_REPOSITORY,
    SupabaseUserRepository,
    [SERVICE_TOKENS.SUPABASE_CLIENT],
    { singleton: true }
  )

  // Register Services
  const mappingService = await MappingConfigLoader.getMappingService()
  container.register<MappingService>(
    SERVICE_TOKENS.MAPPING_SERVICE,
    () => mappingService,
    { singleton: true }
  )

  container.registerClass(
    SERVICE_TOKENS.JAPANESE_GAME_ID_SERVICE,
    JapaneseGameIdService,
    [SERVICE_TOKENS.SUPABASE_CLIENT],
    { singleton: true }
  )

  // Register UseCases
  container.registerClass<GameUseCase>(
    SERVICE_TOKENS.GAME_USE_CASE,
    GameUseCaseImpl,
    [SERVICE_TOKENS.GAME_REPOSITORY, SERVICE_TOKENS.MAPPING_SERVICE, SERVICE_TOKENS.JAPANESE_GAME_ID_SERVICE],
    { singleton: true }
  )

  container.registerClass<ReviewUseCase>(
    SERVICE_TOKENS.REVIEW_USE_CASE,
    ReviewUseCaseImpl,
    [SERVICE_TOKENS.REVIEW_REPOSITORY, SERVICE_TOKENS.GAME_REPOSITORY],
    { singleton: true }
  )
}

// Convenience functions for common service resolution
export async function getGameUseCase(): Promise<GameUseCase> {
  return await container.resolve<GameUseCase>(SERVICE_TOKENS.GAME_USE_CASE)
}

export async function getReviewUseCase(): Promise<ReviewUseCase> {
  return await container.resolve<ReviewUseCase>(SERVICE_TOKENS.REVIEW_USE_CASE)
}

export async function getGameRepository(): Promise<GameRepository> {
  return await container.resolve<GameRepository>(SERVICE_TOKENS.GAME_REPOSITORY)
}

export async function getReviewRepository(): Promise<ReviewRepository> {
  return await container.resolve<ReviewRepository>(SERVICE_TOKENS.REVIEW_REPOSITORY)
}

export async function getUserRepository(): Promise<UserRepository> {
  return await container.resolve<UserRepository>(SERVICE_TOKENS.USER_REPOSITORY)
}

export async function getMappingService(): Promise<MappingService> {
  return await container.resolve<MappingService>(SERVICE_TOKENS.MAPPING_SERVICE)
}