import { format } from 'date-fns'
import type {
  PortfolioOverview,
  ActionQueueFull,
  DeliveryIntelligence,
  AlertSummary,
} from '@/types/database'

// CSV Export utilities
export function downloadCSV(data: string, filename: string) {
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

export function projectsToCSV(projects: PortfolioOverview[]): string {
  const headers = [
    'Project Name',
    'Client',
    'Health Status',
    'Health Score',
    'Blockers',
    'Open Actions',
    'Overdue Actions',
    'Start Date',
    'End Date',
    'Days Remaining',
    'Contract Value',
    'Renewal Risk',
    'Last Activity',
    'AI Summary',
  ]

  const rows = projects.map((p) => [
    p.project_name,
    p.client_name || '',
    p.overall_health,
    p.health_score?.toString() || '',
    p.blocker_count.toString(),
    p.open_action_count.toString(),
    p.overdue_action_count.toString(),
    p.start_date,
    p.end_date,
    p.days_remaining.toString(),
    p.contract_value?.toString() || '',
    p.renewal_risk_score ? `${Math.round(p.renewal_risk_score * 100)}%` : '',
    p.last_activity_date || '',
    p.ai_summary?.replace(/"/g, '""') || '',
  ])

  return [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(','))
    .join('\n')
}

export function actionsToCSV(actions: ActionQueueFull[]): string {
  const headers = [
    'Title',
    'Description',
    'Project',
    'Owner',
    'Priority',
    'Status',
    'Due Date',
    'Source',
    'Created At',
  ]

  const rows = actions.map((a) => [
    a.title,
    a.description || '',
    a.project_name || '',
    a.owner || '',
    a.priority,
    a.status,
    a.due_date || '',
    a.source_type || '',
    format(new Date(a.created_at), 'yyyy-MM-dd HH:mm'),
  ])

  return [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(','))
    .join('\n')
}

export function messagesToCSV(messages: DeliveryIntelligence[]): string {
  const headers = [
    'Date',
    'Title',
    'Source',
    'Event Type',
    'Sentiment Score',
    'AI Processed',
    'Evidence Link',
  ]

  const rows = messages.map((m) => [
    format(new Date(m.created_at), 'yyyy-MM-dd HH:mm'),
    m.title || '',
    m.source,
    m.event_type,
    m.sentiment_score?.toString() || '',
    m.ai_processed ? 'Yes' : 'No',
    m.evidence_link,
  ])

  return [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(','))
    .join('\n')
}

export function alertsToCSV(alerts: AlertSummary[]): string {
  const headers = [
    'Title',
    'Message',
    'Severity',
    'Status',
    'Project',
    'Rule Type',
    'Triggered At',
  ]

  const rows = alerts.map((a) => [
    a.title,
    a.message,
    a.severity,
    a.status,
    a.project_name || '',
    a.rule_type || '',
    format(new Date(a.triggered_at), 'yyyy-MM-dd HH:mm'),
  ])

  return [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(','))
    .join('\n')
}

// PDF Export (using jspdf)
export async function exportToPDF(
  title: string,
  sections: Array<{
    title: string
    content: string | string[][]
    type: 'text' | 'table'
  }>
) {
  const { jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF()
  let yPosition = 20

  // Title
  doc.setFontSize(20)
  doc.setTextColor(0, 102, 204) // Corporate blue
  doc.text(title, 20, yPosition)
  yPosition += 10

  // Date
  doc.setFontSize(10)
  doc.setTextColor(128, 128, 128)
  doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy HH:mm')}`, 20, yPosition)
  yPosition += 15

  // Sections
  for (const section of sections) {
    // Section title
    doc.setFontSize(14)
    doc.setTextColor(33, 33, 33)
    doc.text(section.title, 20, yPosition)
    yPosition += 8

    if (section.type === 'text') {
      doc.setFontSize(10)
      doc.setTextColor(66, 66, 66)
      const lines = doc.splitTextToSize(section.content as string, 170)
      doc.text(lines, 20, yPosition)
      yPosition += lines.length * 5 + 10
    } else if (section.type === 'table') {
      const tableData = section.content as string[][]
      if (tableData.length > 1) {
        autoTable(doc, {
          startY: yPosition,
          head: [tableData[0]],
          body: tableData.slice(1),
          theme: 'striped',
          headStyles: {
            fillColor: [0, 102, 204],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
          },
          styles: {
            fontSize: 8,
            cellPadding: 3,
          },
          margin: { left: 20, right: 20 },
        })
        yPosition = (doc as typeof doc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15
      }
    }

    // Check if we need a new page
    if (yPosition > 270) {
      doc.addPage()
      yPosition = 20
    }
  }

  // Save
  doc.save(`${title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`)
}

// Generate portfolio health report
export async function generatePortfolioReport(projects: PortfolioOverview[]) {
  const critical = projects.filter((p) => p.overall_health === 'Critical')
  const atRisk = projects.filter((p) => p.overall_health === 'At Risk')
  const healthy = projects.filter((p) => p.overall_health === 'Healthy')
  const totalBlockers = projects.reduce((sum, p) => sum + (p.blocker_count || 0), 0)

  const summaryText = `
Portfolio Overview:
- Total Projects: ${projects.length}
- Critical: ${critical.length}
- At Risk: ${atRisk.length}
- Healthy: ${healthy.length}
- Total Blockers: ${totalBlockers}
  `.trim()

  const projectTable = [
    ['Project', 'Client', 'Health', 'Blockers', 'Days Left'],
    ...projects.map((p) => [
      p.project_name,
      p.client_name || '-',
      p.overall_health || 'Pending',
      p.blocker_count.toString(),
      p.days_remaining.toString(),
    ]),
  ]

  await exportToPDF('Portfolio Health Report', [
    { title: 'Summary', content: summaryText, type: 'text' },
    { title: 'Project Status', content: projectTable, type: 'table' },
  ])
}

// Generate project detail report
export async function generateProjectReport(
  project: PortfolioOverview,
  messages: DeliveryIntelligence[],
  actions: ActionQueueFull[]
) {
  const summaryText = `
Project: ${project.project_name}
Client: ${project.client_name || 'N/A'}
Health Status: ${project.overall_health}
Contract Period: ${project.start_date} to ${project.end_date}
Days Remaining: ${project.days_remaining}

Key Metrics:
- Blockers: ${project.blocker_count}
- Open Actions: ${project.open_action_count}
- Overdue Actions: ${project.overdue_action_count}

AI Summary:
${project.ai_summary || 'No AI summary available.'}
  `.trim()

  const actionsTable = actions.length > 0
    ? [
        ['Action', 'Owner', 'Priority', 'Status', 'Due'],
        ...actions.slice(0, 20).map((a) => [
          a.title.substring(0, 40),
          a.owner || '-',
          a.priority,
          a.status,
          a.due_date || '-',
        ]),
      ]
    : [['No actions']]

  const recentMessages = messages.slice(0, 10)
  const messagesTable = recentMessages.length > 0
    ? [
        ['Date', 'Title', 'Sentiment'],
        ...recentMessages.map((m) => [
          format(new Date(m.created_at), 'MMM d, yyyy'),
          (m.title || 'Untitled').substring(0, 50),
          m.sentiment_score ? `${Math.round(m.sentiment_score * 100)}%` : '-',
        ]),
      ]
    : [['No messages']]

  await exportToPDF(`Project Report - ${project.project_name}`, [
    { title: 'Project Overview', content: summaryText, type: 'text' },
    { title: 'Action Items', content: actionsTable, type: 'table' },
    { title: 'Recent Communications', content: messagesTable, type: 'table' },
  ])
}
