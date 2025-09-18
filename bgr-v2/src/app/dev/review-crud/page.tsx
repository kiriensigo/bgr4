'use client'

import { useEffect, useMemo, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client'
import { EnhancedReviewForm } from '@/components/reviews/EnhancedReviewForm'

type InitialData = {
  id?: number
  overall_score?: number
  complexity_score?: number
  luck_factor?: number
  interaction_score?: number
  downtime_score?: number
  recommended_players?: string[]
  mechanics?: string[]
  categories?: string[]
  content?: string
  is_published?: boolean
}

export default function ReviewCrudDevPage() {
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  const [gameId, setGameId] = useState<number>(30549)
  const [loading, setLoading] = useState(false)
  const [foundReviewId, setFoundReviewId] = useState<number | null>(null)
  const [initialData, setInitialData] = useState<InitialData | undefined>(undefined)
  const [status, setStatus] = useState<string>('')

  useEffect(() => {
    const supabase = getSupabaseClient()
    supabase.auth.getUser().then(({ data }) => setSessionUserId(data.user?.id || null))
  }, [])

  const loadMyLatest = async () => {
    try {
      setLoading(true)
      setStatus('loading latest...')
      const supabase = getSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', user.id)
        .eq('game_id', gameId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error
      if (!data) {
        setFoundReviewId(null)
        setInitialData(undefined)
        setStatus('no review found')
        return
      }

      setFoundReviewId(data.id)
      setInitialData({
        id: data.id,
        overall_score: data.overall_score ?? data.rating ?? 7.5,
        complexity_score: data.complexity_score ?? 3,
        luck_factor: data.luck_factor ?? 3,
        interaction_score: data.interaction_score ?? 3,
        downtime_score: data.downtime_score ?? 3,
        content: data.content ?? ''
      })
      setStatus('loaded')
    } catch (e: any) {
      setStatus(`error: ${e?.message || 'failed'}`)
    } finally {
      setLoading(false)
    }
  }

  const deleteMine = async () => {
    try {
      setLoading(true)
      setStatus('deleting...')
      const supabase = getSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')
      if (!foundReviewId) throw new Error('No review loaded')

      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', foundReviewId)
        .eq('user_id', user.id)
      if (error) throw error

      setStatus('deleted')
      setFoundReviewId(null)
      setInitialData(undefined)
    } catch (e: any) {
      setStatus(`error: ${e?.message || 'failed'}`)
    } finally {
      setLoading(false)
    }
  }

  const isEdit = !!initialData?.id

  return (
    <div className="min-h-screen bg-background p-6">
      <h1 className="text-2xl font-bold mb-4">Dev: Review CRUD</h1>

      <div className="flex gap-3 items-center mb-4">
        <label className="text-sm">Game ID:</label>
        <input
          type="number"
          className="border rounded px-2 py-1 w-32"
          value={gameId}
          onChange={e => setGameId(parseInt(e.target.value || '0', 10) || 0)}
        />
        <button
          disabled={loading}
          onClick={loadMyLatest}
          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
        >
          Load my latest
        </button>
        <button
          disabled={loading || !foundReviewId}
          onClick={deleteMine}
          className="px-3 py-1 rounded bg-red-500 text-white disabled:opacity-50"
        >
          Delete loaded
        </button>
        <span className="text-sm text-gray-600">{status}</span>
      </div>

      {!sessionUserId && (
        <p className="text-sm text-orange-600 mb-4">未ログインです。<a className="underline" href="/dev/password-login">/dev/password-login</a> からログインしてください。</p>
      )}

      <EnhancedReviewForm
        mode={isEdit ? 'edit' : 'create'}
        gameId={gameId}
        gameName={undefined}
        initialData={initialData}
      />
    </div>
  )
}
