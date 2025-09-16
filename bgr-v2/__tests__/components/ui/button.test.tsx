import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('正常にレンダリングされる', () => {
    render(<Button>テストボタン</Button>)
    expect(screen.getByRole('button', { name: 'テストボタン' })).toBeInTheDocument()
  })

  it('クリックイベントが正しく動作する', async () => {
    const user = userEvent.setup()
    const handleClick = jest.fn()
    
    render(<Button onClick={handleClick}>クリック</Button>)
    
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('disabled状態で正しく動作する', async () => {
    const user = userEvent.setup()
    const handleClick = jest.fn()
    
    render(<Button disabled onClick={handleClick}>無効ボタン</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    
    await user.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('variant プロパティが正しく適用される', () => {
    const { rerender } = render(<Button variant="default">デフォルト</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-primary')

    rerender(<Button variant="destructive">削除</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-destructive')

    rerender(<Button variant="outline">アウトライン</Button>)
    expect(screen.getByRole('button')).toHaveClass('border-input')

    rerender(<Button variant="secondary">セカンダリ</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-secondary')

    rerender(<Button variant="ghost">ゴースト</Button>)
    expect(screen.getByRole('button')).toHaveClass('hover:bg-accent')

    rerender(<Button variant="link">リンク</Button>)
    expect(screen.getByRole('button')).toHaveClass('text-primary')
  })

  it('size プロパティが正しく適用される', () => {
    const { rerender } = render(<Button size="default">デフォルト</Button>)
    expect(screen.getByRole('button')).toHaveClass('h-10')

    rerender(<Button size="sm">小</Button>)
    expect(screen.getByRole('button')).toHaveClass('h-9')

    rerender(<Button size="lg">大</Button>)
    expect(screen.getByRole('button')).toHaveClass('h-11')

    rerender(<Button size="icon">アイコン</Button>)
    expect(screen.getByRole('button')).toHaveClass('h-10', 'w-10')
  })

  it('asChild プロパティでリンクとして動作する', () => {
    render(
      <Button asChild>
        <a href="/test">リンクボタン</a>
      </Button>
    )
    
    const link = screen.getByRole('link')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/test')
    expect(link).toHaveTextContent('リンクボタン')
  })

  it('カスタムクラス名が適用される', () => {
    render(<Button className="custom-class">カスタム</Button>)
    expect(screen.getByRole('button')).toHaveClass('custom-class')
  })

  it('loading状態のアクセシビリティが正しい', () => {
    render(<Button disabled>読み込み中...</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveTextContent('読み込み中...')
  })

  it('キーボードナビゲーションが正しく動作する', async () => {
    const user = userEvent.setup()
    const handleClick = jest.fn()
    
    render(<Button onClick={handleClick}>キーボードテスト</Button>)
    
    const button = screen.getByRole('button')
    button.focus()
    
    await user.keyboard('{Enter}')
    expect(handleClick).toHaveBeenCalledTimes(1)
    
    await user.keyboard(' ')
    expect(handleClick).toHaveBeenCalledTimes(2)
  })
})