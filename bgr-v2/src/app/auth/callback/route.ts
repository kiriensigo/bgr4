import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const next = searchParams.get('next') ?? '/'

  // Handle OAuth errors
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
  }

  if (code) {
    // PKCEフローでクライアントサイド処理にリダイレクト
    return NextResponse.redirect(`${origin}/login#code=${code}&next=${encodeURIComponent(next)}`)
  }

  // No code provided
  return NextResponse.redirect(`${origin}/login?error=auth_required`)
}