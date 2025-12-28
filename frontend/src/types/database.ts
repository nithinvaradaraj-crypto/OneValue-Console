export type HealthStatus = 'Healthy' | 'At Risk' | 'Critical' | 'Unknown'
export type ActionPriority = 'Critical' | 'High' | 'Medium' | 'Low'
export type ActionStatus = 'Open' | 'In Progress' | 'Blocked' | 'Completed' | 'Cancelled'
export type UserRole = 'Admin' | 'PM' | 'Viewer'

export interface SowContract {
  id: string
  project_name: string
  client_name: string | null
  start_date: string
  end_date: string
  scope_anchors: string[]
  renewal_window_start: string | null
  contract_value: number | null
  pdf_link: string | null
  inferred_owner: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface DeliveryIntelligence {
  id: string
  project_id: string | null
  source: string
  event_type: string
  title: string | null
  content_raw: Record<string, unknown>
  sentiment_score: number | null
  extracted_blockers: string[]
  extracted_objectives: string[]
  extracted_owners: string[]
  extracted_action_items: Array<{action: string; owner: string; priority: string}>
  aging_days: number
  evidence_link: string
  ai_processed: boolean
  ai_insights: Record<string, unknown> | null
  created_at: string
}

export interface ProjectHealthMetrics {
  id: string
  project_id: string
  metric_date: string
  overall_health: HealthStatus
  health_score: number | null
  blocker_count: number
  open_action_count: number
  overdue_action_count: number
  sentiment_trend: number | null
  scope_creep_detected: boolean
  scope_creep_details: string | null
  renewal_risk_score: number | null
  last_activity_date: string | null
  ai_summary: string | null
  created_at: string
}

export interface ActionQueue {
  id: string
  project_id: string | null
  delivery_intelligence_id: string | null
  title: string
  description: string | null
  owner: string | null
  owner_email: string | null
  priority: ActionPriority
  status: ActionStatus
  due_date: string | null
  evidence_link: string | null
  source_type: string | null
  aging_days: number
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface UserAllowlist {
  id: string
  email: string
  display_name: string | null
  role: UserRole
  is_active: boolean
  created_at: string
  last_login: string | null
}

export interface PortfolioOverview {
  id: string
  project_name: string
  client_name: string | null
  start_date: string
  end_date: string
  status: string
  inferred_owner: string | null
  contract_value: number | null
  overall_health: HealthStatus | null
  health_score: number | null
  blocker_count: number
  open_action_count: number
  overdue_action_count: number
  renewal_risk_score: number | null
  days_until_renewal: number | null
  last_activity_date: string | null
  scope_creep_detected: boolean
  ai_summary: string | null
  days_remaining: number
}

export interface ActionQueueFull extends ActionQueue {
  project_name: string | null
  client_name: string | null
  project_owner: string | null
}

export interface HealthHistory {
  id: string
  project_id: string
  snapshot_date: string
  overall_health: HealthStatus
  health_score: number | null
  sentiment_score: number | null
  blocker_count: number
  action_count: number
  message_count: number
  ai_summary: string | null
  created_at: string
}

export type AlertSeverity = 'Critical' | 'High' | 'Medium' | 'Low'
export type AlertStatus = 'unread' | 'read' | 'dismissed' | 'actioned'
export type AlertRuleType = 'health_change' | 'blocker_threshold' | 'sentiment_drop' | 'overdue_actions' | 'no_activity' | 'renewal_approaching'

export interface AlertRule {
  id: string
  name: string
  description: string | null
  rule_type: AlertRuleType
  condition_config: Record<string, unknown>
  severity: AlertSeverity
  is_active: boolean
  notify_email: boolean
  notify_in_app: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface AlertNotification {
  id: string
  alert_rule_id: string | null
  project_id: string | null
  title: string
  message: string
  severity: AlertSeverity
  status: AlertStatus
  metadata: Record<string, unknown>
  triggered_at: string
  read_at: string | null
  dismissed_at: string | null
  dismissed_by: string | null
}

export interface AlertSummary extends AlertNotification {
  project_name: string | null
  client_name: string | null
  rule_name: string | null
  rule_type: AlertRuleType | null
}

export interface Database {
  public: {
    Tables: {
      sow_contracts: {
        Row: SowContract
        Insert: Omit<SowContract, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<SowContract, 'id'>>
      }
      delivery_intelligence: {
        Row: DeliveryIntelligence
        Insert: Omit<DeliveryIntelligence, 'id' | 'aging_days' | 'created_at'>
        Update: Partial<Omit<DeliveryIntelligence, 'id' | 'aging_days'>>
      }
      project_health_metrics: {
        Row: ProjectHealthMetrics
        Insert: Omit<ProjectHealthMetrics, 'id' | 'created_at'>
        Update: Partial<Omit<ProjectHealthMetrics, 'id'>>
      }
      action_queue: {
        Row: ActionQueue
        Insert: Omit<ActionQueue, 'id' | 'aging_days' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ActionQueue, 'id' | 'aging_days'>>
      }
      user_allowlist: {
        Row: UserAllowlist
        Insert: Omit<UserAllowlist, 'id' | 'created_at' | 'last_login'> & { last_login?: string | null }
        Update: Partial<Omit<UserAllowlist, 'id'>>
      }
    }
    Views: {
      portfolio_overview: {
        Row: PortfolioOverview
      }
      action_queue_full: {
        Row: ActionQueueFull
      }
    }
  }
}
