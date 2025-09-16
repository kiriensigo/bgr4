import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClientForAPI } from '@/lib/supabase/server'

export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const supabase = await createServerSupabaseClientForAPI(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Add user ID to request headers for downstream handlers
    const requestWithUser = new NextRequest(request, {
      headers: {
        ...request.headers,
        'x-user-id': user.id
      }
    })

    return await handler(requestWithUser)
  } catch (error) {
    console.error('Auth middleware error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
  }
}

export function requireAuth<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    return withAuth(request, (authedRequest) => handler(authedRequest, ...args))
  }
}