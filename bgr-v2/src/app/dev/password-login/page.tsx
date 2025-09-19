'use client'

import { useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client'
import Link from 'next/link'

export default function DevPasswordLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    try {
      setLoading(true)
      setStatus('ログイン中...')
      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      setStatus('ログイン成功')
    } catch (e: any) {
      setStatus(`エラー: ${e?.message || '不明なエラー'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4 border rounded-lg p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Dev Password Login</h1>
        <div className="space-y-2">
          <label className="block text-sm">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="email@example.com"
            data-testid="dev-email"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="password"
            data-testid="dev-password"
          />
        </div>
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded py-2 disabled:opacity-50"
          data-testid="dev-login-btn"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <div className="text-sm text-gray-600" data-testid="dev-status">{status}</div>
        <div className="text-sm">
          <Link className="text-blue-600 underline" href="/dev/slider-test">/dev/slider-test</Link>
        </div>
      </div>
    </div>
  )
}
