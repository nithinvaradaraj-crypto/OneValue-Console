import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Settings,
  ToggleLeft,
  ToggleRight,
  Download,
  Trash2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { GlassCard } from '@/components/ui/GlassCard'
import { AlertCenter } from '@/components/alerts/AlertCenter'
import { downloadCSV, alertsToCSV } from '@/lib/export'
import { cn } from '@/lib/utils'
import type { AlertRule, AlertSummary } from '@/types/database'

export function Alerts() {
  const queryClient = useQueryClient()
  const [showSettings, setShowSettings] = useState(false)

  const { data: alerts = [] } = useQuery({
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
        .limit(100)

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

  const { data: rules = [] } = useQuery({
    queryKey: ['alert_rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alert_rules')
        .select('*')
        .order('severity')
      if (error) throw error
      return data as AlertRule[]
    },
    enabled: showSettings,
  })

  const toggleRule = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('alert_rules')
        .update({ is_active } as never)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert_rules'] })
    },
  })

  const clearAllAlerts = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('alert_notifications')
        .update({ status: 'dismissed' } as never)
        .neq('status', 'dismissed')
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })

  const handleExport = () => {
    const csv = alertsToCSV(alerts)
    downloadCSV(csv, 'alerts')
  }

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Alerts</h1>
          <p className="text-muted-foreground text-sm mt-1">System notifications and critical updates</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border hover:bg-muted transition-colors"
            title="Export alerts"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Export</span>
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors',
              showSettings
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                : 'border-border hover:bg-muted'
            )}
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm">Settings</span>
          </button>
          {alerts.filter(a => a.status !== 'dismissed').length > 0 && (
            <button
              onClick={() => clearAllAlerts.mutate()}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-health-critical/30 text-health-critical hover:bg-health-critical/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm">Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <GlassCard className="p-5 mb-6" intensity="strong">
          <h2 className="text-lg font-semibold text-foreground mb-4">Alert Rules</h2>
          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
              >
                <div>
                  <p className="font-medium text-foreground">{rule.name}</p>
                  <p className="text-sm text-muted-foreground">{rule.description}</p>
                  <span
                    className={cn(
                      'inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium',
                      rule.severity === 'Critical' && 'bg-health-critical/20 text-health-critical',
                      rule.severity === 'High' && 'bg-health-risk/20 text-health-risk',
                      rule.severity === 'Medium' && 'bg-primary-100 text-primary-700',
                      rule.severity === 'Low' && 'bg-gray-100 text-gray-600'
                    )}
                  >
                    {rule.severity}
                  </span>
                </div>
                <button
                  onClick={() => toggleRule.mutate({ id: rule.id, is_active: !rule.is_active })}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {rule.is_active ? (
                    <ToggleRight className="w-8 h-8 text-health-healthy" />
                  ) : (
                    <ToggleLeft className="w-8 h-8" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Alert List */}
      <AlertCenter maxItems={50} />
    </div>
  )
}
