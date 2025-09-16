export { DIContainer, container, SERVICE_TOKENS } from './DIContainer'
export { 
  registerServices,
  getGameUseCase,
  getReviewUseCase,
  getGameRepository,
  getReviewRepository,
  getUserRepository,
  getMappingService
} from './ServiceRegistration'
export { 
  registerTestServices,
  getTestGameUseCase,
  getTestReviewUseCase,
  getTestGameRepository,
  getTestReviewRepository,
  getTestUserRepository,
  getTestMappingService
} from './TestContainer'

// Auto-register services in production
import { registerServices } from './ServiceRegistration'
if (process.env['NODE_ENV'] !== 'test') {
  registerServices().catch(console.error)
}