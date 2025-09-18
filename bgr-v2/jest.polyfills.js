// Early polyfills before tests import modules that rely on Web APIs

// Public env vars some modules read at import time
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key-12345678901234567890'
}

// WHATWG Fetch API via undici for Node
try {
  const { fetch, Headers, Request, Response } = require('undici')
  if (typeof global.fetch === 'undefined') global.fetch = fetch
  if (typeof global.Headers === 'undefined') global.Headers = Headers
  if (typeof global.Request === 'undefined') global.Request = Request
  if (typeof global.Response === 'undefined') global.Response = Response
} catch {}


// Web Streams polyfill (TransformStream)
try {
  if (typeof global.TransformStream === 'undefined') {
    const { TransformStream } = require('stream/web')
    global.TransformStream = TransformStream
  }
} catch {}

// BroadcastChannel polyfill used by some libs
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
  global.BroadcastChannel = MockBroadcastChannel
}
