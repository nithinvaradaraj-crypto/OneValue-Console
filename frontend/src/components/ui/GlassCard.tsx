import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface GlassCardProps {
  children: ReactNode
  className?: string
  intensity?: 'subtle' | 'medium' | 'strong'
  elevated?: boolean
  interactive?: boolean
  variant?: 'default' | 'critical' | 'warning' | 'success'
  onClick?: () => void
}

export function GlassCard({
  children,
  className,
  intensity = 'medium',
  elevated = false,
  interactive = false,
  variant = 'default',
  onClick,
}: GlassCardProps) {
  const isClickable = onClick || interactive

  return (
    <div
      onClick={onClick}
      className={cn(
        // Base styles - Apple glass morphism with enhanced rounded corners
        'relative border transition-all duration-300',
        elevated ? 'rounded-3xl' : 'rounded-2xl',

        // Glass effect based on intensity with enhanced blur
        intensity === 'subtle' && [
          'bg-white/60 dark:bg-white/[0.06]',
          'backdrop-blur-lg',
          'border-white/20 dark:border-white/[0.08]',
        ],
        intensity === 'medium' && [
          'bg-white/80 dark:bg-white/[0.08]',
          'backdrop-blur-xl',
          'border-white/30 dark:border-white/[0.12]',
        ],
        intensity === 'strong' && [
          'bg-white/90 dark:bg-white/[0.1]',
          'backdrop-blur-2xl saturate-[1.8]',
          'border-white/40 dark:border-white/[0.15]',
        ],

        // Variant-specific backgrounds
        variant === 'critical' && 'card-critical',
        variant === 'warning' && 'card-at-risk',
        variant === 'success' && 'card-healthy',

        // Enhanced shadow with depth layers (Apple signature)
        elevated ? [
          '[box-shadow:0_12px_40px_rgba(0,0,0,0.1),0_4px_12px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.6),inset_0_-1px_0_rgba(0,0,0,0.02)]',
          'dark:[box-shadow:0_12px_40px_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-1px_0_rgba(0,0,0,0.1)]',
        ] : [
          '[box-shadow:0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.4)]',
          'dark:[box-shadow:0_2px_8px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.06)]',
        ],

        // Interactive states with Apple spring animation and 3D effect
        isClickable && [
          'cursor-pointer',
          'card-interactive',
          'hover:border-primary-500/30 dark:hover:border-primary-400/20',
          'hover:[box-shadow:0_20px_60px_rgba(0,0,0,0.12),0_8px_24px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.7)]',
          'dark:hover:[box-shadow:0_20px_60px_rgba(0,0,0,0.6),0_8px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15)]',
          'active:scale-[0.98]',
          'active:transition-transform active:duration-100',
        ],

        className
      )}
    >
      {/* Enhanced gradient overlay on hover */}
      {isClickable && (
        <div
          className={cn(
            'absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none',
            'bg-gradient-to-br from-white/15 via-white/5 to-transparent',
            'group-hover:opacity-100',
            elevated ? 'rounded-3xl' : 'rounded-2xl'
          )}
        />
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
