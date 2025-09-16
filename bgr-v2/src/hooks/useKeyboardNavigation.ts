import { useEffect, useRef } from 'react'

export function useKeyboardNavigation(items: HTMLElement[], loop = true) {
  const currentIndex = useRef(0)
  
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (items.length === 0) return
      
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          currentIndex.current = loop 
            ? (currentIndex.current + 1) % items.length
            : Math.min(currentIndex.current + 1, items.length - 1)
          items[currentIndex.current]?.focus()
          break
          
        case 'ArrowUp':
          event.preventDefault()
          currentIndex.current = loop
            ? (currentIndex.current - 1 + items.length) % items.length
            : Math.max(currentIndex.current - 1, 0)
          items[currentIndex.current]?.focus()
          break
          
        case 'Home':
          event.preventDefault()
          currentIndex.current = 0
          items[0]?.focus()
          break
          
        case 'End':
          event.preventDefault()
          currentIndex.current = items.length - 1
          items[items.length - 1]?.focus()
          break
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [items, loop])
  
  return currentIndex.current
}