// 簡易版レート制限 (メモリベース)
const requests = new Map<string, number[]>()

export function simpleRateLimit(ip: string, limit = 100, windowMs = 60000) {
  const now = Date.now()
  const userRequests = requests.get(ip) || []
  
  // 古いリクエストを削除
  const validRequests = userRequests.filter(time => now - time < windowMs)
  
  if (validRequests.length >= limit) {
    return false
  }
  
  validRequests.push(now)
  requests.set(ip, validRequests)
  return true
}

// 定期的にメモリをクリーンアップ
setInterval(() => {
  const now = Date.now()
  for (const [ip, timestamps] of requests.entries()) {
    const validRequests = timestamps.filter(time => now - time < 60000)
    if (validRequests.length === 0) {
      requests.delete(ip)
    } else {
      requests.set(ip, validRequests)
    }
  }
}, 60000) // 1分毎にクリーンアップ