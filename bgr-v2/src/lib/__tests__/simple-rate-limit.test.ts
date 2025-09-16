import { simpleRateLimit } from '../simple-rate-limit'

// タイマーをモック
jest.useFakeTimers()

describe('simpleRateLimit', () => {
  beforeEach(() => {
    // 各テスト前にタイマーをリセット
    jest.clearAllTimers()
    
    // Date.now() をモック
    const mockDate = new Date('2023-01-01T00:00:00.000Z')
    jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('制限内のリクエストは許可される', () => {
    const ip = '192.168.1.1'
    
    // 最初のリクエストは許可される
    expect(simpleRateLimit(ip, 5, 60000)).toBe(true)
    expect(simpleRateLimit(ip, 5, 60000)).toBe(true)
    expect(simpleRateLimit(ip, 5, 60000)).toBe(true)
  })

  it('制限を超えたリクエストは拒否される', () => {
    const ip = '192.168.1.2'
    const limit = 3
    const windowMs = 60000
    
    // 制限まで許可される
    expect(simpleRateLimit(ip, limit, windowMs)).toBe(true)
    expect(simpleRateLimit(ip, limit, windowMs)).toBe(true)
    expect(simpleRateLimit(ip, limit, windowMs)).toBe(true)
    
    // 制限を超えると拒否される
    expect(simpleRateLimit(ip, limit, windowMs)).toBe(false)
    expect(simpleRateLimit(ip, limit, windowMs)).toBe(false)
  })

  it('時間ウィンドウが過ぎるとリクエストが再び許可される', () => {
    const ip = '192.168.1.3'
    const limit = 2
    const windowMs = 60000
    
    // 制限まで許可
    expect(simpleRateLimit(ip, limit, windowMs)).toBe(true)
    expect(simpleRateLimit(ip, limit, windowMs)).toBe(true)
    
    // 制限を超えて拒否
    expect(simpleRateLimit(ip, limit, windowMs)).toBe(false)
    
    // 時間を進める
    jest.advanceTimersByTime(windowMs + 1000)
    const newTime = Date.now() + windowMs + 1000
    jest.spyOn(Date, 'now').mockReturnValue(newTime)
    
    // 時間ウィンドウが過ぎたので再び許可される
    expect(simpleRateLimit(ip, limit, windowMs)).toBe(true)
  })

  it('異なるIPアドレスは独立して制限される', () => {
    const ip1 = '192.168.1.4'
    const ip2 = '192.168.1.5'
    const limit = 2
    const windowMs = 60000
    
    // IP1で制限まで使用
    expect(simpleRateLimit(ip1, limit, windowMs)).toBe(true)
    expect(simpleRateLimit(ip1, limit, windowMs)).toBe(true)
    expect(simpleRateLimit(ip1, limit, windowMs)).toBe(false) // 制限超過
    
    // IP2は独立して制限される
    expect(simpleRateLimit(ip2, limit, windowMs)).toBe(true)
    expect(simpleRateLimit(ip2, limit, windowMs)).toBe(true)
    expect(simpleRateLimit(ip2, limit, windowMs)).toBe(false) // 制限超過
  })

  it('デフォルト値が正しく適用される', () => {
    const ip = '192.168.1.6'
    
    // デフォルト値での制限チェック（100回/60秒）
    for (let i = 0; i < 100; i++) {
      expect(simpleRateLimit(ip)).toBe(true)
    }
    
    // 101回目は拒否される
    expect(simpleRateLimit(ip)).toBe(false)
  })

  it('カスタムの制限値とウィンドウが適用される', () => {
    const ip = '192.168.1.7'
    const customLimit = 1
    const customWindow = 1000 // 1秒
    
    // 1回目は許可
    expect(simpleRateLimit(ip, customLimit, customWindow)).toBe(true)
    
    // 2回目は拒否
    expect(simpleRateLimit(ip, customLimit, customWindow)).toBe(false)
    
    // 時間を進める
    jest.advanceTimersByTime(customWindow + 100)
    const newTime = Date.now() + customWindow + 100
    jest.spyOn(Date, 'now').mockReturnValue(newTime)
    
    // ウィンドウが過ぎたので再び許可
    expect(simpleRateLimit(ip, customLimit, customWindow)).toBe(true)
  })

  it('部分的に期限切れのリクエストが正しく処理される', () => {
    const ip = '192.168.1.8'
    const limit = 3
    const windowMs = 60000
    
    // 最初のリクエスト
    expect(simpleRateLimit(ip, limit, windowMs)).toBe(true)
    
    // 30秒後に2つのリクエスト
    jest.advanceTimersByTime(30000)
    let newTime = Date.now() + 30000
    jest.spyOn(Date, 'now').mockReturnValue(newTime)
    
    expect(simpleRateLimit(ip, limit, windowMs)).toBe(true)
    expect(simpleRateLimit(ip, limit, windowMs)).toBe(true)
    
    // この時点で制限に達する
    expect(simpleRateLimit(ip, limit, windowMs)).toBe(false)
    
    // さらに35秒後（最初のリクエストから65秒後）
    jest.advanceTimersByTime(35000)
    newTime = Date.now() + 30000 + 35000
    jest.spyOn(Date, 'now').mockReturnValue(newTime)
    
    // 最初のリクエストが期限切れになったので再び許可される
    expect(simpleRateLimit(ip, limit, windowMs)).toBe(true)
  })
})