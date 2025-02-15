"use client"

import { useState, useEffect } from "react"

interface FlashMessageProps {
  message: string
  duration?: number
  onClose: () => void
}

export function FlashMessage({ message, duration = 3000, onClose }: FlashMessageProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!isVisible) return null

  return <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg">{message}</div>
}

