import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeMap = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-3',
  xl: 'h-14 w-14 border-4',
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full',
        'border-primary-600 dark:border-primary-400',
        'border-t-transparent',
        sizeMap[size],
        className
      )}
    />
  )
}

interface LoadingStateProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingState({ message = 'Loading...', size = 'lg' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 animate-fade-in">
      <div className="relative">
        <LoadingSpinner size={size === 'sm' ? 'md' : size === 'md' ? 'lg' : 'xl'} />
        {/* Glow effect */}
        <div className={cn(
          'absolute inset-0 rounded-full',
          'bg-primary-500/20 dark:bg-primary-400/20',
          'blur-xl -z-10'
        )} />
      </div>
      <p className="text-muted-foreground text-sm font-medium">{message}</p>
    </div>
  )
}

// Skeleton loader for content placeholders
interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg',
        'bg-muted/50 dark:bg-muted/30',
        className
      )}
    />
  )
}
