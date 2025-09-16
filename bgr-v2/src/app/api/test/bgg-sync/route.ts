import { NextRequest, NextResponse } from 'next/server'

// テスト用BGG同期（認証なし）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { game_ids } = body

    if (!game_ids || !Array.isArray(game_ids)) {
      return NextResponse.json(
        { success: false, message: 'game_ids array required' },
        { status: 400 }
      )
    }

    const results = []

    for (const gameId of game_ids) {
      try {
        // BGGからデータを取得
        const response = await fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${gameId}&stats=1`)
        
        if (!response.ok) {
          throw new Error(`BGG API error: ${response.status}`)
        }

        const xmlText = await response.text()
        
        // min/max プレイ時間を抽出
        const playingTimeMatch = xmlText.match(/<playingtime[^>]*value="(\d+)"/i)
        const minPlayingTimeMatch = xmlText.match(/<minplaytime[^>]*value="(\d+)"/i)
        const maxPlayingTimeMatch = xmlText.match(/<maxplaytime[^>]*value="(\d+)"/i)
        const nameMatch = xmlText.match(/<name[^>]*type="primary"[^>]*value="([^"]+)"/i)

        const result = {
          bgg_id: gameId,
          name: nameMatch?.[1] || 'Unknown',
          playing_time: (playingTimeMatch && playingTimeMatch[1]) ? parseInt(playingTimeMatch[1]) : null,
          min_playing_time: (minPlayingTimeMatch && minPlayingTimeMatch[1]) ? parseInt(minPlayingTimeMatch[1]) : null,
          max_playing_time: (maxPlayingTimeMatch && maxPlayingTimeMatch[1]) ? parseInt(maxPlayingTimeMatch[1]) : null
        }

        results.push(result)

        // BGG APIレート制限を遵守
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        results.push({
          bgg_id: gameId,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: results
    })

  } catch (error) {
    console.error('Test BGG sync error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}