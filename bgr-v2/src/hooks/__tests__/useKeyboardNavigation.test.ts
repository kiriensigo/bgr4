import { renderHook } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { useKeyboardNavigation } from '../useKeyboardNavigation'

describe('useKeyboardNavigation', () => {
  let mockElements: HTMLElement[]

  beforeEach(() => {
    // モック要素を作成
    mockElements = Array.from({ length: 3 }, (_, index) => {
      const element = document.createElement('button')
      element.textContent = `Button ${index + 1}`
      element.focus = jest.fn()
      return element
    })
  })

  afterEach(() => {
    // イベントリスナーのクリーンアップのため
    document.removeEventListener = jest.fn()
  })

  it('ArrowDown キーで次の要素にフォーカスする', () => {
    renderHook(() => useKeyboardNavigation(mockElements))

    // ArrowDown キーイベントを発火
    fireEvent.keyDown(document, { key: 'ArrowDown' })

    // 次の要素（インデックス1）にフォーカスが移動
    expect(mockElements[1].focus).toHaveBeenCalled()
  })

  it('ArrowUp キーで前の要素にフォーカスする', () => {
    renderHook(() => useKeyboardNavigation(mockElements))

    // まず ArrowDown で要素1に移動
    fireEvent.keyDown(document, { key: 'ArrowDown' })
    
    // ArrowUp で要素0に戻る
    fireEvent.keyDown(document, { key: 'ArrowUp' })

    expect(mockElements[0].focus).toHaveBeenCalled()
  })

  it('Home キーで最初の要素にフォーカスする', () => {
    renderHook(() => useKeyboardNavigation(mockElements))

    // まず最後の要素に移動
    fireEvent.keyDown(document, { key: 'End' })
    
    // Home キーで最初の要素に移動
    fireEvent.keyDown(document, { key: 'Home' })

    expect(mockElements[0].focus).toHaveBeenCalled()
  })

  it('End キーで最後の要素にフォーカスする', () => {
    renderHook(() => useKeyboardNavigation(mockElements))

    // End キーで最後の要素に移動
    fireEvent.keyDown(document, { key: 'End' })

    expect(mockElements[2].focus).toHaveBeenCalled()
  })

  it('ループが有効な場合、最後の要素から次に進むと最初の要素に戻る', () => {
    renderHook(() => useKeyboardNavigation(mockElements, true))

    // 最後の要素に移動
    fireEvent.keyDown(document, { key: 'End' })
    
    // さらに ArrowDown で最初の要素に戻る
    fireEvent.keyDown(document, { key: 'ArrowDown' })

    expect(mockElements[0].focus).toHaveBeenCalled()
  })

  it('ループが無効な場合、最後の要素から次に進んでも最後の要素に留まる', () => {
    renderHook(() => useKeyboardNavigation(mockElements, false))

    // 最後の要素に移動
    fireEvent.keyDown(document, { key: 'End' })
    
    // さらに ArrowDown しても最後の要素に留まる
    fireEvent.keyDown(document, { key: 'ArrowDown' })

    // 最後の要素のfocusが2回呼ばれる（End + ArrowDown）
    expect(mockElements[2].focus).toHaveBeenCalledTimes(2)
  })

  it('ループが無効な場合、最初の要素から前に戻っても最初の要素に留まる', () => {
    renderHook(() => useKeyboardNavigation(mockElements, false))

    // 最初の状態で ArrowUp
    fireEvent.keyDown(document, { key: 'ArrowUp' })

    expect(mockElements[0].focus).toHaveBeenCalled()
  })

  it('要素が空の場合はエラーが発生しない', () => {
    const emptyElements: HTMLElement[] = []
    
    expect(() => {
      renderHook(() => useKeyboardNavigation(emptyElements))
      fireEvent.keyDown(document, { key: 'ArrowDown' })
    }).not.toThrow()
  })

  it('関係のないキーでは何も起こらない', () => {
    renderHook(() => useKeyboardNavigation(mockElements))

    // 関係のないキーイベント
    fireEvent.keyDown(document, { key: 'Enter' })
    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.keyDown(document, { key: 'a' })

    // どの要素にもフォーカスが移動しない
    mockElements.forEach(element => {
      expect(element.focus).not.toHaveBeenCalled()
    })
  })

  it('preventDefault が適切に呼ばれる', () => {
    renderHook(() => useKeyboardNavigation(mockElements))

    // spyOnでpreventDefaultを監視
    const preventDefaultSpy = jest.fn()
    const mockEvent = new KeyboardEvent('keydown', { 
      key: 'ArrowDown',
      bubbles: true,
      cancelable: true
    })
    
    // preventDefaultをスパイ
    Object.defineProperty(mockEvent, 'preventDefault', {
      value: preventDefaultSpy,
      writable: true
    })

    document.dispatchEvent(mockEvent)

    expect(preventDefaultSpy).toHaveBeenCalled()
  })
})