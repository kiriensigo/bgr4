"use client"
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { importFromBGGAction } from './actions'

export default function BggImportDevPage() {
  const [pending, start] = useTransition()
  const [result, setResult] = useState<any>(null)
  const [bggId, setBggId] = useState<string>('30549')

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4">Dev: BGG Import Test</h1>
      <form action={(fd) => start(async () => setResult(await importFromBGGAction(fd)))} className="flex items-center gap-2 mb-4">
        <Input name="bggId" value={bggId} onChange={(e) => setBggId(e.target.value)} placeholder="BGG ID (e.g. 30549)" className="w-48" />
        <Button type="submit" disabled={pending}>{pending ? 'Importing...' : 'Import from BGG'}</Button>
      </form>

      {result && (
        <Card>
          <CardContent className="p-4">
            {result.ok ? (
              <div className="space-y-2">
                <div className="font-semibold">Imported / Found:</div>
                <div>ID: {result.data?.id} (BGG: {result.data?.bgg_id})</div>
                <div>Name: {result.data?.name}</div>
                {result.data?.year_published && <div>Year: {result.data?.year_published}</div>}
                <div>Players: {result.data?.min_players} - {result.data?.max_players}</div>
              </div>
            ) : (
              <div className="text-red-600">Error: {result.error}</div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
