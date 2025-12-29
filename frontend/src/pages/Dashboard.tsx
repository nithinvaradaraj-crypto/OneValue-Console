import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Calendar,
  Activity,
  MessageSquare,
  FileText
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { GlassCard } from '@/components/ui/GlassCard'
import { HealthBadge } from '@/components/ui/HealthBadge'
import { IntrusiveAlert } from '@/components/ui/IntrusiveAlert'
import { LoadingState } from '@/components/ui/LoadingSpinner'
import {
  DrillDownPanel,
  DrillDownType,
  ProjectItem,
  ActionItem,
  CommItem,
  DrillDownEmpty
} from '@/components/ui/DrillDownPanel'
import type { PortfolioOverview } from '@/types/database'

// Storage key for tracking alert dismissal
const CRITICAL_ALERT_DISMISSED_KEY = 'onevalue_critical_alert_dismissed'
const ALERT_SHOW_WINDOW_MINUTES = 30 // Only show alert for activity within this window

export function Dashboard() {
  const navigate = useNavigate()
  const [alertDismissed, setAlertDismissed] = useState(false)
  const [activeDrillDown, setActiveDrillDown] = useState<DrillDownType>(null)

  // Check if alert was previously dismissed
  useEffect(() => {
    const dismissedData = localStorage.getItem(CRITICAL_ALERT_DISMISSED_KEY)
    if (dismissedData) {
      setAlertDismissed(true)
    }
  }, [])

  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('portfolio_overview')
        .select('*')
        .order('overall_health', { ascending: true })

      if (error) throw error
      return data as PortfolioOverview[]
    },
  })

  // Fetch MOM space project IDs to filter pending analysis
  const { data: momSpaces } = useQuery({
    queryKey: ['mom-spaces'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_spaces')
        .select('project_id, space_name')
        .ilike('space_name', '%mom%')

      if (error) throw error
      return data as { project_id: string; space_name: string }[]
    },
  })

  // Fetch blocker actions for drill-down (Critical priority + Blocked status = blockers)
  const { data: blockerActions } = useQuery({
    queryKey: ['blocker-actions'],
    queryFn: async () => {
      // Get actions that are either Critical priority OR have Blocked status
      const { data, error } = await supabase
        .from('action_queue_full')
        .select('*')
        .or('priority.eq.Critical,status.eq.Blocked')
        .order('priority', { ascending: true })

      if (error) throw error
      return data || []
    },
    enabled: activeDrillDown === 'blockers',
  })

  // Fetch today's communications for drill-down (always fetch for count)
  const { data: todayComms } = useQuery({
    queryKey: ['today-comms'],
    queryFn: async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from('delivery_intelligence')
        .select('id, source, title, body, created_at, sentiment_score, project_id')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data || []
    },
  })

  const momProjectIds = new Set(momSpaces?.map(s => s.project_id) || [])

  // Compute filtered arrays (these don't use hooks, just derived data)
  const critical = projects?.filter(p => p.overall_health === 'Critical') || []
  const atRisk = projects?.filter(p => p.overall_health === 'At Risk') || []
  const healthy = projects?.filter(p => p.overall_health === 'Healthy') || []
  const unknown = projects?.filter(p =>
    (p.overall_health === 'Unknown' || !p.overall_health) &&
    momProjectIds.has(p.id)
  ) || []

  const totalBlockers = projects?.reduce((sum, p) => sum + (p.blocker_count || 0), 0) || 0
  const totalOverdue = projects?.reduce((sum, p) => sum + (p.overdue_action_count || 0), 0) || 0
  const totalProjects = projects?.length || 0
  const totalContractValue = projects?.reduce((sum, p) => sum + (p.contract_value || 0), 0) || 0
  const avgHealthScore = projects?.length
    ? Math.round(projects.reduce((sum, p) => sum + (p.health_score || 50), 0) / projects.length)
    : 0
  const upcomingRenewals = projects?.filter(p => p.days_remaining > 0 && p.days_remaining <= 90).length || 0
  const avgSentiment = '0.00' // Sentiment trend not available in portfolio_overview view

  // Check if any critical project has recent activity (within 30 mins)
  const hasRecentCriticalActivity = useMemo(() => {
    if (critical.length === 0) return false

    const now = Date.now()
    const windowMs = ALERT_SHOW_WINDOW_MINUTES * 60 * 1000

    return critical.some(p => {
      if (!p.last_activity_date) return false
      const activityTime = new Date(p.last_activity_date).getTime()
      return (now - activityTime) <= windowMs
    })
  }, [critical])

  // Reset dismissal if there's new activity after the dismissal timestamp
  useEffect(() => {
    if (!alertDismissed || critical.length === 0) return

    const dismissedData = localStorage.getItem(CRITICAL_ALERT_DISMISSED_KEY)
    if (!dismissedData) return

    try {
      const { timestamp: dismissedAt } = JSON.parse(dismissedData)
      const hasNewActivity = critical.some(p => {
        if (!p.last_activity_date) return false
        return new Date(p.last_activity_date).getTime() > dismissedAt
      })
      if (hasNewActivity) {
        setAlertDismissed(false)
      }
    } catch {
      // Invalid localStorage data, ignore
    }
  }, [critical, alertDismissed])

  // Handle alert dismissal
  const handleAlertDismiss = () => {
    setAlertDismissed(true)
    localStorage.setItem(CRITICAL_ALERT_DISMISSED_KEY, JSON.stringify({
      timestamp: Date.now(),
      criticalCount: critical.length
    }))
  }

  // Show alert only if: has critical projects, recent activity, and not dismissed
  const showCriticalAlert = critical.length > 0 && hasRecentCriticalActivity && !alertDismissed

  // Early returns AFTER all hooks
  if (isLoading) {
    return <LoadingState message="Loading portfolio..." />
  }

  if (error) {
    return (
      <div className="p-6">
        <GlassCard className="p-6 text-center">
          <p className="text-[rgb(var(--color-red))]">Failed to load portfolio data</p>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto animate-fade-in">
      {/* Critical Alert - Only shows for recent activity (within 30 mins) */}
      {showCriticalAlert && (
        <IntrusiveAlert
          title="Critical Projects Require Attention"
          message={`${critical.length} project(s) in critical state with recent activity. Immediate action required.`}
          severity="critical"
          onDismiss={handleAlertDismiss}
          actionButton={{
            label: 'View Critical Projects',
            onClick: () => navigate(`/project/${critical[0].id}`),
          }}
        />
      )}

      {/* Compact Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Portfolio Overview</h1>
          <p className="text-muted-foreground text-sm mt-1 flex items-center gap-2">
            <span>{totalProjects} active projects</span>
            <span className="text-muted-foreground/50">•</span>
            <span className="inline-flex items-center gap-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[rgb(var(--color-green))] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[rgb(var(--color-green))]"></span>
              </span>
              <span className="text-xs text-[rgb(var(--color-green))]">Live</span>
            </span>
          </p>
        </div>
        {/* Quick Stats Bar */}
        <div className="hidden md:flex items-center gap-4 text-sm">
          <QuickStat label="Portfolio Value" value={`$${(totalContractValue / 1000000).toFixed(1)}M`} />
          <QuickStat label="Avg Health" value={`${avgHealthScore}%`} trend={avgHealthScore >= 70 ? 'up' : 'down'} />
          <QuickStat label="Sentiment" value={avgSentiment} trend={parseFloat(avgSentiment) >= 0 ? 'up' : 'down'} />
        </div>
      </div>

      {/* Compact Metrics Grid - 2 rows of 4 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
        <MiniMetric icon={<AlertTriangle size={16} />} label="Critical" value={critical.length} color="critical" onClick={() => setActiveDrillDown('critical')} />
        <MiniMetric icon={<Clock size={16} />} label="At Risk" value={atRisk.length} color="risk" onClick={() => setActiveDrillDown('atRisk')} />
        <MiniMetric icon={<CheckCircle size={16} />} label="Healthy" value={healthy.length} color="healthy" onClick={() => setActiveDrillDown('healthy')} />
        <MiniMetric icon={<Activity size={16} />} label="Blockers" value={totalBlockers} color="critical" onClick={() => setActiveDrillDown('blockers')} />
        <MiniMetric icon={<Clock size={16} />} label="Overdue" value={totalOverdue} color="risk" onClick={() => navigate('/actions')} />
        <MiniMetric icon={<Calendar size={16} />} label="Renewals (90d)" value={upcomingRenewals} color="blue" onClick={() => navigate('/renewals')} />
        <MiniMetric icon={<FileText size={16} />} label="Pending Analysis" value={unknown.length} color="muted" onClick={() => setActiveDrillDown('pendingAnalysis')} />
        <MiniMetric icon={<MessageSquare size={16} />} label="Comms Today" value={todayComms?.length || 0} color="healthy" onClick={() => setActiveDrillDown('commsToday')} />
      </div>

      {/* Overdue Actions Banner - More compact */}
      {totalOverdue > 0 && (
        <div className={cn(
          'rounded-xl p-3 mb-5 flex items-center justify-between',
          'bg-gradient-to-r from-[rgba(var(--color-orange),0.08)] to-transparent',
          'border border-[rgba(var(--color-orange),0.2)]',
          'backdrop-blur-sm'
        )}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[rgba(var(--color-orange),0.15)]">
              <Clock className="w-4 h-4 text-[rgb(var(--color-orange))]" />
            </div>
            <span className="font-medium text-[rgb(var(--color-orange))] text-sm">
              {totalOverdue} overdue action items
            </span>
          </div>
          <button
            onClick={() => navigate('/actions')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[rgba(var(--color-orange),0.15)] border border-[rgba(var(--color-orange),0.25)] text-[rgb(var(--color-orange))] hover:bg-[rgba(var(--color-orange),0.25)] transition-all"
          >
            View All
          </button>
        </div>
      )}

      {/* Project Grid - All in one compact view */}
      <div className="space-y-6">
        {/* Critical Projects */}
        {critical.length > 0 && (
          <ProjectSection
            title="Critical"
            projects={critical}
            onProjectClick={(id) => navigate(`/project/${id}`)}
            variant="critical"
            isFirst={true}
          />
        )}

        {/* At Risk Projects */}
        {atRisk.length > 0 && (
          <ProjectSection
            title="At Risk"
            projects={atRisk}
            onProjectClick={(id) => navigate(`/project/${id}`)}
            variant="warning"
            isFirst={critical.length === 0}
          />
        )}

        {/* Healthy Projects */}
        {healthy.length > 0 && (
          <ProjectSection
            title="Healthy"
            projects={healthy}
            onProjectClick={(id) => navigate(`/project/${id}`)}
            variant="success"
            isFirst={critical.length === 0 && atRisk.length === 0}
          />
        )}

        {/* Unknown Projects */}
        {unknown.length > 0 && (
          <ProjectSection
            title="Pending Analysis"
            projects={unknown}
            onProjectClick={(id) => navigate(`/project/${id}`)}
            isFirst={critical.length === 0 && atRisk.length === 0 && healthy.length === 0}
          />
        )}
      </div>

      {/* Empty State */}
      {projects?.length === 0 && (
        <GlassCard className="p-10 text-center" intensity="strong" elevated>
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[rgba(var(--color-blue),0.1)] flex items-center justify-center">
            <Activity className="w-7 h-7 text-[rgb(var(--color-blue))]" strokeWidth={1.5} />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No Projects Yet</h3>
          <p className="text-muted-foreground max-w-sm mx-auto text-sm">
            Projects will appear here once SOWs are ingested and analyzed.
          </p>
        </GlassCard>
      )}

      {/* Drill-Down Panels */}
      {/* Critical Projects Panel */}
      <DrillDownPanel
        isOpen={activeDrillDown === 'critical'}
        onClose={() => setActiveDrillDown(null)}
        type="critical"
        title="Critical Projects"
        subtitle={`${critical.length} project${critical.length !== 1 ? 's' : ''} requiring immediate attention`}
      >
        {critical.length === 0 ? (
          <DrillDownEmpty message="No critical projects" />
        ) : (
          critical.map((project) => (
            <ProjectItem
              key={project.id}
              name={project.project_name}
              client={project.client_name}
              health={project.overall_health}
              blockers={project.blocker_count}
              overdue={project.overdue_action_count}
              value={project.contract_value}
              onClick={() => {
                setActiveDrillDown(null)
                navigate(`/project/${project.id}`)
              }}
            />
          ))
        )}
      </DrillDownPanel>

      {/* At Risk Projects Panel */}
      <DrillDownPanel
        isOpen={activeDrillDown === 'atRisk'}
        onClose={() => setActiveDrillDown(null)}
        type="atRisk"
        title="At Risk Projects"
        subtitle={`${atRisk.length} project${atRisk.length !== 1 ? 's' : ''} need monitoring`}
      >
        {atRisk.length === 0 ? (
          <DrillDownEmpty message="No at-risk projects" />
        ) : (
          atRisk.map((project) => (
            <ProjectItem
              key={project.id}
              name={project.project_name}
              client={project.client_name}
              health={project.overall_health}
              blockers={project.blocker_count}
              overdue={project.overdue_action_count}
              value={project.contract_value}
              onClick={() => {
                setActiveDrillDown(null)
                navigate(`/project/${project.id}`)
              }}
            />
          ))
        )}
      </DrillDownPanel>

      {/* Healthy Projects Panel */}
      <DrillDownPanel
        isOpen={activeDrillDown === 'healthy'}
        onClose={() => setActiveDrillDown(null)}
        type="healthy"
        title="Healthy Projects"
        subtitle={`${healthy.length} project${healthy.length !== 1 ? 's' : ''} on track`}
      >
        {healthy.length === 0 ? (
          <DrillDownEmpty message="No healthy projects" />
        ) : (
          healthy.map((project) => (
            <ProjectItem
              key={project.id}
              name={project.project_name}
              client={project.client_name}
              health={project.overall_health}
              blockers={project.blocker_count}
              overdue={project.overdue_action_count}
              value={project.contract_value}
              onClick={() => {
                setActiveDrillDown(null)
                navigate(`/project/${project.id}`)
              }}
            />
          ))
        )}
      </DrillDownPanel>

      {/* Blockers Panel */}
      <DrillDownPanel
        isOpen={activeDrillDown === 'blockers'}
        onClose={() => setActiveDrillDown(null)}
        type="blockers"
        title="Critical & Blocked Items"
        subtitle={`${blockerActions?.length || 0} high-priority item${(blockerActions?.length || 0) !== 1 ? 's' : ''} requiring attention`}
      >
        {!blockerActions || blockerActions.length === 0 ? (
          <DrillDownEmpty message="No critical or blocked items" />
        ) : (
          blockerActions.map((action: any) => (
            <ActionItem
              key={action.id}
              title={action.title}
              projectName={action.project_name || 'Unknown Project'}
              status={action.status}
              priority={action.priority}
              dueDate={action.due_date ? new Date(action.due_date).toLocaleDateString() : undefined}
              isBlocker={action.priority === 'Critical' || action.status === 'Blocked'}
              onClick={() => {
                setActiveDrillDown(null)
                navigate('/actions')
              }}
            />
          ))
        )}
      </DrillDownPanel>

      {/* Pending Analysis Panel */}
      <DrillDownPanel
        isOpen={activeDrillDown === 'pendingAnalysis'}
        onClose={() => setActiveDrillDown(null)}
        type="pendingAnalysis"
        title="Pending Analysis"
        subtitle={`${unknown.length} project${unknown.length !== 1 ? 's' : ''} awaiting AI analysis`}
      >
        {unknown.length === 0 ? (
          <DrillDownEmpty message="No projects pending analysis" />
        ) : (
          unknown.map((project) => (
            <ProjectItem
              key={project.id}
              name={project.project_name}
              client={project.client_name}
              health={project.overall_health || 'Unknown'}
              value={project.contract_value}
              onClick={() => {
                setActiveDrillDown(null)
                navigate(`/project/${project.id}`)
              }}
            />
          ))
        )}
      </DrillDownPanel>

      {/* Communications Today Panel */}
      <DrillDownPanel
        isOpen={activeDrillDown === 'commsToday'}
        onClose={() => setActiveDrillDown(null)}
        type="commsToday"
        title="Today's Communications"
        subtitle={`${todayComms?.length || 0} message${(todayComms?.length || 0) !== 1 ? 's' : ''} received today`}
      >
        {!todayComms || todayComms.length === 0 ? (
          <DrillDownEmpty message="No communications today" />
        ) : (
          todayComms.map((comm: any) => {
            const project = projects?.find(p => p.id === comm.project_id)
            return (
              <CommItem
                key={comm.id}
                source={comm.source}
                title={comm.title || 'Untitled'}
                snippet={comm.body?.substring(0, 150) || ''}
                timestamp={new Date(comm.created_at).toLocaleTimeString()}
                sentiment={comm.sentiment_score}
                projectName={project?.project_name}
                onClick={() => {
                  if (comm.project_id) {
                    setActiveDrillDown(null)
                    navigate(`/project/${comm.project_id}`)
                  }
                }}
              />
            )
          })
        )}
      </DrillDownPanel>
    </div>
  )
}

// Quick stat for header
function QuickStat({ label, value, trend }: { label: string; value: string; trend?: 'up' | 'down' }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
      {trend && (
        trend === 'up'
          ? <TrendingUp size={12} className="text-[rgb(var(--color-green))]" />
          : <TrendingDown size={12} className="text-[rgb(var(--color-red))]" />
      )}
    </div>
  )
}

// Mini metric card - compact version
function MiniMetric({
  icon,
  label,
  value,
  color,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: 'critical' | 'risk' | 'healthy' | 'blue' | 'muted'
  onClick?: () => void
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
  const Component = onClick ? 'button' : 'div'

  return (
    <Component
      onClick={onClick}
      className={cn(
        'flex items-center gap-2.5 p-3 rounded-xl border backdrop-blur-sm transition-all',
        styles.bg,
        styles.border,
        onClick && 'cursor-pointer hover:scale-[1.02] hover:shadow-md'
      )}
    >
      <div className={cn('p-1.5 rounded-lg', styles.bg)}>
        <div className={styles.text}>{icon}</div>
      </div>
      <div className="flex flex-col items-start">
        <span className={cn('text-xl font-bold tabular-nums leading-none', styles.text)}>{value}</span>
        <span className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">{label}</span>
      </div>
    </Component>
  )
}

function ProjectSection({
  title,
  projects,
  onProjectClick,
  variant,
  isFirst = false,
}: {
  title: string
  projects: PortfolioOverview[]
  onProjectClick: (id: string) => void
  variant?: 'critical' | 'warning' | 'success'
  isFirst?: boolean
}) {
  const colorMap = {
    critical: 'text-[rgb(var(--color-red))]',
    warning: 'text-[rgb(var(--color-orange))]',
    success: 'text-[rgb(var(--color-green))]',
  }
  const countBgMap = {
    critical: 'bg-[rgba(var(--color-red),0.15)]',
    warning: 'bg-[rgba(var(--color-orange),0.15)]',
    success: 'bg-[rgba(var(--color-green),0.15)]',
  }

  return (
    <div>
      <div className={cn(
        'flex items-center gap-2 mb-3',
        !isFirst && 'pt-4 border-t border-border/50'
      )}>
        <h2 className={cn('text-sm font-semibold uppercase tracking-wider', variant ? colorMap[variant] : 'text-muted-foreground')}>
          {title}
        </h2>
        <span className={cn(
          'px-2 py-0.5 rounded-full text-xs font-semibold',
          variant ? countBgMap[variant] : 'bg-muted',
          variant ? colorMap[variant] : 'text-muted-foreground'
        )}>
          {projects.length}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onClick={() => onProjectClick(project.id)}
            variant={variant}
          />
        ))}
      </div>
    </div>
  )
}

function ProjectCard({
  project,
  onClick,
  variant,
}: {
  project: PortfolioOverview
  onClick: () => void
  variant?: 'critical' | 'warning' | 'success'
}) {
  const healthScore = project.health_score || 50
  const contractValue = project.contract_value || 0

  return (
    <GlassCard
      className="p-4 group cursor-pointer hover:scale-[1.02] transition-all duration-200"
      elevated
      onClick={onClick}
      variant={variant}
    >
      {/* Header - Compact */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-sm truncate leading-tight">
            {project.project_name}
          </h3>
          {project.client_name && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {project.client_name}
            </p>
          )}
        </div>
        <HealthBadge health={project.overall_health} size="xs" />
      </div>

      {/* Mini Stats Row */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="text-center p-1.5 rounded-lg bg-secondary/30">
          <div className="text-sm font-bold text-foreground tabular-nums">{healthScore}%</div>
          <div className="text-[9px] text-muted-foreground uppercase">Health</div>
        </div>
        <div className="text-center p-1.5 rounded-lg bg-secondary/30">
          <div className="text-sm font-bold text-foreground tabular-nums">
            {contractValue > 0 ? `$${(contractValue / 1000).toFixed(0)}k` : '-'}
          </div>
          <div className="text-[9px] text-muted-foreground uppercase">Value</div>
        </div>
      </div>

      {/* Compact Metrics */}
      <div className="flex flex-wrap gap-2 text-xs mb-3">
        {project.blocker_count > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[rgba(var(--color-red),0.1)] text-[rgb(var(--color-red))]">
            <AlertTriangle size={10} />
            {project.blocker_count} blocker{project.blocker_count !== 1 ? 's' : ''}
          </span>
        )}
        {project.overdue_action_count > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[rgba(var(--color-orange),0.1)] text-[rgb(var(--color-orange))]">
            <Clock size={10} />
            {project.overdue_action_count} overdue
          </span>
        )}
        {project.renewal_risk_score && project.renewal_risk_score > 0.5 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[rgba(var(--color-orange),0.1)] text-[rgb(var(--color-orange))]">
            <TrendingUp size={10} />
            {Math.round(project.renewal_risk_score * 100)}% risk
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border/30">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Calendar size={10} />
          <span>
            {project.days_remaining > 0
              ? `${project.days_remaining}d left`
              : 'Expired'}
          </span>
        </div>
        <ChevronRight size={14} className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
      </div>
    </GlassCard>
  )
}
