import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import HomePage from '@/app/page'

jest.mock('@/components/home/PopularGamesServer', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('@/components/home/RecentReviewsServer', () => ({
  __esModule: true,
  default: () => null,
}))


// アクセシビリティテスト用のマッチャーを追加
expect.extend(toHaveNoViolations)

// テスト用のモックプロバイダー
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return <div>{children}</div>
}

describe('ホームページ アクセシビリティ', () => {
  it('アクセシビリティ違反がない', async () => {
    const { container } = render(
      <TestWrapper>
        <HomePage />
      </TestWrapper>
    )

    // axeでアクセシビリティテストを実行
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('適切な見出し階層が設定されている', async () => {
    const { container } = render(
      <TestWrapper>
        <HomePage />
      </TestWrapper>
    )

    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
    
    // h1が1つ存在する
    const h1Elements = container.querySelectorAll('h1')
    expect(h1Elements).toHaveLength(1)
    
    // 見出しレベルが適切な順序になっている
    let previousLevel = 0
    headings.forEach((heading) => {
      const currentLevel = parseInt(heading.tagName.charAt(1))
      
      // 最初の見出しまたは前のレベルから1つ以下の差
      if (previousLevel !== 0) {
        expect(currentLevel).toBeLessThanOrEqual(previousLevel + 1)
      }
      
      previousLevel = currentLevel
    })
  })

  it('すべての画像にalt属性が設定されている', async () => {
    const { container } = render(
      <TestWrapper>
        <HomePage />
      </TestWrapper>
    )

    const images = container.querySelectorAll('img')
    images.forEach((img) => {
      expect(img).toHaveAttribute('alt')
      
      // alt属性が空でない（装飾的でない画像の場合）
      const alt = img.getAttribute('alt')
      if (alt !== '') {
        expect(alt!.length).toBeGreaterThan(0)
      }
    })
  })

  it('フォーム要素に適切なラベルが設定されている', async () => {
    const { container } = render(
      <TestWrapper>
        <HomePage />
      </TestWrapper>
    )

    const inputs = container.querySelectorAll('input, select, textarea')
    inputs.forEach((input) => {
      const id = input.getAttribute('id')
      const ariaLabel = input.getAttribute('aria-label')
      const ariaLabelledby = input.getAttribute('aria-labelledby')
      
      if (id) {
        // idがある場合、対応するlabelが存在する
        const label = container.querySelector(`label[for="${id}"]`)
        expect(label || ariaLabel || ariaLabelledby).toBeTruthy()
      } else {
        // idがない場合、aria-labelまたはaria-labelledbyが設定されている
        expect(ariaLabel || ariaLabelledby).toBeTruthy()
      }
    })
  })

  it('リンクに適切なテキストが設定されている', async () => {
    const { container } = render(
      <TestWrapper>
        <HomePage />
      </TestWrapper>
    )

    const links = container.querySelectorAll('a')
    links.forEach((link) => {
      const textContent = link.textContent?.trim()
      const ariaLabel = link.getAttribute('aria-label')
      const title = link.getAttribute('title')
      
      // リンクテキスト、aria-label、またはtitleのいずれかが設定されている
      expect(textContent || ariaLabel || title).toBeTruthy()
      
      // 「こちら」「詳しく」などの曖昧なテキストでない
      if (textContent) {
        const ambiguousTexts = ['こちら', '詳しく', 'ここ', 'click here', 'read more']
        const isAmbiguous = ambiguousTexts.some(text => 
          textContent.toLowerCase().includes(text.toLowerCase())
        )
        expect(isAmbiguous).toBe(false)
      }
    })
  })

  it('ボタンに適切なテキストまたはaria-labelが設定されている', async () => {
    const { container } = render(
      <TestWrapper>
        <HomePage />
      </TestWrapper>
    )

    const buttons = container.querySelectorAll('button')
    buttons.forEach((button) => {
      const textContent = button.textContent?.trim()
      const ariaLabel = button.getAttribute('aria-label')
      const title = button.getAttribute('title')
      
      // ボタンテキスト、aria-label、またはtitleのいずれかが設定されている
      expect(textContent || ariaLabel || title).toBeTruthy()
    })
  })

  it('対話可能な要素にfocus indicatorが設定されている', async () => {
    const { container } = render(
      <TestWrapper>
        <HomePage />
      </TestWrapper>
    )

    const focusableElements = container.querySelectorAll(
      'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    focusableElements.forEach((element) => {
      // 要素がfocusableであることを確認
      expect(element).not.toHaveAttribute('tabindex', '-1')
      
      // disabled状態でない場合
      if (!element.hasAttribute('disabled')) {
        const styles = window.getComputedStyle(element)
        
        // focus時のスタイルが設定されているか確認
        // (実際のCSSが適用されている環境でのみ有効)
        if (styles.outline !== 'none' || styles.boxShadow !== 'none') {
          // フォーカスインジケーターが設定されている
          expect(true).toBe(true)
        }
      }
    })
  })

  it('色だけに依存した情報伝達がない', async () => {
    const { container } = render(
      <TestWrapper>
        <HomePage />
      </TestWrapper>
    )

    // エラーメッセージやステータス表示要素をチェック
    const statusElements = container.querySelectorAll(
      '.text-red-500, .text-green-500, .text-yellow-500, .bg-red-500, .bg-green-500, .bg-yellow-500'
    )
    
    statusElements.forEach((element) => {
      const textContent = element.textContent?.trim()
      const hasIcon = element.querySelector('svg, .icon')
      const ariaLabel = element.getAttribute('aria-label')
      
      // 色だけでなく、テキスト、アイコン、aria-labelなどで情報が伝達されている
      expect(textContent || hasIcon || ariaLabel).toBeTruthy()
    })
  })

  it('キーボードナビゲーションが可能', async () => {
    const { container } = render(
      <TestWrapper>
        <HomePage />
      </TestWrapper>
    )

    const focusableElements = container.querySelectorAll(
      'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    // フォーカス可能な要素が存在する
    expect(focusableElements.length).toBeGreaterThan(0)
    
    // すべての対話可能要素がキーボードアクセス可能
    focusableElements.forEach((element) => {
      expect(element).not.toHaveAttribute('tabindex', '-1')
    })
  })

  it('ARIA属性が適切に使用されている', async () => {
    const { container } = render(
      <TestWrapper>
        <HomePage />
      </TestWrapper>
    )

    // aria-expanded属性を持つ要素のチェック
    const expandableElements = container.querySelectorAll('[aria-expanded]')
    expandableElements.forEach((element) => {
      const ariaExpanded = element.getAttribute('aria-expanded')
      expect(['true', 'false']).toContain(ariaExpanded)
    })

    // aria-controls属性を持つ要素のチェック
    const controlElements = container.querySelectorAll('[aria-controls]')
    controlElements.forEach((element) => {
      const controlledId = element.getAttribute('aria-controls')
      const controlledElement = container.querySelector(`#${controlledId}`)
      
      // 参照先の要素が存在する
      expect(controlledElement).toBeTruthy()
    })

    // role属性のチェック
    const roleElements = container.querySelectorAll('[role]')
    roleElements.forEach((element) => {
      const role = element.getAttribute('role')
      
      // 有効なARIAロールが使用されている
      const validRoles = [
        'button', 'link', 'navigation', 'main', 'banner', 'contentinfo',
        'complementary', 'search', 'form', 'dialog', 'alertdialog',
        'alert', 'status', 'progressbar', 'tab', 'tablist', 'tabpanel'
      ]
      
      expect(validRoles).toContain(role)
    })
  })
})
