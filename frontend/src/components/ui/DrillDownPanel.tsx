import { useEffect, useRef } from 'react'
import { X, AlertTriangle, Clock, CheckCircle, Activity, FileText, MessageSquare, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GlassCard } from './GlassCard'
import { HealthBadge } from './HealthBadge'
import type { HealthStatus } from '@/types/database'

export type DrillDownType =
  | 'critical'
  | 'atRisk'
  | 'healthy'
  | 'blockers'
  | 'pendingAnalysis'
  | 'commsToday'
  | null

interface DrillDownPanelProps {
  isOpen: boolean
  onClose: () => void
  type: DrillDownType
  title: string
  subtitle?: string
  children: React.ReactNode
}

export function DrillDownPanel({ isOpen, onClose, type, title, subtitle, children }: DrillDownPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    if (isOpen) {
      setTimeout(() => document.addEventListener('mousedown', handleClickOutside), 100)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  const iconMap = {
    critical: <AlertTriangle className="w-5 h-5 text-[rgb(var(--color-red))]" />,
    atRisk: <Clock className="w-5 h-5 text-[rgb(var(--color-orange))]" />,
    healthy: <CheckCircle className="w-5 h-5 text-[rgb(var(--color-green))]" />,
    blockers: <Activity className="w-5 h-5 text-[rgb(var(--color-red))]" />,
    pendingAnalysis: <FileText className="w-5 h-5 text-muted-foreground" />,
    commsToday: <MessageSquare className="w-5 h-5 text-[rgb(var(--color-blue))]" />,
  }

  const colorMap = {
    critical: 'border-l-[rgb(var(--color-red))]',
    atRisk: 'border-l-[rgb(var(--color-orange))]',
    healthy: 'border-l-[rgb(var(--color-green))]',
    blockers: 'border-l-[rgb(var(--color-red))]',
    pendingAnalysis: 'border-l-muted-foreground',
    commsToday: 'border-l-[rgb(var(--color-blue))]',
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" />

      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          'relative w-full max-w-lg h-full bg-background/95 backdrop-blur-xl shadow-2xl',
          'border-l-4 animate-slide-in-right',
          type && colorMap[type]
        )}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {type && iconMap[type]}
              <div>
                <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                {subtitle && (
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto h-[calc(100%-80px)]">
          {children}
        </div>
      </div>
    </div>
  )
}

// Reusable item components for drill-down lists

interface ProjectItemProps {
  name: string
  client?: string | null
  health: HealthStatus | string | null
  blockers?: number | null
  overdue?: number | null
  value?: number | null
  onClick?: () => void
}

export function ProjectItem({ name, client, health, blockers, overdue, value, onClick }: ProjectItemProps) {
  // Normalize health to a valid HealthStatus
  const normalizedHealth: HealthStatus =
    health === 'Healthy' || health === 'At Risk' || health === 'Critical' || health === 'Unknown'
      ? health
      : 'Unknown'

  return (
    <GlassCard
      className="p-4 mb-3 cursor-pointer hover:scale-[1.01] transition-all group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground truncate">{name}</h4>
          {client && <p className="text-sm text-muted-foreground truncate">{client}</p>}
        </div>
        <HealthBadge health={normalizedHealth} size="xs" />
      </div>

      <div className="flex items-center gap-3 mt-3 text-xs">
        {blockers != null && blockers > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[rgba(var(--color-red),0.1)] text-[rgb(var(--color-red))]">
            <AlertTriangle size={10} />
            {blockers} blocker{blockers !== 1 ? 's' : ''}
          </span>
        )}
        {overdue != null && overdue > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[rgba(var(--color-orange),0.1)] text-[rgb(var(--color-orange))]">
            <Clock size={10} />
            {overdue} overdue
          </span>
        )}
        {value != null && value > 0 && (
          <span className="text-muted-foreground ml-auto">
            ${(value / 1000).toFixed(0)}k
          </span>
        )}
        <ChevronRight size={14} className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all ml-auto" />
      </div>
    </GlassCard>
  )
}

interface ActionItemProps {
  title: string
  projectName: string
  status: string
  priority?: string
  dueDate?: string
  isBlocker?: boolean
  onClick?: () => void
}

export function ActionItem({ title, projectName, status, priority, dueDate, isBlocker, onClick }: ActionItemProps) {
  const priorityColors = {
    Critical: 'text-[rgb(var(--color-red))] bg-[rgba(var(--color-red),0.1)]',
    High: 'text-[rgb(var(--color-orange))] bg-[rgba(var(--color-orange),0.1)]',
    Medium: 'text-[rgb(var(--color-blue))] bg-[rgba(var(--color-blue),0.1)]',
    Low: 'text-muted-foreground bg-muted',
  }

  return (
    <GlassCard
      className={cn(
        'p-4 mb-3 cursor-pointer hover:scale-[1.01] transition-all',
        isBlocker && 'border-l-2 border-l-[rgb(var(--color-red))]'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground">{title}</h4>
          <p className="text-sm text-muted-foreground truncate">{projectName}</p>
        </div>
        {priority && (
          <span className={cn(
            'px-2 py-0.5 rounded-full text-xs font-medium',
            priorityColors[priority as keyof typeof priorityColors] || priorityColors.Low
          )}>
            {priority}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
        {isBlocker && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[rgba(var(--color-red),0.1)] text-[rgb(var(--color-red))]">
            <AlertTriangle size={10} />
            Blocker
          </span>
        )}
        <span className="px-2 py-0.5 rounded-full bg-secondary">{status}</span>
        {dueDate && (
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {dueDate}
          </span>
        )}
      </div>
    </GlassCard>
  )
}

interface CommItemProps {
  source: string
  title: string
  snippet: string
  timestamp: string
  sentiment?: number
  projectName?: string
  onClick?: () => void
}

export function CommItem({ source, title, snippet, timestamp, sentiment, projectName, onClick }: CommItemProps) {
  const sourceColors = {
    Gmail: 'text-[rgb(var(--color-red))] bg-[rgba(var(--color-red),0.1)]',
    GoogleChat: 'text-[rgb(var(--color-green))] bg-[rgba(var(--color-green),0.1)]',
  }

  const getSentimentColor = (score: number) => {
    if (score >= 0.3) return 'text-[rgb(var(--color-green))]'
    if (score <= -0.3) return 'text-[rgb(var(--color-red))]'
    return 'text-muted-foreground'
  }

  return (
    <GlassCard
      className="p-4 mb-3 cursor-pointer hover:scale-[1.01] transition-all"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn(
              'px-2 py-0.5 rounded-full text-xs font-medium',
              sourceColors[source as keyof typeof sourceColors] || 'bg-secondary text-muted-foreground'
            )}>
              {source}
            </span>
            <span className="text-xs text-muted-foreground">{timestamp}</span>
          </div>
          <h4 className="font-medium text-foreground truncate">{title}</h4>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{snippet}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 text-xs">
        {projectName && (
          <span className="text-muted-foreground truncate">{projectName}</span>
        )}
        {sentiment !== undefined && (
          <span className={cn('font-medium', getSentimentColor(sentiment))}>
            {sentiment >= 0 ? '+' : ''}{sentiment.toFixed(2)}
          </span>
        )}
      </div>
    </GlassCard>
  )
}

// Empty state for drill-down panels
export function DrillDownEmpty({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
        <CheckCircle className="w-6 h-6 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground">{message}</p>
    </div>
  )
}
