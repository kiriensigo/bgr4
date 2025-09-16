import { useEffect, useRef } from 'react'

// 簡易フォーカス管理
export function useSimpleFocus(isOpen: boolean) {
  const containerRef = useRef<HTMLElement>(null)
  
  useEffect(() => {
    if (isOpen && containerRef.current) {
      // コンテナ内の最初のフォーカス可能要素にフォーカス
      const firstFocusable = containerRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement
      
      if (firstFocusable) {
        firstFocusable.focus()
      }
    }
  }, [isOpen])
  
  return containerRef
}

// フォーカストラップ（モーダル用）
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLElement>(null)
  
  useEffect(() => {
    if (!isActive || !containerRef.current) return
    
    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>
    
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Tab') return
      
      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement?.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement?.focus()
        }
      }
    }
    
    container.addEventListener('keydown', handleKeyDown)
    
    // 初期フォーカス
    firstElement?.focus()
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive])
  
  return containerRef
}