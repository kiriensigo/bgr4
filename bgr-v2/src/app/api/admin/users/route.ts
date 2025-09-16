import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getAdminUsersList } from '@/lib/admin'

export async function GET(request: NextRequest) {
  try {
    // 管理者権限チェック（認証込み）
    await requireAdmin()

    // クエリパラメータ取得
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const result = await getAdminUsersList(page, limit)

    return NextResponse.json(result)

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
      if (error.message === 'Administrator privileges required') {
        return NextResponse.json(
          { error: 'Administrator privileges required' },
          { status: 403 }
        )
      }
    }

    console.error('Admin users API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}