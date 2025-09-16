import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { OptimizedImage } from '../OptimizedImage'

// Next.js Image コンポーネントをモック
jest.mock('next/image', () => {
  return function MockImage({ 
    onLoadingComplete, 
    onError, 
    alt, 
    className, 
    priority,
    ...props 
  }: any) {
    return (
      <img
        {...props}
        alt={alt}
        className={className}
        data-priority={priority ? 'true' : 'false'}
        onLoad={() => onLoadingComplete?.()}
        onError={() => onError?.()}
        data-testid="mock-image"
      />
    )
  }
})

describe('OptimizedImage', () => {
  const defaultProps = {
    src: '/test-image.jpg',
    alt: 'Test image',
    width: 300,
    height: 300,
  }

  it('基本的な画像が正しくレンダリングされる', () => {
    render(<OptimizedImage {...defaultProps} />)

    const image = screen.getByTestId('mock-image')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('alt', 'Test image')
    expect(image).toHaveAttribute('src', '/test-image.jpg')
  })

  it('初期状態ではローディングスケルトンが表示される', () => {
    render(<OptimizedImage {...defaultProps} />)

    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveClass('animate-pulse', 'bg-gray-200')
  })

  it('画像読み込み完了時にローディングスケルトンが非表示になる', () => {
    render(<OptimizedImage {...defaultProps} />)

    const image = screen.getByTestId('mock-image')
    
    // 初期状態でローディング状態
    expect(image).toHaveClass('opacity-0')
    
    // 画像読み込み完了をシミュレート
    fireEvent.load(image)
    
    // ローディング完了後は不透明度が100%
    expect(image).toHaveClass('opacity-100')
  })

  it('画像読み込みエラー時にエラーメッセージが表示される', () => {
    render(<OptimizedImage {...defaultProps} />)

    const image = screen.getByTestId('mock-image')
    
    // 画像読み込みエラーをシミュレート
    fireEvent.error(image)
    
    // エラーメッセージが表示される
    expect(screen.getByText('画像を読み込めません')).toBeInTheDocument()
    
    // 画像は表示されない
    expect(screen.queryByTestId('mock-image')).not.toBeInTheDocument()
  })

  it('カスタムクラス名が適用される', () => {
    render(
      <OptimizedImage 
        {...defaultProps} 
        className="custom-class rounded-lg" 
      />
    )

    const container = screen.getByTestId('image-container')
    expect(container).toHaveClass('custom-class', 'rounded-lg')
  })

  it('priority プロパティが Image コンポーネントに渡される', () => {
    render(<OptimizedImage {...defaultProps} priority={true} />)

    const image = screen.getByTestId('mock-image')
    expect(image).toHaveAttribute('data-priority', 'true')
  })

  it('カスタムサイズが適用される', () => {
    render(
      <OptimizedImage 
        {...defaultProps}
        width={500}
        height={400}
      />
    )

    const image = screen.getByTestId('mock-image')
    expect(image).toHaveAttribute('width', '500')
    expect(image).toHaveAttribute('height', '400')
  })

  it('sizes属性が適切に設定される', () => {
    render(<OptimizedImage {...defaultProps} />)

    const image = screen.getByTestId('mock-image')
    expect(image).toHaveAttribute('sizes', '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw')
  })
})