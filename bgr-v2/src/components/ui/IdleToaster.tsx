'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const ToasterLazy = dynamic(() => import('./toaster').then(m => m.Toaster), { ssr: false })

export default function IdleToaster() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const idle = (window as any).requestIdleCallback || ((cb: any) => setTimeout(cb, 800))
    const id = idle(() => setReady(true))
    return () => { if (typeof id === 'number') clearTimeout(id) }
  }, [])

  if (!ready) return null
  return <ToasterLazy />
}

