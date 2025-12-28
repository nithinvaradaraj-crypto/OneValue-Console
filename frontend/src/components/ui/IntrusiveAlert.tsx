import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './button'

interface IntrusiveAlertProps {
  title: string
  message: string
  severity: 'critical' | 'warning' | 'info'
  onDismiss?: () => void
  actionButton?: {
    label: string
    onClick: () => void
  }
}

const severityConfig = {
  critical: {
    bg: 'bg-gradient-to-r from-red-500 to-red-600',
    border: 'border-red-400/50',
    icon: AlertCircle,
    iconBg: 'bg-red-600/50',
  },
  warning: {
    bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
    border: 'border-amber-400/50',
    icon: AlertTriangle,
    iconBg: 'bg-amber-600/50',
  },
  info: {
    bg: 'bg-gradient-to-r from-primary-500 to-primary-600',
    border: 'border-primary-400/50',
    icon: Info,
    iconBg: 'bg-primary-600/50',
  },
}

export function IntrusiveAlert({
  title,
  message,
  severity,
  onDismiss,
  actionButton,
}: IntrusiveAlertProps) {
  const [isVisible, setIsVisible] = useState(true)
  const config = severityConfig[severity]
  const Icon = config.icon

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  if (!isVisible) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4 animate-slide-down">
      <div
        className={cn(
          'rounded-2xl border p-5',
          'backdrop-blur-xl shadow-2xl',
          config.bg,
          config.border
        )}
      >
        <div className="flex items-start gap-4">
          <div className={cn('p-2 rounded-xl', config.iconBg)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
            <p className="text-white/90 text-sm leading-relaxed">{message}</p>
            {actionButton && (
              <Button
                onClick={actionButton.onClick}
                variant="glass"
                size="sm"
                className="mt-4 bg-white/20 hover:bg-white/30 text-white border-white/20"
              >
                {actionButton.label}
              </Button>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className={cn(
              'p-1.5 rounded-lg text-white/70 hover:text-white',
              'hover:bg-white/10 transition-all duration-200'
            )}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
