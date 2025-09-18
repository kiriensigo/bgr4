import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getGameDetailForAutoRegistration, getBggGameRawData } from '@/lib/bgg-api'
import { convertBggToSiteData } from '@/lib/bgg-mapping'
import { translateToJapanese } from '@/lib/translate'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const bggId = body?.bggId

    if (!bggId || typeof bggId !== 'number') {
      return NextResponse.json(
        { success: false, message: 'Valid BGG ID is required' },
        { status: 400 }
      )
    }

    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authorization token required' },
        { status: 401 }
      )
    }

    const supabase = createServerClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['SUPABASE_SERVICE_ROLE_KEY']!,
      {
        cookies: {
          get() { return undefined },
          set() {},
          remove() {},
        },
        auth: { persistSession: false },
      }
    )

    const { data: { user }, error: authError } = await (supabase as any).auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    const existingRes = await (supabase as any)
      .from('games')
      .select('id, name')
      .eq('bgg_id', bggId)
      .single()
    const existingGame = existingRes?.data
    if (existingGame) {
      return NextResponse.json(
        {
          success: false,
          message: `このゲーム「${existingGame.name}」は既に登録されています`,
          existingGameId: existingGame.id,
        },
        { status: 409 }
      )
    }

    // Try v2 helper first; fallback to legacy mapping used in older tests
    let gameRegistrationData = await getGameDetailForAutoRegistration(bggId)
    let bggGameData: any
    let registrationData: any
    if (!gameRegistrationData) {
      const raw = typeof (getBggGameRawData as any) === 'function' ? await (getBggGameRawData as any)(bggId) : null
      if (!raw) {
        return NextResponse.json(
          { success: false, message: 'BGG からゲーム情報を取得できませんでした' },
          { status: 404 }
        )
      }
      const mapped: any = convertBggToSiteData(
        (raw as any).categories || [],
        (raw as any).mechanics || [],
        (raw as any).publishers || [],
        [],
        []
      )
      bggGameData = {
        id: raw.id,
        name: raw.name,
        description: raw.description,
        yearPublished: raw.yearPublished,
        minPlayers: raw.minPlayers,
        maxPlayers: raw.maxPlayers,
        playingTime: raw.playingTime,
        minPlayingTime: raw.minPlayingTime,
        maxPlayingTime: raw.maxPlayingTime,
        minAge: raw.minAge,
        imageUrl: raw.image,
        thumbnailUrl: raw.thumbnail,
        categories: mapped.siteCategories || [],
        mechanics: mapped.siteMechanics || [],
        designers: raw.designers || [],
        averageRating: raw.averageRating,
        ratingCount: raw.ratingCount,
      }
      registrationData = { useName: raw.name, usePublisher: (mapped.normalizedPublishers || [])[0], reason: 'legacy-mapping' }
    } else {
      ;({ gameDetail: bggGameData, registrationData } = gameRegistrationData)
    }

    console.log(`Registering game with decision: ${registrationData.reason}`)
    console.log(`Using name: ${registrationData.useName}`)
    console.log(`Using publisher: ${registrationData.usePublisher}`)

    let translatedDescription = bggGameData.description
    if (bggGameData.description && bggGameData.description.trim().length > 0) {
      try {
        const translationResult = await translateToJapanese(bggGameData.description)
        translatedDescription = translationResult.translatedText
        console.log(`Translation completed: ${bggGameData.description.substring(0, 100)}... -> ${translatedDescription.substring(0, 100)}...`)
      } catch (error) {
        console.warn('Translation failed, using original description:', error)
      }
    }

    const gameData: any = {
      id: bggGameData.id,
      bgg_id: bggGameData.id,
      name: registrationData.useName,
      description: translatedDescription,
      year_published: bggGameData.yearPublished,
      min_players: bggGameData.minPlayers,
      max_players: bggGameData.maxPlayers,
      playing_time: bggGameData.playingTime,
      min_playing_time: bggGameData.minPlayingTime,
      max_playing_time: bggGameData.maxPlayingTime,
      min_age: bggGameData.minAge,
      image_url: bggGameData.japaneseImageUrl || bggGameData.imageUrl,
      thumbnail_url: bggGameData.thumbnailUrl,
      categories: bggGameData.categories || [],
      mechanics: bggGameData.mechanics || [],
      designers: bggGameData.designers || [],
      publishers: registrationData.usePublisher ? [registrationData.usePublisher] : [],
      rating_average: bggGameData.averageRating,
      rating_count: bggGameData.ratingCount,
    }

    console.log('[register-from-bgg] Prepared insert payload', {
      bgg_id: gameData.bgg_id,
      name: gameData.name,
      min_players: gameData.min_players,
      max_players: gameData.max_players,
      playing_time: gameData.playing_time,
      min_playing_time: gameData.min_playing_time,
      max_playing_time: gameData.max_playing_time,
      categories_len: Array.isArray(gameData.categories) ? gameData.categories.length : null,
      mechanics_len: Array.isArray(gameData.mechanics) ? gameData.mechanics.length : null,
      publishers_len: Array.isArray(gameData.publishers) ? gameData.publishers.length : null,
    })

    const insertRes = await (supabase as any)
      .from('games')
      .insert(gameData)
      .select('*')
      .single()
    const newGame = insertRes?.data
    const insertError = insertRes?.error
    if (insertError) {
      console.error('Database insert error:', insertError)
      return NextResponse.json(
        { success: false, message: 'ゲームの登録に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'ゲームが正常に登録されました', data: newGame })
  } catch (error) {
    console.error('BGG game registration error:', error)
    return NextResponse.json(
      { success: false, message: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
