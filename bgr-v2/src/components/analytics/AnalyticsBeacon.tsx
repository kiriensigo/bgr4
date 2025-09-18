'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { pageview } from '@/lib/analytics'

export default function AnalyticsBeacon() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!pathname) return
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
    const idle = (window as any).requestIdleCallback || ((cb: any) => setTimeout(cb, 800))
    const id = idle(() => pageview(url))
    const onVisible = () => pageview(url)
    window.addEventListener('pageshow', onVisible, { once: true })
    return () => {
      window.removeEventListener('pageshow', onVisible)
      if (typeof id === 'number') clearTimeout(id)
    }
  }, [pathname, searchParams])

  return null
}
