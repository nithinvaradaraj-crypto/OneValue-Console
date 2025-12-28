import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  FileText,
  Upload,
  Link as LinkIcon,
  ExternalLink,
  Trash2,
  Calendar,
  DollarSign,
  Users,
} from 'lucide-react'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { GlassCard } from '@/components/ui/GlassCard'
import { cn } from '@/lib/utils'
import type { SowContract } from '@/types/database'

interface SOWDocumentPanelProps {
  project: SowContract
  className?: string
}

export function SOWDocumentPanel({ project, className }: SOWDocumentPanelProps) {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [documentUrl, setDocumentUrl] = useState(project.pdf_link || '')

  const updateDocument = useMutation({
    mutationFn: async (url: string) => {
      const { error } = await supabase
        .from('sow_contracts')
        .update({ pdf_link: url || null } as never)
        .eq('id', project.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', project.id] })
      setIsEditing(false)
    },
  })

  const hasDocument = !!project.pdf_link

  return (
    <GlassCard className={cn('p-5', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold text-foreground">SOW Contract</h3>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-primary-600 hover:underline"
          >
            {hasDocument ? 'Edit' : 'Link Document'}
          </button>
        )}
      </div>

      {/* Contract Details */}
      <div className="space-y-3 mb-4">
        <DetailRow
          icon={<Calendar className="w-4 h-4" />}
          label="Contract Period"
          value={`${format(new Date(project.start_date), 'MMM d, yyyy')} - ${format(new Date(project.end_date), 'MMM d, yyyy')}`}
        />
        {project.contract_value && (
          <DetailRow
            icon={<DollarSign className="w-4 h-4" />}
            label="Contract Value"
            value={`$${project.contract_value.toLocaleString()}`}
          />
        )}
        {project.inferred_owner && (
          <DetailRow
            icon={<Users className="w-4 h-4" />}
            label="Project Owner"
            value={project.inferred_owner}
          />
        )}
      </div>

      {/* Document Link */}
      {isEditing ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-muted-foreground" />
            <input
              type="url"
              value={documentUrl}
              onChange={(e) => setDocumentUrl(e.target.value)}
              placeholder="Paste Google Drive or PDF link..."
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setDocumentUrl(project.pdf_link || '')
                setIsEditing(false)
              }}
              className="px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => updateDocument.mutate(documentUrl)}
              disabled={updateDocument.isPending}
              className="px-3 py-1.5 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {updateDocument.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : hasDocument ? (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
          <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
            <FileText className="w-5 h-5 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              SOW Document
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {project.pdf_link}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <a
              href={project.pdf_link!}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-muted text-primary-600 transition-colors"
              title="Open document"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={() => updateDocument.mutate('')}
              className="p-2 rounded-lg hover:bg-muted text-health-critical transition-colors"
              title="Remove link"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className="w-full p-4 rounded-xl border-2 border-dashed border-border hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-900/20 transition-colors group"
        >
          <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-primary-600">
            <Upload className="w-8 h-8" />
            <span className="text-sm font-medium">Link SOW Document</span>
            <span className="text-xs">Google Drive, SharePoint, or direct PDF link</span>
          </div>
        </button>
      )}

      {/* Scope Anchors */}
      {project.scope_anchors && project.scope_anchors.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-sm font-medium text-foreground mb-2">Scope Anchors</p>
          <div className="flex flex-wrap gap-2">
            {project.scope_anchors.map((anchor, i) => (
              <span
                key={i}
                className="px-2 py-1 text-xs rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
              >
                {anchor}
              </span>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  )
}

function DetailRow({
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
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-sm text-muted-foreground">{label}:</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}
