import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  X,
  Check,
  ChevronRight,
  Filter,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { GlassCard } from '@/components/ui/GlassCard'
import { EvidenceLink } from '@/components/evidence/EvidenceLink'
import { cn } from '@/lib/utils'
import type { AlertSummary, AlertSeverity } from '@/types/database'

const severityConfig: Record<AlertSeverity, {
  icon: React.ReactNode
  color: string
  bgColor: string
}> = {
  Critical: {
    icon: <AlertTriangle className="w-5 h-5" />,
    color: 'text-health-critical',
    bgColor: 'bg-health-critical/10',
  },
  High: {
    icon: <AlertCircle className="w-5 h-5" />,
    color: 'text-health-risk',
    bgColor: 'bg-health-risk/10',
  },
  Medium: {
    icon: <AlertCircle className="w-5 h-5" />,
    color: 'text-primary-600',
    bgColor: 'bg-primary-100',
  },
  Low: {
    icon: <Info className="w-5 h-5" />,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
}

interface AlertCenterProps {
  compact?: boolean
  maxItems?: number
  className?: string
}

export function AlertCenter({ compact = false, maxItems = 10, className }: AlertCenterProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<'all' | 'unread' | AlertSeverity>('all')

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alert_notifications')
        .select(`
          *,
          sow_contracts:project_id(project_name, client_name),
          alert_rules:alert_rule_id(name, rule_type)
        `)
        .order('triggered_at', { ascending: false })
        .limit(50)

      if (error) throw error

      return (data || []).map((alert: Record<string, unknown>) => ({
        ...alert,
        project_name: (alert.sow_contracts as { project_name: string } | null)?.project_name || null,
        client_name: (alert.sow_contracts as { client_name: string } | null)?.client_name || null,
        rule_name: (alert.alert_rules as { name: string } | null)?.name || null,
        rule_type: (alert.alert_rules as { rule_type: string } | null)?.rule_type || null,
      })) as AlertSummary[]
    },
  })

  const markAsRead = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('alert_notifications')
        .update({ status: 'read', read_at: new Date().toISOString() } as never)
        .eq('id', alertId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })

  const dismissAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('alert_notifications')
        .update({ status: 'dismissed', dismissed_at: new Date().toISOString() } as never)
        .eq('id', alertId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })

  const unreadCount = alerts.filter(a => a.status === 'unread').length

  const filteredAlerts = alerts
    .filter((a: AlertSummary) => {
      if (filter === 'all') return a.status !== 'dismissed'
      if (filter === 'unread') return a.status === 'unread'
      return a.severity === filter && a.status !== 'dismissed'
    })
    .slice(0, maxItems)

  if (compact) {
    return (
      <AlertBadge count={unreadCount} onClick={() => navigate('/alerts')} />
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary-100 dark:bg-primary-900/30">
            <Bell className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground">
                {unreadCount} unread alert{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm"
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
          </select>
        </div>
      </div>

      {/* Alert List */}
      <div className="space-y-2">
        {isLoading ? (
          <GlassCard className="p-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4" />
          </GlassCard>
        ) : filteredAlerts.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No alerts to display</p>
          </GlassCard>
        ) : (
          filteredAlerts.map((alert) => (
            <AlertItem
              key={alert.id}
              alert={alert}
              onMarkRead={() => markAsRead.mutate(alert.id)}
              onDismiss={() => dismissAlert.mutate(alert.id)}
              onNavigate={() => alert.project_id && navigate(`/project/${alert.project_id}`)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function AlertItem({
  alert,
  onMarkRead,
  onDismiss,
  onNavigate,
}: {
  alert: AlertSummary
  onMarkRead: () => void
  onDismiss: () => void
  onNavigate: () => void
}) {
  const config = severityConfig[alert.severity]
  const isUnread = alert.status === 'unread'

  return (
    <GlassCard
      className={cn(
        'p-4 transition-all',
        isUnread && 'border-l-4',
        isUnread && alert.severity === 'Critical' && 'border-l-health-critical',
        isUnread && alert.severity === 'High' && 'border-l-health-risk',
        isUnread && alert.severity === 'Medium' && 'border-l-primary-500',
        isUnread && alert.severity === 'Low' && 'border-l-muted-foreground'
      )}
      elevated={isUnread}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn('p-2 rounded-lg', config.bgColor, config.color)}>
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={cn(
              'font-medium text-foreground',
              isUnread && 'font-semibold'
            )}>
              {alert.title}
            </h3>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(alert.triggered_at), { addSuffix: true })}
            </span>
          </div>

          <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>

          <div className="flex items-center gap-3 mt-2">
            {alert.project_name && (
              <button
                onClick={onNavigate}
                className="text-sm text-primary-600 hover:underline flex items-center gap-1"
              >
                {alert.project_name}
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
            {(alert.metadata as { evidence_link?: string })?.evidence_link && (
              <EvidenceLink
                link={(alert.metadata as { evidence_link: string }).evidence_link}
                source={(alert.metadata as { source?: string })?.source}
              />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {isUnread && (
            <button
              onClick={onMarkRead}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Mark as read"
            >
              <Check className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onDismiss}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </GlassCard>
  )
}

export function AlertBadge({
  count,
  onClick,
}: {
  count: number
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-lg hover:bg-muted transition-colors"
    >
      <Bell className="w-5 h-5 text-muted-foreground" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-health-critical text-white text-xs font-medium flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  )
}
