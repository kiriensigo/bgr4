import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = body?.email as string | undefined
    if (!email) {
      return NextResponse.json({ success: false, message: 'email is required' }, { status: 400 })
    }

    const base = process.env['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3001'
    const redirectTo = `${base}/dev/slider-test`

    // Generate a magic signup link (creates user if not exists)
    // See: supabase.auth.admin.generateLink
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email,
      options: { redirectTo }
    } as any)

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    // action_link is a one-time link to complete auth in the browser
    // For PW tests, navigate to this link to establish a session
    const actionLink = (data as any)?.properties?.action_link || (data as any)?.action_link
    if (!actionLink) {
      return NextResponse.json({ success: false, message: 'No action link returned' }, { status: 500 })
    }

    return NextResponse.json({ success: true, actionLink, redirectTo })
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message || 'unknown error' }, { status: 500 })
  }
}

