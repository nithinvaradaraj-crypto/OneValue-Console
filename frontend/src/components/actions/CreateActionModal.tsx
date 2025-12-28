import { useState } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { X, Plus, User, Calendar, Flag } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { GlassCard } from '@/components/ui/GlassCard'
import { cn } from '@/lib/utils'
import type { ActionPriority, SowContract } from '@/types/database'

interface CreateActionModalProps {
  isOpen: boolean
  onClose: () => void
  projectId?: string
}

export function CreateActionModal({ isOpen, onClose, projectId }: CreateActionModalProps) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [owner, setOwner] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [priority, setPriority] = useState<ActionPriority>('Medium')
  const [dueDate, setDueDate] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '')

  const { data: projects = [] } = useQuery({
    queryKey: ['projects_list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sow_contracts')
        .select('id, project_name')
        .order('project_name')
      if (error) throw error
      return data as Pick<SowContract, 'id' | 'project_name'>[]
    },
    enabled: !projectId,
  })

  const createAction = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('action_queue')
        .insert({
          project_id: selectedProjectId || null,
          title,
          description: description || null,
          owner: owner || null,
          owner_email: ownerEmail || null,
          priority,
          due_date: dueDate || null,
          source_type: 'Manual',
          status: 'Open',
        } as never)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['action_queue'] })
      handleClose()
    },
  })

  const handleClose = () => {
    setTitle('')
    setDescription('')
    setOwner('')
    setOwnerEmail('')
    setPriority('Medium')
    setDueDate('')
    setSelectedProjectId(projectId || '')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <GlassCard className="relative w-full max-w-lg p-6 animate-scale-in" intensity="strong">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary-100 dark:bg-primary-900/30">
              <Plus className="w-5 h-5 text-primary-600" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Create Action Item</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createAction.mutate()
          }}
          className="space-y-4"
        >
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Title <span className="text-health-critical">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter action item title..."
              required
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none"
            />
          </div>

          {/* Project Select */}
          {!projectId && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Project
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              >
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.project_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Owner & Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                <User className="w-4 h-4 inline mr-1" />
                Owner
              </label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="Assignee name"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                <Flag className="w-4 h-4 inline mr-1" />
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ActionPriority)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {/* Due Date & Email Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                <Calendar className="w-4 h-4 inline mr-1" />
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Owner Email
              </label>
              <input
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title || createAction.isPending}
              className={cn(
                'px-4 py-2 rounded-xl bg-primary-600 text-white font-medium',
                'hover:bg-primary-700 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {createAction.isPending ? 'Creating...' : 'Create Action'}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  )
}
