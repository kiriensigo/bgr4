import { describe, it, expect, beforeEach } from '@jest/globals'
import { DIContainer } from '@/application/container/DIContainer'

class TestService {
  constructor(public name: string) {}
  
  greet(): string {
    return `Hello from ${this.name}`
  }
}

class DependentService {
  constructor(private testService: TestService) {}
  
  getMessage(): string {
    return this.testService.greet()
  }
}

describe('DIContainer', () => {
  let container: DIContainer

  beforeEach(() => {
    container = new DIContainer()
  })

  describe('register and resolve', () => {
    it('should register and resolve a service', () => {
      container.register('test', () => new TestService('test'))
      
      const service = container.resolve<TestService>('test')
      
      expect(service).toBeInstanceOf(TestService)
      expect(service.greet()).toBe('Hello from test')
    })

    it('should throw error for unregistered service', () => {
      expect(() => container.resolve('nonexistent'))
        .toThrow('Service \'nonexistent\' is not registered')
    })

    it('should return new instance each time for non-singleton', () => {
      container.register('test', () => new TestService('test'))
      
      const service1 = container.resolve<TestService>('test')
      const service2 = container.resolve<TestService>('test')
      
      expect(service1).not.toBe(service2)
    })

    it('should return same instance for singleton', () => {
      container.register('test', () => new TestService('test'), { singleton: true })
      
      const service1 = container.resolve<TestService>('test')
      const service2 = container.resolve<TestService>('test')
      
      expect(service1).toBe(service2)
    })
  })

  describe('registerClass', () => {
    it('should register class with dependencies', () => {
      container.register('test', () => new TestService('dependency'))
      container.registerClass('dependent', DependentService, ['test'])
      
      const service = container.resolve<DependentService>('dependent')
      
      expect(service).toBeInstanceOf(DependentService)
      expect(service.getMessage()).toBe('Hello from dependency')
    })

    it('should handle nested dependencies', () => {
      container.register('test', () => new TestService('nested'), { singleton: true })
      container.registerClass('dependent', DependentService, ['test'], { singleton: true })
      
      const service1 = container.resolve<DependentService>('dependent')
      const service2 = container.resolve<DependentService>('dependent')
      
      expect(service1).toBe(service2)
      expect(service1.getMessage()).toBe('Hello from nested')
    })
  })

  describe('registerInstance', () => {
    it('should register and resolve instance', () => {
      const instance = new TestService('instance')
      container.registerInstance('test', instance)
      
      const resolved = container.resolve<TestService>('test')
      
      expect(resolved).toBe(instance)
    })
  })

  describe('isRegistered', () => {
    it('should return true for registered services', () => {
      container.register('test', () => new TestService('test'))
      
      expect(container.isRegistered('test')).toBe(true)
      expect(container.isRegistered('nonexistent')).toBe(false)
    })

    it('should return true for registered instances', () => {
      container.registerInstance('test', new TestService('test'))
      
      expect(container.isRegistered('test')).toBe(true)
    })
  })

  describe('clear', () => {
    it('should clear all registrations', () => {
      container.register('test1', () => new TestService('test1'))
      container.registerInstance('test2', new TestService('test2'))
      
      expect(container.isRegistered('test1')).toBe(true)
      expect(container.isRegistered('test2')).toBe(true)
      
      container.clear()
      
      expect(container.isRegistered('test1')).toBe(false)
      expect(container.isRegistered('test2')).toBe(false)
    })
  })
})