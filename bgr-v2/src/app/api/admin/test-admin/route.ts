import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!
)

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'ユーザーIDが必要です' },
        { status: 400 }
      )
    }

    // ユーザーを管理者に設定（テスト用）
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'ユーザーを管理者に設定しました',
      data
    })

  } catch (error) {
    console.error('Test admin API error:', error)
    return NextResponse.json(
      { success: false, message: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}