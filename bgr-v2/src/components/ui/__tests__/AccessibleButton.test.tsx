import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AccessibleButton } from '../AccessibleButton'

describe('AccessibleButton', () => {
  const mockOnClick = jest.fn()

  beforeEach(() => {
    mockOnClick.mockClear()
  })

  it('基本的なボタンが正しくレンダリングされる', () => {
    render(
      <AccessibleButton onClick={mockOnClick}>
        Test Button
      </AccessibleButton>
    )

    const button = screen.getByRole('button', { name: 'Test Button' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('Test Button')
  })

  it('クリックイベントが正しく動作する', () => {
    render(
      <AccessibleButton onClick={mockOnClick}>
        Click me
      </AccessibleButton>
    )

    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  it('disabled状態では適切な属性が設定される', () => {
    render(
      <AccessibleButton onClick={mockOnClick} disabled>
        Disabled Button
      </AccessibleButton>
    )

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-disabled', 'true')
    
    // disabledの場合はクリックイベントが発火しない
    fireEvent.click(button)
    expect(mockOnClick).not.toHaveBeenCalled()
  })

  it('loading状態では適切な属性が設定される', () => {
    render(
      <AccessibleButton onClick={mockOnClick} loading>
        Loading Button
      </AccessibleButton>
    )

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('読み込み中...')).toBeInTheDocument()
    
    // loadingの場合もクリックイベントが発火しない
    fireEvent.click(button)
    expect(mockOnClick).not.toHaveBeenCalled()
  })

  it('ARIA属性が正しく設定される', () => {
    render(
      <AccessibleButton 
        onClick={mockOnClick}
        ariaLabel="Custom label"
        ariaDescribedBy="description-id"
      >
        Button with ARIA
      </AccessibleButton>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Custom label')
    expect(button).toHaveAttribute('aria-describedby', 'description-id')
  })

  it('バリアント（variant）によって適切なクラスが適用される', () => {
    const { rerender } = render(
      <AccessibleButton onClick={mockOnClick} variant="primary">
        Primary Button
      </AccessibleButton>
    )

    let button = screen.getByRole('button')
    expect(button).toHaveClass('bg-blue-600', 'text-white')

    rerender(
      <AccessibleButton onClick={mockOnClick} variant="secondary">
        Secondary Button
      </AccessibleButton>
    )

    button = screen.getByRole('button')
    expect(button).toHaveClass('bg-gray-600', 'text-white')

    rerender(
      <AccessibleButton onClick={mockOnClick} variant="outline">
        Outline Button
      </AccessibleButton>
    )

    button = screen.getByRole('button')
    expect(button).toHaveClass('border', 'border-gray-300', 'text-gray-700')
  })

  it('サイズ（size）によって適切なクラスが適用される', () => {
    const { rerender } = render(
      <AccessibleButton onClick={mockOnClick} size="sm">
        Small Button
      </AccessibleButton>
    )

    let button = screen.getByRole('button')
    expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm')

    rerender(
      <AccessibleButton onClick={mockOnClick} size="md">
        Medium Button
      </AccessibleButton>
    )

    button = screen.getByRole('button')
    expect(button).toHaveClass('px-4', 'py-2', 'text-base')

    rerender(
      <AccessibleButton onClick={mockOnClick} size="lg">
        Large Button
      </AccessibleButton>
    )

    button = screen.getByRole('button')
    expect(button).toHaveClass('px-6', 'py-3', 'text-lg')
  })

  it('フォーカス時に適切なスタイルが適用される', () => {
    render(
      <AccessibleButton onClick={mockOnClick}>
        Focus Button
      </AccessibleButton>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500')
  })

  it('type属性が正しく設定される', () => {
    const { rerender } = render(
      <AccessibleButton onClick={mockOnClick} type="submit">
        Submit Button
      </AccessibleButton>
    )

    let button = screen.getByRole('button')
    expect(button).toHaveAttribute('type', 'submit')

    rerender(
      <AccessibleButton onClick={mockOnClick} type="reset">
        Reset Button
      </AccessibleButton>
    )

    button = screen.getByRole('button')
    expect(button).toHaveAttribute('type', 'reset')
  })
})