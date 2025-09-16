import { useEffect, useState } from 'react'

interface LiveRegionProps {
  message: string
  politeness?: 'polite' | 'assertive' | 'off'
  atomic?: boolean
}

export function LiveRegion({ 
  message, 
  politeness = 'polite',
  atomic = true 
}: LiveRegionProps) {
  const [announcement, setAnnouncement] = useState('')
  
  useEffect(() => {
    if (message) {
      setAnnouncement(message)
      // 少し遅延してクリアすることで、同じメッセージでも再度読み上げされる
      const timer = setTimeout(() => setAnnouncement(''), 1000)
      return () => clearTimeout(timer)
    }
    return () => {}
  }, [message])
  
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      className="sr-only"
    >
      {announcement}
    </div>
  )
}

// アラート用ライブリージョン
export function AlertLiveRegion({ message }: { message: string }) {
  return (
    <LiveRegion 
      message={message} 
      politeness="assertive" 
      atomic={true}
    />
  )
}

// ステータス更新用ライブリージョン
export function StatusLiveRegion({ message }: { message: string }) {
  return (
    <LiveRegion 
      message={message} 
      politeness="polite" 
      atomic={false}
    />
  )
}