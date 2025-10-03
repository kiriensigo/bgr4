import '@testing-library/jest-dom'
import { jest } from '@jest/globals'

// Ensure required public env vars exist for modules that read them at import time
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key-12345678901234567890'
}

// TextEncoder/TextDecoderをNode.js環境に追加
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder
}

// Polyfill Web Streams for libraries expecting them in test env
try {
  if (typeof global.TransformStream === 'undefined') {
    // Node 18+ provides this via stream/web
    const { TransformStream } = require('stream/web')
    // @ts-ignore
    global.TransformStream = TransformStream
  }
} catch {}

// Provide WHATWG Fetch APIs via undici for Node test env
try {
  const { fetch, Headers, Request, Response } = require('undici')
  // @ts-ignore
  if (typeof global.fetch === 'undefined') global.fetch = fetch
  // @ts-ignore
  if (typeof global.Headers === 'undefined') global.Headers = Headers
  // @ts-ignore
  if (typeof global.Request === 'undefined') global.Request = Request
  // @ts-ignore
  if (typeof global.Response === 'undefined') global.Response = Response
} catch {
  // fallback: keep jest default if undici not available
}

// MSW設定はコメントアウト（現在は使用しない）
// import { server } from './__tests__/mocks/server'
// beforeAll(() => server.listen())
// afterEach(() => server.resetHandlers())
// afterAll(() => server.close())

// Next.js関連のモック
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))


// Mock lucide-react icons to simple SVG components for Jest
jest.mock('lucide-react', () => {
  const React = require('react')
  return new Proxy({}, {
    get: (_, iconName) => {
      const LucideIcon = ({ children, ...props }) =>
        React.createElement('svg', { ...props, 'data-icon': iconName }, children)
      LucideIcon.displayName = `MockLucideIcon(${String(iconName)})`
      return LucideIcon
    },
  })
})

// Next.js Image コンポーネントのモック
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />
  },
}))

// IntersectionObserver のモック
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// ResizeObserver のモック
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// BroadcastChannel polyfill for libraries expecting it (e.g., msw internals)
if (typeof global.BroadcastChannel === 'undefined') {
  class MockBroadcastChannel {
    constructor(name) {
      this.name = name
      this.onmessage = null
    }
    postMessage(_) {}
    addEventListener(_, __) {}
    removeEventListener(_, __) {}
    close() {}
  }
  // @ts-ignore
  global.BroadcastChannel = MockBroadcastChannel
}

// matchMedia のモック (jsdom環境でのみ実行)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}

// Supabaseクライアントのモック
jest.mock('@/lib/supabase', () => ({
  createSupabaseClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      maybeSingle: jest.fn(),
    })),
  })),
}))

// コンソールエラーを一時的に無効化（テスト中の不要なログを抑制）
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
