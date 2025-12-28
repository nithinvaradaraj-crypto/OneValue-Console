import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Mail,
  MessageSquare,
  RefreshCw,
  ChevronRight,
  Shield,
  AlertCircle
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface RenewalSignal {
  type: 'positive' | 'negative' | 'neutral';
  source: 'email' | 'chat' | 'sow';
  message: string;
  date: string;
  weight: number;
  evidenceLink?: string;
}

interface ContractWithHealth {
  id: string;
  project_name: string;
  client_name: string | null;
  end_date: string;
  renewal_window_start: string | null;
  project_health_metrics: Array<{
    overall_health: string;
    scope_creep_detected: boolean;
    blocker_count: number;
  }> | null;
}

interface MessageData {
  project_id: string;
  sentiment: string;
  created_at: string;
  evidence_link: string | null;
  source: string;
  event_type: string;
}

interface ProjectRenewalData {
  id: string;
  project_name: string;
  client_name: string;
  end_date: string;
  renewal_window_start: string | null;
  days_until_renewal: number;
  renewal_probability: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  signals: RenewalSignal[];
  sentiment_trend: 'improving' | 'declining' | 'stable';
  last_positive_interaction: string | null;
  blocker_count: number;
}

export function RenewalOracle() {
  const [projects, setProjects] = useState<ProjectRenewalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  useEffect(() => {
    fetchRenewalData();
  }, []);

  async function fetchRenewalData() {
    setLoading(true);
    try {
      // Fetch SOW contracts with health metrics
      const { data: contracts, error: contractsError } = await supabase
        .from('sow_contracts')
        .select(`
          id,
          project_name,
          client_name,
          end_date,
          renewal_window_start,
          project_health_metrics (
            overall_health,
            scope_creep_detected,
            blocker_count
          )
        `)
        .not('end_date', 'is', null)
        .order('end_date', { ascending: true });

      if (contractsError) throw contractsError;

      // Fetch recent messages for sentiment analysis
      const { data: messages, error: messagesError } = await supabase
        .from('delivery_intelligence')
        .select('project_id, sentiment, created_at, evidence_link, source, event_type')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      // Process and calculate renewal data
      const typedContracts = (contracts || []) as ContractWithHealth[];
      const typedMessages = (messages || []) as MessageData[];

      const renewalData: ProjectRenewalData[] = typedContracts.map(contract => {
        const projectMessages = typedMessages.filter(m => m.project_id === contract.id);
        const healthMetrics = contract.project_health_metrics?.[0];

        // Calculate days until renewal
        const endDate = new Date(contract.end_date);
        const daysUntilRenewal = differenceInDays(endDate, new Date());

        // Calculate renewal probability based on signals
        const signals = calculateSignals(projectMessages, healthMetrics);
        const renewalProbability = calculateRenewalProbability(signals, daysUntilRenewal);

        // Determine risk level
        const riskLevel = getRiskLevel(renewalProbability, daysUntilRenewal);

        // Calculate sentiment trend
        const sentimentTrend = calculateSentimentTrend(projectMessages);

        // Find last positive interaction
        const lastPositive = projectMessages.find(m => m.sentiment === 'positive');

        return {
          id: contract.id,
          project_name: contract.project_name,
          client_name: contract.client_name || 'Unknown Client',
          end_date: contract.end_date,
          renewal_window_start: contract.renewal_window_start,
          days_until_renewal: daysUntilRenewal,
          renewal_probability: renewalProbability,
          risk_level: riskLevel,
          signals,
          sentiment_trend: sentimentTrend,
          last_positive_interaction: lastPositive?.created_at || null,
          blocker_count: healthMetrics?.blocker_count || 0
        };
      });

      // Sort by risk level (critical first) then by days until renewal
      renewalData.sort((a, b) => {
        const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        if (riskOrder[a.risk_level] !== riskOrder[b.risk_level]) {
          return riskOrder[a.risk_level] - riskOrder[b.risk_level];
        }
        return a.days_until_renewal - b.days_until_renewal;
      });

      setProjects(renewalData);
    } catch (error) {
      console.error('Error fetching renewal data:', error);
    } finally {
      setLoading(false);
    }
  }

  function calculateSignals(
    messages: MessageData[],
    healthMetrics: { overall_health: string; scope_creep_detected: boolean; blocker_count: number } | undefined
  ): RenewalSignal[] {
    const signals: RenewalSignal[] = [];

    // Analyze message sentiment
    const recentMessages = messages.slice(0, 20);
    const positiveCount = recentMessages.filter(m => m.sentiment === 'positive').length;
    const negativeCount = recentMessages.filter(m => m.sentiment === 'negative').length;

    if (positiveCount > negativeCount * 2) {
      signals.push({
        type: 'positive',
        source: 'chat',
        message: 'Strong positive sentiment in recent communications',
        date: new Date().toISOString(),
        weight: 0.3
      });
    } else if (negativeCount > positiveCount) {
      signals.push({
        type: 'negative',
        source: 'chat',
        message: 'Declining sentiment detected in communications',
        date: new Date().toISOString(),
        weight: -0.3
      });
    }

    // Check for blockers
    const blockerCount = healthMetrics?.blocker_count ?? 0;
    if (blockerCount > 0) {
      signals.push({
        type: 'negative',
        source: 'chat',
        message: `${blockerCount} active blocker(s) detected`,
        date: new Date().toISOString(),
        weight: -0.2 * blockerCount
      });
    }

    // Check for scope creep
    if (healthMetrics?.scope_creep_detected) {
      signals.push({
        type: 'negative',
        source: 'sow',
        message: 'Scope creep detected - client expectations may not be met',
        date: new Date().toISOString(),
        weight: -0.25
      });
    }

    // Check health status
    if (healthMetrics?.overall_health === 'Healthy') {
      signals.push({
        type: 'positive',
        source: 'sow',
        message: 'Project health is green',
        date: new Date().toISOString(),
        weight: 0.2
      });
    } else if (healthMetrics?.overall_health === 'Critical') {
      signals.push({
        type: 'negative',
        source: 'sow',
        message: 'Project health is critical',
        date: new Date().toISOString(),
        weight: -0.4
      });
    }

    // Add .edu email signals (simulated based on available data)
    const eduMessages = messages.filter(m =>
      m.source === 'Gmail' || m.event_type === 'Email'
    );
    if (eduMessages.length > 0) {
      const eduPositive = eduMessages.filter(m => m.sentiment === 'positive').length;
      const eduNegative = eduMessages.filter(m => m.sentiment === 'negative').length;

      if (eduPositive > eduNegative) {
        signals.push({
          type: 'positive',
          source: 'email',
          message: 'Positive tone in client emails',
          date: new Date().toISOString(),
          weight: 0.25,
          evidenceLink: eduMessages[0]?.evidence_link || undefined
        });
      } else if (eduNegative > eduPositive) {
        signals.push({
          type: 'negative',
          source: 'email',
          message: 'Concerning tone in client emails',
          date: new Date().toISOString(),
          weight: -0.25,
          evidenceLink: eduMessages[0]?.evidence_link || undefined
        });
      }
    }

    return signals;
  }

  function calculateRenewalProbability(signals: RenewalSignal[], daysUntilRenewal: number): number {
    // Base probability starts at 70%
    let probability = 70;

    // Add signal weights
    signals.forEach(signal => {
      probability += signal.weight * 100;
    });

    // Adjust based on timeline urgency
    if (daysUntilRenewal < 30) {
      probability -= 10; // More uncertainty when deadline is near
    }

    // Clamp between 0 and 100
    return Math.max(0, Math.min(100, Math.round(probability)));
  }

  function getRiskLevel(probability: number, daysUntilRenewal: number): 'low' | 'medium' | 'high' | 'critical' {
    if (daysUntilRenewal < 30 && probability < 50) return 'critical';
    if (daysUntilRenewal < 60 && probability < 60) return 'high';
    if (probability < 70) return 'medium';
    return 'low';
  }

  function calculateSentimentTrend(messages: MessageData[]): 'improving' | 'declining' | 'stable' {
    if (messages.length < 5) return 'stable';

    const recent = messages.slice(0, 5);
    const older = messages.slice(5, 10);

    const recentPositive = recent.filter(m => m.sentiment === 'positive').length;
    const olderPositive = older.filter(m => m.sentiment === 'positive').length;

    if (recentPositive > olderPositive + 1) return 'improving';
    if (recentPositive < olderPositive - 1) return 'declining';
    return 'stable';
  }

  function getRiskBadgeVariant(risk: string) {
    switch (risk) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  }

  function getSignalIcon(source: string) {
    switch (source) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'chat': return <MessageSquare className="h-4 w-4" />;
      case 'sow': return <Shield className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const criticalCount = projects.filter(p => p.risk_level === 'critical').length;
  const highRiskCount = projects.filter(p => p.risk_level === 'high').length;
  const upcomingRenewals = projects.filter(p => p.days_until_renewal <= 90).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalCount}</div>
            <p className="text-xs text-muted-foreground">Immediate attention needed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{highRiskCount}</div>
            <p className="text-xs text-muted-foreground">Monitor closely</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming (90 days)</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingRenewals}</div>
            <p className="text-xs text-muted-foreground">Renewals in pipeline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Probability</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.length > 0
                ? Math.round(projects.reduce((sum, p) => sum + p.renewal_probability, 0) / projects.length)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Across all projects</p>
          </CardContent>
        </Card>
      </div>

      {/* Renewal Risk List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Renewal Risk Assessment
          </CardTitle>
          <CardDescription>
            AI-powered analysis of renewal probability based on communication signals
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No projects with end dates found
            </p>
          ) : (
            <div className="space-y-4">
              {projects.map(project => (
                <div
                  key={project.id}
                  className={`border rounded-lg p-4 transition-all ${
                    selectedProject === project.id
                      ? 'border-primary bg-accent/50'
                      : 'hover:border-muted-foreground/50'
                  }`}
                >
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setSelectedProject(
                      selectedProject === project.id ? null : project.id
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <h4 className="font-semibold">{project.project_name}</h4>
                        <p className="text-sm text-muted-foreground">{project.client_name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Renewal:</span>
                          <span className="font-medium">
                            {project.days_until_renewal > 0
                              ? `${project.days_until_renewal} days`
                              : 'Overdue'}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(project.end_date), 'MMM d, yyyy')}
                        </div>
                      </div>

                      <div className="w-24">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{project.renewal_probability}%</span>
                          {project.sentiment_trend === 'improving' && (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          )}
                          {project.sentiment_trend === 'declining' && (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <Progress
                          value={project.renewal_probability}
                          className={`h-2 ${
                            project.renewal_probability < 50 ? '[&>div]:bg-destructive' :
                            project.renewal_probability < 70 ? '[&>div]:bg-orange-500' :
                            '[&>div]:bg-green-500'
                          }`}
                        />
                      </div>

                      <Badge variant={getRiskBadgeVariant(project.risk_level)}>
                        {project.risk_level}
                      </Badge>

                      <ChevronRight className={`h-5 w-5 transition-transform ${
                        selectedProject === project.id ? 'rotate-90' : ''
                      }`} />
                    </div>
                  </div>

                  {/* Expanded Signals View */}
                  {selectedProject === project.id && (
                    <div className="mt-4 pt-4 border-t">
                      <h5 className="text-sm font-semibold mb-3">Risk Signals</h5>
                      <div className="grid gap-2">
                        {project.signals.map((signal, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center gap-3 p-2 rounded text-sm ${
                              signal.type === 'positive'
                                ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                                : signal.type === 'negative'
                                ? 'bg-red-500/10 text-red-700 dark:text-red-400'
                                : 'bg-muted'
                            }`}
                          >
                            {getSignalIcon(signal.source)}
                            <span className="flex-1">{signal.message}</span>
                            {signal.evidenceLink && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(signal.evidenceLink, '_blank')}
                              >
                                View
                              </Button>
                            )}
                          </div>
                        ))}

                        {project.signals.length === 0 && (
                          <p className="text-muted-foreground text-sm">
                            No significant signals detected
                          </p>
                        )}
                      </div>

                      {project.last_positive_interaction && (
                        <div className="mt-3 text-sm text-muted-foreground">
                          Last positive interaction: {format(new Date(project.last_positive_interaction), 'MMM d, yyyy')}
                        </div>
                      )}

                      {project.blocker_count > 0 && (
                        <div className="mt-2 text-sm text-orange-600">
                          ⚠️ {project.blocker_count} active blocker(s)
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
