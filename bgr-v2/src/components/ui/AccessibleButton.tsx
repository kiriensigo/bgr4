interface AccessibleButtonProps {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  ariaLabel?: string
  ariaDescribedBy?: string
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

export function AccessibleButton({
  children,
  onClick,
  disabled = false,
  loading = false,
  ariaLabel,
  ariaDescribedBy,
  type = 'button',
  variant = 'primary',
  size = 'md'
}: AccessibleButtonProps) {
  const baseClasses = 'font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      className={classes}
    >
      {loading && (
        <span className="sr-only">読み込み中...</span>
      )}
      {children}
    </button>
  )
}