import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  User,
  FileText,
  AlertTriangle,
  ExternalLink,
  Target,
  Clock,
  MessageSquare,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  Download,
  BarChart3,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { GlassCard } from '@/components/ui/GlassCard'
import { HealthBadge } from '@/components/ui/HealthBadge'
import { LoadingState, Skeleton } from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { HealthTrendChart } from '@/components/charts/HealthTrendChart'
import { SOWDocumentPanel } from '@/components/sow/SOWDocumentPanel'
import { CreateActionModal } from '@/components/actions/CreateActionModal'
import { generateProjectReport, downloadCSV, messagesToCSV } from '@/lib/export'
import { EvidenceLink } from '@/components/evidence/EvidenceLink'
import type { SowContract, DeliveryIntelligence, ActionQueue, HealthStatus, ProjectHealthMetrics, HealthHistory, PortfolioOverview, ActionQueueFull } from '@/types/database'

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showAllMessages, setShowAllMessages] = useState(false)
  const [showCreateAction, setShowCreateAction] = useState(false)

  // Fetch SOW details
  const { data: sow, isLoading: sowLoading } = useQuery({
    queryKey: ['sow', id],
    queryFn: async () => {
      if (!id) throw new Error('No project ID')
      const { data, error } = await supabase
        .from('sow_contracts')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as SowContract
    },
    enabled: !!id,
  })

  // Fetch health metrics
  const { data: health } = useQuery({
    queryKey: ['health', id],
    queryFn: async () => {
      if (!id) return null
      const { data, error } = await supabase
        .from('project_health_metrics')
        .select('*')
        .eq('project_id', id)
        .order('metric_date', { ascending: false })
        .limit(1)
        .single()
      if (error) return null
      return data as ProjectHealthMetrics | null
    },
    enabled: !!id,
  })

  // Fetch delivery intelligence (messages)
  const { data: intelligence, isLoading: messagesLoading } = useQuery({
    queryKey: ['intelligence', id],
    queryFn: async () => {
      if (!id) return []
      const { data, error } = await supabase
        .from('delivery_intelligence')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) return []
      return data as DeliveryIntelligence[]
    },
    enabled: !!id,
  })

  // Fetch actions
  const { data: actions } = useQuery({
    queryKey: ['actions', id],
    queryFn: async () => {
      if (!id) return []
      const { data, error } = await supabase
        .from('action_queue')
        .select('*')
        .eq('project_id', id)
        .not('status', 'in', '("Completed","Cancelled")')
        .order('priority')
      if (error) return []
      return data as ActionQueue[]
    },
    enabled: !!id,
  })

  // Fetch health history for trend chart
  const { data: healthHistory } = useQuery({
    queryKey: ['health_history', id],
    queryFn: async () => {
      if (!id) return []
      const { data, error } = await supabase
        .from('health_history')
        .select('*')
        .eq('project_id', id)
        .order('snapshot_date', { ascending: true })
        .limit(30)
      if (error) return []
      return data as HealthHistory[]
    },
    enabled: !!id,
  })

  if (sowLoading) {
    return <LoadingState message="Loading project..." />
  }

  if (!sow) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <GlassCard className="p-8 text-center" intensity="strong">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-error/10 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-error" />
          </div>
          <p className="text-error font-medium mb-4">Project not found</p>
          <Button onClick={() => navigate('/')} variant="outline">
            Back to Dashboard
          </Button>
        </GlassCard>
      </div>
    )
  }

  const daysRemaining = Math.ceil(
    (new Date(sow.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  // Get AI-processed messages with insights
  const messagesWithInsights = intelligence?.filter(m => m.ai_processed && m.ai_insights) || []
  const displayMessages = showAllMessages ? intelligence : intelligence?.slice(0, 10)

  // Extract aggregated insights
  const allBlockers = intelligence?.flatMap(m => m.extracted_blockers || []).filter(Boolean) || []
  const avgSentiment = intelligence?.length
    ? intelligence.reduce((sum, m) => sum + (m.sentiment_score || 0.5), 0) / intelligence.length
    : 0.5

  // Export handlers
  const handleExportPDF = () => {
    if (sow) {
      const portfolioData: PortfolioOverview = {
        id: sow.id,
        project_name: sow.project_name,
        client_name: sow.client_name,
        start_date: sow.start_date,
        end_date: sow.end_date,
        status: sow.status,
        inferred_owner: sow.inferred_owner,
        contract_value: sow.contract_value,
        overall_health: (health?.overall_health || 'Unknown') as HealthStatus,
        health_score: health?.health_score || null,
        blocker_count: health?.blocker_count || 0,
        open_action_count: health?.open_action_count || 0,
        overdue_action_count: health?.overdue_action_count || 0,
        renewal_risk_score: health?.renewal_risk_score || null,
        days_until_renewal: null,
        last_activity_date: health?.last_activity_date || null,
        scope_creep_detected: health?.scope_creep_detected || false,
        ai_summary: health?.ai_summary || null,
        days_remaining: daysRemaining,
      }
      const actionsData: ActionQueueFull[] = (actions || []).map(a => ({
        ...a,
        project_name: sow.project_name,
        client_name: sow.client_name,
        project_owner: sow.inferred_owner,
      }))
      generateProjectReport(portfolioData, intelligence || [], actionsData)
    }
  }

  const handleExportCSV = () => {
    if (intelligence) {
      const csv = messagesToCSV(intelligence)
      downloadCSV(csv, `${sow?.project_name || 'project'}_messages`)
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto animate-fade-in">
      {/* Create Action Modal */}
      <CreateActionModal
        isOpen={showCreateAction}
        onClose={() => setShowCreateAction(false)}
        projectId={id}
      />

      {/* Back Button - Apple style */}
      <Button
        variant="ghost"
        onClick={() => navigate('/')}
        className={cn(
          'mb-8 -ml-2 group',
          'text-[rgb(var(--color-blue))] hover:text-[rgb(var(--color-blue))]',
          'hover:bg-[rgba(var(--color-blue),0.1)]',
          'transition-all duration-300'
        )}
      >
        <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" strokeWidth={2.5} />
        Back to Portfolio
      </Button>

      {/* Header - Apple Typography */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="page-title text-foreground">{sow.project_name}</h1>
          {sow.client_name && (
            <p className="text-lg text-muted-foreground mt-2 font-medium tracking-tight">{sow.client_name}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              title="Export PDF Report"
            >
              <Download className="w-4 h-4 mr-1" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              title="Export Messages CSV"
            >
              <Download className="w-4 h-4 mr-1" />
              CSV
            </Button>
          </div>
          <HealthBadge health={(health?.overall_health || 'Unknown') as HealthStatus} size="lg" />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Days Remaining"
          value={daysRemaining > 0 ? daysRemaining : 0}
          subtext={daysRemaining <= 0 ? 'Expired' : daysRemaining <= 30 ? 'Ending soon' : undefined}
          alert={daysRemaining <= 30}
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Blockers"
          value={health?.blocker_count || allBlockers.length}
          alert={(health?.blocker_count || 0) > 0}
        />
        <StatCard
          icon={<MessageSquare className="w-5 h-5" />}
          label="Messages"
          value={intelligence?.length || 0}
          subtext={`${messagesWithInsights.length} analyzed`}
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Sentiment"
          value={`${Math.round(avgSentiment * 100)}%`}
          subtext={avgSentiment >= 0.6 ? 'Positive' : avgSentiment >= 0.4 ? 'Neutral' : 'Negative'}
          alert={avgSentiment < 0.4}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Insights Panel */}
          {(health?.ai_summary || allBlockers.length > 0) && (
            <GlassCard className="p-6" intensity="strong" elevated>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-primary-500/10">
                  <Sparkles className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">AI Insights</h2>
              </div>

              {health?.ai_summary && (
                <p className="text-muted-foreground mb-4">{health.ai_summary}</p>
              )}

              {allBlockers.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-foreground">Identified Blockers</h3>
                  <div className="flex flex-wrap gap-2">
                    {[...new Set(allBlockers)].slice(0, 5).map((blocker, i) => (
                      <Badge key={i} variant="critical" className="text-xs">
                        {String(blocker)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>
          )}

          {/* Contract Details */}
          <GlassCard className="p-6" intensity="medium" elevated>
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              Contract Details
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem
                icon={<Calendar className="w-4 h-4" />}
                label="Start Date"
                value={new Date(sow.start_date).toLocaleDateString()}
              />
              <InfoItem
                icon={<Calendar className="w-4 h-4" />}
                label="End Date"
                value={new Date(sow.end_date).toLocaleDateString()}
              />
              {sow.contract_value && (
                <InfoItem
                  icon={<DollarSign className="w-4 h-4" />}
                  label="Contract Value"
                  value={`$${sow.contract_value.toLocaleString()}`}
                />
              )}
              {sow.inferred_owner && (
                <InfoItem
                  icon={<User className="w-4 h-4" />}
                  label="Owner"
                  value={sow.inferred_owner}
                />
              )}
            </div>
            {sow.pdf_link && (
              <a
                href={sow.pdf_link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline text-sm"
              >
                <FileText className="w-4 h-4" />
                View SOW Document
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </GlassCard>

          {/* Scope Anchors */}
          {sow.scope_anchors && sow.scope_anchors.length > 0 && (
            <GlassCard className="p-6" intensity="medium" elevated>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                Scope Anchors
              </h2>
              <ul className="space-y-3">
                {sow.scope_anchors.map((anchor, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-foreground">{anchor}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          )}

          {/* Message Timeline */}
          <GlassCard className="p-6" intensity="medium" elevated>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                Message Timeline
              </h2>
              {intelligence && intelligence.length > 10 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllMessages(!showAllMessages)}
                >
                  {showAllMessages ? (
                    <>Show Less <ChevronUp className="w-4 h-4 ml-1" /></>
                  ) : (
                    <>Show All ({intelligence.length}) <ChevronDown className="w-4 h-4 ml-1" /></>
                  )}
                </Button>
              )}
            </div>

            {messagesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : displayMessages && displayMessages.length > 0 ? (
              <div className="space-y-4">
                {displayMessages.map((item) => (
                  <MessageCard key={item.id} message={item} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No messages yet</p>
            )}
          </GlassCard>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Health Trend Chart */}
          {healthHistory && healthHistory.length > 0 && (
            <GlassCard className="p-6" intensity="strong" elevated>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                Health Trend
              </h2>
              <HealthTrendChart data={healthHistory} height={180} showBlockers />
            </GlassCard>
          )}

          {/* SOW Document Panel */}
          <SOWDocumentPanel project={sow} />

          {/* Health Summary */}
          {health && (
            <GlassCard className="p-6" intensity="strong" elevated>
              <h2 className="text-lg font-semibold text-foreground mb-4">Health Summary</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Blockers</p>
                    <p className="text-2xl font-bold text-health-critical">
                      {health.blocker_count || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Open Actions</p>
                    <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {health.open_action_count || actions?.length || 0}
                    </p>
                  </div>
                </div>

                {health.scope_creep_detected && (
                  <div className="p-3 rounded-xl bg-health-risk/10 border border-health-risk/20">
                    <div className="flex items-center gap-2 text-health-risk font-medium mb-1">
                      <AlertTriangle className="w-4 h-4" />
                      Scope Creep Detected
                    </div>
                    {health.scope_creep_details && (
                      <p className="text-sm text-muted-foreground">{health.scope_creep_details}</p>
                    )}
                  </div>
                )}
              </div>
            </GlassCard>
          )}

          {/* Action Items */}
          <GlassCard className="p-6" intensity="medium" elevated>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                Open Actions
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateAction(true)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {actions && actions.length > 0 ? (
              <div className="space-y-3">
                {actions.slice(0, 5).map((action) => (
                  <ActionCard key={action.id} action={action} />
                ))}
                {actions.length > 5 && (
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => navigate('/actions')}
                  >
                    View All ({actions.length})
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-2">No open actions</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateAction(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Create Action
                </Button>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

// Apple-style Stat Card with glow effects
function StatCard({
  icon,
  label,
  value,
  subtext,
  alert = false,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  subtext?: string
  alert?: boolean
}) {
  return (
    <GlassCard className="p-5 metric-card card-3d-hover group" intensity="strong" elevated>
      <div className="flex items-start gap-4">
        {/* Icon with enhanced glow */}
        <div className="relative">
          {alert && <div className="icon-glow icon-glow-critical group-hover:scale-110 transition-transform duration-300" />}
          {!alert && <div className="icon-glow icon-glow-blue group-hover:scale-110 transition-transform duration-300" />}
          <div className={cn(
            'p-3 rounded-2xl relative z-10 transition-transform duration-300 group-hover:scale-105',
            alert
              ? 'bg-[rgba(var(--color-red),0.1)]'
              : 'bg-[rgba(var(--color-blue),0.1)]'
          )}>
            <div className={cn(
              'w-5 h-5',
              alert
                ? 'text-[rgb(var(--color-red))]'
                : 'text-[rgb(var(--color-blue))]'
            )}>
              {icon}
            </div>
          </div>
        </div>

        {/* Metric content */}
        <div className="flex-1">
          <p className={cn(
            'text-2xl font-bold tracking-tight',
            alert ? 'text-[rgb(var(--color-red))]' : 'text-foreground'
          )}>
            {value}
          </p>
          <p className="text-xs text-muted-foreground font-medium mt-0.5 tracking-wide">{label}</p>
          {subtext && (
            <p className={cn(
              'text-xs mt-1 font-medium',
              alert ? 'text-[rgb(var(--color-red))]' : 'text-muted-foreground'
            )}>
              {subtext}
            </p>
          )}
        </div>
      </div>
    </GlassCard>
  )
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}

function MessageCard({ message }: { message: DeliveryIntelligence }) {
  const insights = message.ai_insights as { summary?: string; sentiment?: string; key_topics?: string[] } | null
  const sentiment = message.sentiment_score || 0.5

  // Determine border accent color based on sentiment
  const borderAccentClass = sentiment >= 0.6
    ? 'border-accent-healthy'
    : sentiment >= 0.4
      ? 'border-accent-neutral'
      : 'border-accent-critical'

  return (
    <div className={cn(
      'p-5 rounded-2xl border-y border-r transition-all duration-300',
      'glass-card',
      'border-white/20 dark:border-white/10',
      'hover:border-[rgba(var(--color-blue),0.3)]',
      'hover:shadow-[0_4px_20px_rgba(var(--color-blue),0.1)]',
      'hover:-translate-y-0.5',
      message.ai_processed && borderAccentClass
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs font-medium">
            {message.event_type || 'Message'}
          </Badge>
          {message.ai_processed && (
            <Badge variant="default" className="text-xs bg-[rgba(var(--color-blue),0.1)] text-[rgb(var(--color-blue))] border-0 font-medium">
              <Sparkles className="w-3 h-3 mr-1" />
              AI Analyzed
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          {new Date(message.created_at).toLocaleDateString()}
        </span>
      </div>

      {message.title && (
        <p className="font-semibold text-foreground mb-2 tracking-tight">{message.title}</p>
      )}

      {insights?.summary && (
        <p className="text-sm text-muted-foreground leading-relaxed">{insights.summary}</p>
      )}

      {/* Sentiment indicator - Apple style */}
      {message.ai_processed && (
        <div className="mt-4 pt-4 border-t border-[rgba(var(--separator),0.3)] flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-2.5 h-2.5 rounded-full',
              sentiment >= 0.6
                ? 'bg-[rgb(var(--color-green))] shadow-[0_0_8px_rgba(var(--color-green),0.5)]'
                : sentiment >= 0.4
                  ? 'bg-[rgb(var(--color-orange))] shadow-[0_0_8px_rgba(var(--color-orange),0.5)]'
                  : 'bg-[rgb(var(--color-red))] shadow-[0_0_8px_rgba(var(--color-red),0.5)]'
            )} />
            <span className="text-muted-foreground font-medium">
              {sentiment >= 0.6 ? 'Positive' : sentiment >= 0.4 ? 'Neutral' : 'Negative'}
            </span>
          </div>
          {insights?.key_topics && insights.key_topics.length > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground font-medium">
              Topics: {insights.key_topics.slice(0, 2).join(', ')}
            </div>
          )}
        </div>
      )}

      {message.evidence_link && (
        <div className="mt-3">
          <EvidenceLink
            link={message.evidence_link}
            source={message.source || 'chat'}
          />
        </div>
      )}
    </div>
  )
}

function ActionCard({ action }: { action: ActionQueue }) {
  const priorityStyles = {
    Critical: {
      bg: 'bg-[rgba(var(--color-red),0.15)]',
      text: 'text-[rgb(var(--color-red))]',
      border: 'border-[rgba(var(--color-red),0.3)]',
      accent: 'border-accent-critical',
    },
    High: {
      bg: 'bg-[rgba(var(--color-orange),0.15)]',
      text: 'text-[rgb(var(--color-orange))]',
      border: 'border-[rgba(var(--color-orange),0.3)]',
      accent: 'border-accent-warning',
    },
    Medium: {
      bg: 'bg-[rgba(var(--color-blue),0.1)]',
      text: 'text-[rgb(var(--color-blue))]',
      border: 'border-[rgba(var(--color-blue),0.2)]',
      accent: 'border-accent-neutral',
    },
    Low: {
      bg: 'bg-muted/50',
      text: 'text-muted-foreground',
      border: 'border-muted/50',
      accent: '',
    },
  }

  const style = priorityStyles[action.priority] || priorityStyles.Low

  return (
    <div className={cn(
      'p-4 rounded-2xl transition-all duration-300',
      'glass-card',
      'border-y border-r border-white/20 dark:border-white/10',
      'hover:border-[rgba(var(--color-blue),0.3)]',
      'hover:shadow-[0_4px_16px_rgba(var(--color-blue),0.1)]',
      'hover:-translate-y-0.5',
      style.accent
    )}>
      <div className="flex items-center justify-between mb-2">
        <span
          className={cn(
            'px-2.5 py-1 rounded-full text-xs font-semibold border',
            style.bg,
            style.text,
            style.border
          )}
        >
          {action.priority}
        </span>
        <div className="flex items-center gap-2">
          {action.owner && (
            <span className="text-xs text-muted-foreground font-medium">{action.owner}</span>
          )}
          {action.evidence_link && (
            <EvidenceLink
              link={action.evidence_link}
              source={action.source_type || undefined}
              variant="icon"
            />
          )}
        </div>
      </div>
      <p className="text-sm font-semibold text-foreground tracking-tight">{action.title}</p>
    </div>
  )
}
