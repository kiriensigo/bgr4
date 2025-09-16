import { NextResponse } from 'next/server'
import { updateUserAdminStatus, requireAdmin } from '@/lib/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const supabase = await createServerSupabaseClient()
    
    // 現在のユーザーを取得
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: '認証が必要です' },
        { status: 401 }
      )
    }

    // 管理者権限チェック
    await requireAdmin()

    // リクエストボディ取得
    const body = await request.json()
    const { is_admin } = body

    if (typeof is_admin !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'is_adminは真偽値である必要があります' },
        { status: 400 }
      )
    }

    // 自分自身の管理者権限は剥奪できない
    if (resolvedParams.id === user.id && !is_admin) {
      return NextResponse.json(
        { success: false, message: '自分自身の管理者権限は剥奪できません' },
        { status: 400 }
      )
    }

    const updatedUser = await updateUserAdminStatus(resolvedParams.id, is_admin, user.id)

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: is_admin ? '管理者権限を付与しました' : '管理者権限を剥奪しました'
    })

  } catch (error) {
    console.error('Admin user update API error:', error)
    
    if (error instanceof Error && error.message.includes('管理者権限')) {
      return NextResponse.json(
        { success: false, message: '管理者権限が必要です' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'ユーザーの更新に失敗しました' },
      { status: 500 }
    )
  }
}