import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { GlassCard } from '@/components/ui/GlassCard'
import { cn } from '@/lib/utils'
import type { HealthHistory } from '@/types/database'

interface HealthTrendChartProps {
  data: HealthHistory[]
  height?: number
  showBlockers?: boolean
  showSentiment?: boolean
  className?: string
}

const healthToScore: Record<string, number> = {
  'Healthy': 100,
  'At Risk': 60,
  'Critical': 20,
  'Unknown': 50,
}

const healthColors = {
  healthy: '#10B981',
  risk: '#F59E0B',
  critical: '#EF4444',
}

export function HealthTrendChart({
  data,
  height = 200,
  showBlockers = true,
  showSentiment = false,
  className,
}: HealthTrendChartProps) {
  const chartData = useMemo(() => {
    return data
      .map((d) => ({
        date: d.snapshot_date,
        dateFormatted: format(parseISO(d.snapshot_date), 'MMM d'),
        healthScore: d.health_score ?? healthToScore[d.overall_health] ?? 50,
        health: d.overall_health,
        blockers: d.blocker_count,
        sentiment: d.sentiment_score ? Math.round(d.sentiment_score * 100) : null,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [data])

  if (chartData.length === 0) {
    return (
      <GlassCard className={cn('p-6 text-center', className)}>
        <p className="text-muted-foreground">No health history data available</p>
      </GlassCard>
    )
  }

  const getHealthColor = (score: number) => {
    if (score >= 70) return healthColors.healthy
    if (score >= 40) return healthColors.risk
    return healthColors.critical
  }

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean
    payload?: Array<{ name: string; value: number; color: string }>
    label?: string
  }) => {
    if (active && payload && payload.length) {
      const healthScore = payload.find(p => p.name === 'healthScore')?.value || 0
      const blockers = payload.find(p => p.name === 'blockers')?.value
      const sentiment = payload.find(p => p.name === 'sentiment')?.value

      return (
        <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getHealthColor(healthScore) }}
              />
              <span className="text-muted-foreground">Health:</span>
              <span className="font-medium">{healthScore}%</span>
            </div>
            {blockers !== undefined && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-health-critical" />
                <span className="text-muted-foreground">Blockers:</span>
                <span className="font-medium">{blockers}</span>
              </div>
            )}
            {sentiment !== undefined && sentiment !== null && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary-500" />
                <span className="text-muted-foreground">Sentiment:</span>
                <span className="font-medium">{sentiment}%</span>
              </div>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="blockerGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
          <XAxis
            dataKey="dateFormatted"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="healthScore"
            name="healthScore"
            stroke="#10B981"
            strokeWidth={2}
            fill="url(#healthGradient)"
          />
          {showBlockers && (
            <Line
              type="monotone"
              dataKey="blockers"
              name="blockers"
              stroke="#EF4444"
              strokeWidth={2}
              dot={{ fill: '#EF4444', strokeWidth: 0, r: 4 }}
              yAxisId={0}
            />
          )}
          {showSentiment && (
            <Line
              type="monotone"
              dataKey="sentiment"
              name="sentiment"
              stroke="#0066CC"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#0066CC', strokeWidth: 0, r: 3 }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// Mini sparkline version for dashboard cards
export function HealthSparkline({
  data,
  width = 80,
  height = 30,
}: {
  data: HealthHistory[]
  width?: number
  height?: number
}) {
  const chartData = useMemo(() => {
    return data
      .map((d) => ({
        date: d.snapshot_date,
        value: d.health_score ?? healthToScore[d.overall_health] ?? 50,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7) // Last 7 days
  }, [data])

  if (chartData.length < 2) return null

  const trend = chartData[chartData.length - 1].value - chartData[0].value
  const color = trend >= 0 ? '#10B981' : '#EF4444'

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
