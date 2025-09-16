'use client'

import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{
    error?: Error
    resetError: () => void
  }>
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    }
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  resetError = () => {
    this.setState({ hasError: false })
  }

  override render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return <FallbackComponent {...(this.state.error && { error: this.state.error })} resetError={this.resetError} />
    }

    return this.props.children
  }
}

function DefaultErrorFallback({ error, resetError }: { error?: Error; resetError: () => void }) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-4">
          <span className="text-6xl">⚠️</span>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          エラーが発生しました
        </h2>
        
        <p className="text-gray-600 mb-6">
          申し訳ございません。予期しないエラーが発生しました。
          ページを再読み込みしてもう一度お試しください。
        </p>
        
        {process.env.NODE_ENV === 'development' && error && (
          <details className="text-left mb-6">
            <summary className="cursor-pointer text-sm text-gray-500 mb-2">
              エラー詳細 (開発環境のみ)
            </summary>
            <pre className="text-xs text-red-600 bg-red-50 p-3 rounded overflow-auto">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
        
        <button
          onClick={resetError}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <span>🔄</span>
          再試行
        </button>
      </div>
    </div>
  )
}

export default ErrorBoundary