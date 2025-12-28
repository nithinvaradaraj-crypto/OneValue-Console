import { cn } from '@/lib/utils'
import type { HealthStatus } from '@/types/database'

interface HealthBadgeProps {
  health: HealthStatus | null | undefined
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showDot?: boolean
  pulse?: boolean
}

const healthConfig = {
  Healthy: {
    pill: 'status-healthy',
    dotColor: 'bg-[rgb(var(--color-green))]',
    textColor: 'text-[rgb(var(--color-green))]',
  },
  'At Risk': {
    pill: 'status-at-risk',
    dotColor: 'bg-[rgb(var(--color-orange))]',
    textColor: 'text-[rgb(var(--color-orange))]',
  },
  Critical: {
    pill: 'status-critical status-critical-pulse',
    dotColor: 'bg-[rgb(var(--color-red))]',
    textColor: 'text-[rgb(var(--color-red))]',
  },
  Unknown: {
    pill: 'bg-gray-500/15 border border-gray-500/30 text-gray-500',
    dotColor: 'bg-gray-500',
    textColor: 'text-gray-500',
  },
}

const sizeConfig = {
  xs: {
    badge: 'px-1.5 py-0.5 text-[10px] gap-1',
    dot: 'w-1 h-1',
  },
  sm: {
    badge: 'px-2.5 py-1 text-xs gap-1.5',
    dot: 'w-1.5 h-1.5',
  },
  md: {
    badge: 'px-3 py-1.5 text-sm gap-2',
    dot: 'w-2 h-2',
  },
  lg: {
    badge: 'px-4 py-2 text-base gap-2.5',
    dot: 'w-2.5 h-2.5',
  },
}

export function HealthBadge({
  health,
  size = 'md',
  showDot = true,
  pulse = true
}: HealthBadgeProps) {
  // Handle null/undefined health
  const safeHealth = health || 'Unknown'
  const config = healthConfig[safeHealth]
  const sizeStyles = sizeConfig[size]

  return (
    <span
      className={cn(
        // Base pill styles
        'status-pill inline-flex items-center rounded-full font-semibold',
        'tracking-tight',

        // Status-specific styling
        config.pill,

        // Remove pulse animation if not wanted
        !pulse && safeHealth === 'Critical' && '!animation-none',

        // Size
        sizeStyles.badge
      )}
    >
      {showDot && (
        <span
          className={cn(
            'rounded-full flex-shrink-0',
            config.dotColor,
            sizeStyles.dot,
            // Pulse animation for critical dot
            safeHealth === 'Critical' && pulse && 'status-dot-pulse'
          )}
        />
      )}
      <span className="font-semibold">{safeHealth}</span>
    </span>
  )
}

// Compact variant for tight spaces
export function HealthDot({
  health,
  size = 'md',
  pulse = true
}: {
  health: HealthStatus
  size?: 'sm' | 'md' | 'lg'
  pulse?: boolean
}) {
  const config = healthConfig[health]
  const sizeMap = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  }

  return (
    <span
      className={cn(
        'rounded-full inline-block',
        config.dotColor,
        sizeMap[size],
        health === 'Critical' && pulse && 'status-dot-pulse',
        // Glow effect
        health === 'Critical' && 'shadow-[0_0_8px_rgba(var(--color-red),0.5)]',
        health === 'At Risk' && 'shadow-[0_0_8px_rgba(var(--color-orange),0.5)]',
        health === 'Healthy' && 'shadow-[0_0_8px_rgba(var(--color-green),0.5)]'
      )}
      title={health}
    />
  )
}
