interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
}

export function LoadingSpinner({
  size = 'md',
  className = '',
  label = '読み込み中',
}: LoadingSpinnerProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 ${className}`}
      role="status"
      aria-label={label}
    >
      <div
        className={`animate-spin rounded-full border-gray-300 border-t-blue-600 ${sizeClasses[size]}`}
      />
      <span className="sr-only">{label}</span>
    </div>
  )
}

export function LoadingOverlay({ label = '読み込み中...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <LoadingSpinner size="lg" />
      <span className="ml-3 text-gray-500">{label}</span>
    </div>
  )
}
