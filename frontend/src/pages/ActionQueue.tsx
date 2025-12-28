import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Filter,
  User,
  Plus,
  Download,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { GlassCard } from '@/components/ui/GlassCard'
import { LoadingState } from '@/components/ui/LoadingSpinner'
import { CreateActionModal } from '@/components/actions/CreateActionModal'
import { downloadCSV, actionsToCSV } from '@/lib/export'
import { EvidenceLink } from '@/components/evidence/EvidenceLink'
import type { ActionQueueFull, ActionPriority, ActionStatus } from '@/types/database'

// Apple-style priority colors with glow effects
const priorityColors: Record<ActionPriority, { bg: string; text: string; border: string; glow: string }> = {
  Critical: {
    bg: 'bg-[rgba(var(--color-red),0.15)]',
    text: 'text-[rgb(var(--color-red))]',
    border: 'border-[rgba(var(--color-red),0.3)]',
    glow: 'shadow-[0_0_12px_rgba(var(--color-red),0.2)]',
  },
  High: {
    bg: 'bg-[rgba(var(--color-orange),0.15)]',
    text: 'text-[rgb(var(--color-orange))]',
    border: 'border-[rgba(var(--color-orange),0.3)]',
    glow: 'shadow-[0_0_12px_rgba(var(--color-orange),0.2)]',
  },
  Medium: {
    bg: 'bg-[rgba(var(--color-blue),0.1)]',
    text: 'text-[rgb(var(--color-blue))]',
    border: 'border-[rgba(var(--color-blue),0.2)]',
    glow: '',
  },
  Low: {
    bg: 'bg-[rgba(128,128,128,0.1)]',
    text: 'text-muted-foreground',
    border: 'border-[rgba(128,128,128,0.2)]',
    glow: '',
  },
}

// Apple-style status colors
const statusColors: Record<ActionStatus, string> = {
  Open: 'bg-[rgba(var(--color-blue),0.15)] text-[rgb(var(--color-blue))] border border-[rgba(var(--color-blue),0.2)]',
  'In Progress': 'bg-[rgba(var(--color-orange),0.15)] text-[rgb(var(--color-orange))] border border-[rgba(var(--color-orange),0.2)]',
  Blocked: 'bg-[rgba(var(--color-red),0.15)] text-[rgb(var(--color-red))] border border-[rgba(var(--color-red),0.2)]',
  Completed: 'bg-[rgba(var(--color-green),0.15)] text-[rgb(var(--color-green))] border border-[rgba(var(--color-green),0.2)]',
  Cancelled: 'bg-[rgba(128,128,128,0.1)] text-muted-foreground border border-[rgba(128,128,128,0.2)]',
}

export function ActionQueue() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<'all' | 'my' | ActionPriority>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { data: actions, isLoading } = useQuery({
    queryKey: ['action_queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('action_queue_full')
        .select('*')
      if (error) throw error
      return data as ActionQueueFull[]
    },
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ActionStatus }) => {
      const updateData: { status: ActionStatus; completed_at: string | null } = {
        status,
        completed_at: status === 'Completed' ? new Date().toISOString() : null
      }
      const { error } = await supabase
        .from('action_queue')
        .update(updateData as never)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['action_queue'] })
    },
  })

  if (isLoading) {
    return <LoadingState message="Loading action queue..." />
  }

  // Filter actions
  let filteredActions = actions || []
  if (filter === 'my') {
    // Filter by current user (would need user email from auth)
    filteredActions = filteredActions.filter(a => a.owner_email)
  } else if (filter !== 'all') {
    filteredActions = filteredActions.filter(a => a.priority === filter)
  }

  // Group by priority
  const critical = filteredActions.filter(a => a.priority === 'Critical')
  const high = filteredActions.filter(a => a.priority === 'High')
  const medium = filteredActions.filter(a => a.priority === 'Medium')
  const low = filteredActions.filter(a => a.priority === 'Low')

  const handleExport = () => {
    if (actions) {
      const csv = actionsToCSV(actions)
      downloadCSV(csv, 'action_queue')
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto animate-fade-in">
      {/* Create Action Modal */}
      <CreateActionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Header - Compact like Overview */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Actions</h1>
          <p className="text-muted-foreground text-sm mt-1 flex items-center gap-2">
            <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-[rgba(var(--color-orange),0.1)] border border-[rgba(var(--color-orange),0.2)]">
              <AlertTriangle className="w-3 h-3 text-[rgb(var(--color-orange))]" strokeWidth={2.5} />
              <span className="text-xs font-semibold text-[rgb(var(--color-orange))]">Action Required</span>
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm',
              'bg-[rgb(var(--color-blue))] text-white',
              'hover:brightness-110 active:scale-[0.98]',
              'transition-all duration-300 ease-spring',
              'shadow-[0_4px_16px_rgba(var(--color-blue),0.3)]'
            )}
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            New Action
          </button>
          <button
            onClick={handleExport}
            className={cn(
              'flex items-center gap-2 p-2.5 rounded-xl',
              'glass-card border border-white/20 dark:border-white/10',
              'hover:bg-white/80 dark:hover:bg-white/10',
              'transition-all duration-300'
            )}
            title="Export to CSV"
          >
            <Download className="w-5 h-5 text-muted-foreground" strokeWidth={2} />
          </button>
          <div className="flex items-center gap-2 glass-card rounded-xl px-3 py-2 border border-white/20 dark:border-white/10">
            <Filter className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="bg-transparent text-sm font-medium text-foreground focus:outline-none cursor-pointer"
            >
              <option value="all">All Actions</option>
              <option value="my">My Actions</option>
              <option value="Critical">Critical Only</option>
              <option value="High">High Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Stats - Compact like Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <MiniMetric icon={<AlertTriangle size={16} />} label="Critical" value={critical.length} color="critical" />
        <MiniMetric icon={<Clock size={16} />} label="High" value={high.length} color="risk" />
        <MiniMetric icon={<CheckCircle size={16} />} label="Medium" value={medium.length} color="blue" />
        <MiniMetric icon={<User size={16} />} label="Low" value={low.length} color="muted" />
      </div>

      {/* Action List */}
      <div className="space-y-4 animate-stagger">
        {filteredActions.length === 0 ? (
          <GlassCard className="p-16 text-center" intensity="strong" elevated>
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-[rgba(var(--color-green),0.1)] flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-[rgb(var(--color-green))]" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">All Clear!</h3>
            <p className="text-muted-foreground max-w-md mx-auto text-base">
              No pending action items. Great job staying on top of things.
            </p>
          </GlassCard>
        ) : (
          filteredActions.map((action) => (
            <ActionItem
              key={action.id}
              action={action}
              onStatusChange={(status) =>
                updateStatus.mutate({ id: action.id, status })
              }
              onProjectClick={() =>
                action.project_id && navigate(`/project/${action.project_id}`)
              }
            />
          ))
        )}
      </div>
    </div>
  )
}

// Mini metric card - compact version matching Overview
function MiniMetric({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: 'critical' | 'risk' | 'healthy' | 'blue' | 'muted'
}) {
  const colorMap = {
    critical: {
      bg: 'bg-[rgba(var(--color-red),0.1)]',
      text: 'text-[rgb(var(--color-red))]',
      border: 'border-[rgba(var(--color-red),0.2)]',
    },
    risk: {
      bg: 'bg-[rgba(var(--color-orange),0.1)]',
      text: 'text-[rgb(var(--color-orange))]',
      border: 'border-[rgba(var(--color-orange),0.2)]',
    },
    healthy: {
      bg: 'bg-[rgba(var(--color-green),0.1)]',
      text: 'text-[rgb(var(--color-green))]',
      border: 'border-[rgba(var(--color-green),0.2)]',
    },
    blue: {
      bg: 'bg-[rgba(var(--color-blue),0.1)]',
      text: 'text-[rgb(var(--color-blue))]',
      border: 'border-[rgba(var(--color-blue),0.2)]',
    },
    muted: {
      bg: 'bg-muted/50',
      text: 'text-muted-foreground',
      border: 'border-border',
    },
  }

  const styles = colorMap[color]

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 p-3 rounded-xl border backdrop-blur-sm transition-all',
        styles.bg,
        styles.border
      )}
    >
      <div className={cn('p-1.5 rounded-lg', styles.bg)}>
        <div className={styles.text}>{icon}</div>
      </div>
      <div className="flex flex-col items-start">
        <span className={cn('text-xl font-bold tabular-nums leading-none', styles.text)}>{value}</span>
        <span className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">{label}</span>
      </div>
    </div>
  )
}

function ActionItem({
  action,
  onStatusChange,
  onProjectClick,
}: {
  action: ActionQueueFull
  onStatusChange: (status: ActionStatus) => void
  onProjectClick: () => void
}) {
  const isOverdue =
    action.due_date && new Date(action.due_date) < new Date() && action.status !== 'Completed'
  const priority = priorityColors[action.priority]

  // Priority accent classes
  const priorityAccent = {
    Critical: 'border-accent-critical',
    High: 'border-accent-warning',
    Medium: 'border-accent-neutral',
    Low: '',
  }

  return (
    <GlassCard
      className={cn(
        'p-6 action-card group',
        isOverdue && 'border-[rgba(var(--color-red),0.3)] card-critical',
        !isOverdue && priorityAccent[action.priority]
      )}
      elevated
      intensity="strong"
      interactive
    >
      <div className="flex items-start gap-5">
        {/* Priority Badge - Apple pill style */}
        <span
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-semibold border',
            priority.bg,
            priority.text,
            priority.border,
            priority.glow
          )}
        >
          {action.priority}
        </span>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-base tracking-tight">
            {action.title}
          </h3>

          {action.description && (
            <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
              {action.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
            {/* Project Link */}
            {action.project_name && (
              <button
                onClick={onProjectClick}
                className="text-[rgb(var(--color-blue))] hover:underline flex items-center gap-1.5 font-medium"
              >
                {action.project_name}
              </button>
            )}

            {/* Owner */}
            {action.owner && (
              <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                <User className="w-3.5 h-3.5" strokeWidth={2} />
                {action.owner}
              </span>
            )}

            {/* Due Date */}
            {action.due_date && (
              <span
                className={cn(
                  'flex items-center gap-1.5 font-medium',
                  isOverdue ? 'text-[rgb(var(--color-red))]' : 'text-muted-foreground'
                )}
              >
                <Clock className="w-3.5 h-3.5" strokeWidth={2} />
                {isOverdue && <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2} />}
                Due: {new Date(action.due_date).toLocaleDateString()}
              </span>
            )}

            {/* Evidence Link */}
            {action.evidence_link && (
              <EvidenceLink
                link={action.evidence_link}
                source={action.source_type || undefined}
              />
            )}
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center gap-3">
          <span className={cn('px-2.5 py-1.5 rounded-lg text-xs font-semibold', statusColors[action.status])}>
            {action.status}
          </span>

          {action.status !== 'Completed' && (
            <button
              onClick={() => onStatusChange('Completed')}
              className={cn(
                'p-2.5 rounded-xl transition-all duration-300',
                'text-[rgb(var(--color-green))]',
                'hover:bg-[rgba(var(--color-green),0.1)]',
                'hover:shadow-[0_0_12px_rgba(var(--color-green),0.2)]',
                'active:scale-95'
              )}
              title="Mark Complete"
            >
              <CheckCircle className="w-5 h-5" strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
    </GlassCard>
  )
}
