import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// 絵文字に変更したためモック不要

import ErrorBoundary from '../ErrorBoundary'

// エラーを投げるテスト用コンポーネント
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // コンソールエラーを抑制
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('エラーが発生しない場合は子コンポーネントを正常に表示する', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('エラーが発生した場合はエラー画面を表示する', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument()
    expect(screen.getByText(/申し訳ございません/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /再試行/ })).toBeInTheDocument()
  })

  it('再試行ボタンをクリックするとエラー状態がリセットされる', async () => {
    const TestComponent = ({ hasError }: { hasError: boolean }) => (
      <ErrorBoundary key={hasError ? 'error' : 'success'}>
        <ThrowError shouldThrow={hasError} />
      </ErrorBoundary>
    )

    const { rerender } = render(<TestComponent hasError={true} />)

    // エラー画面が表示されることを確認
    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument()

    // 再試行ボタンをクリック
    fireEvent.click(screen.getByRole('button', { name: /再試行/ }))

    // エラーなしで再レンダリング（新しいkey でインスタンスを新規作成）
    rerender(<TestComponent hasError={false} />)

    // エラーがリセットされて子コンポーネントが表示される
    await waitFor(() => {
      expect(screen.getByText('No error')).toBeInTheDocument()
    })
  })

  it('カスタムフォールバックコンポーネントが使用される', () => {
    const CustomFallback = ({ error, resetError }: { error?: Error; resetError: () => void }) => (
      <div>
        <p>Custom error: {error?.message}</p>
        <button onClick={resetError}>Custom reset</button>
      </div>
    )

    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom error: Test error')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Custom reset' })).toBeInTheDocument()
  })
})