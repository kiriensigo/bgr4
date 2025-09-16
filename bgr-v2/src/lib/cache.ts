interface CacheConfig {
  ttl: number
  staleWhileRevalidate?: number
}

class MemoryCache {
  private cache = new Map<string, { data: any; expires: number }>()
  
  set(key: string, data: any, config: CacheConfig) {
    const expires = Date.now() + config.ttl
    this.cache.set(key, { data, expires })
  }
  
  get(key: string) {
    const item = this.cache.get(key)
    if (!item || Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }
    return item.data
  }
  
  clear() {
    this.cache.clear()
  }
  
  // メモリクリーンアップ
  cleanup() {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key)
      }
    }
  }
}

export const memoryCache = new MemoryCache()

// 定期的にキャッシュをクリーンアップ
if (typeof window === 'undefined') {
  setInterval(() => {
    memoryCache.cleanup()
  }, 60000) // 1分毎
}

// API レスポンスキャッシュ
export async function cachedFetch(url: string, config: CacheConfig = { ttl: 300000 }) {
  const cacheKey = `fetch_${url}`
  const cached = memoryCache.get(cacheKey)
  
  if (cached) {
    return cached
  }
  
  const response = await fetch(url)
  const data = await response.json()
  
  memoryCache.set(cacheKey, data, config)
  return data
}