import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  UserPlus,
  Users,
  Shield,
  ShieldCheck,
  Eye,
  Check,
  X,
  Mail,
  Trash2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/ui/LoadingSpinner'
import { useAuth } from '@/hooks/useAuth'
import type { UserAllowlist, UserRole } from '@/types/database'

type AllowlistUser = UserAllowlist

const roleConfig = {
  Admin: {
    icon: ShieldCheck,
    color: 'text-[rgb(var(--color-red))]',
    bg: 'bg-[rgba(var(--color-red),0.1)]',
    border: 'border-[rgba(var(--color-red),0.2)]',
  },
  PM: {
    icon: Shield,
    color: 'text-[rgb(var(--color-blue))]',
    bg: 'bg-[rgba(var(--color-blue),0.1)]',
    border: 'border-[rgba(var(--color-blue),0.2)]',
  },
  Viewer: {
    icon: Eye,
    color: 'text-muted-foreground',
    bg: 'bg-muted/50',
    border: 'border-muted/50',
  },
}

export function UserManagement() {
  const { role: currentUserRole } = useAuth()
  const queryClient = useQueryClient()
  const [showInviteModal, setShowInviteModal] = useState(false)

  // Check if current user is admin
  const isAdmin = currentUserRole === 'Admin'

  const { data: users, isLoading } = useQuery({
    queryKey: ['allowlist_users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_allowlist')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as AllowlistUser[]
    },
    enabled: isAdmin,
  })

  const updateUser = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Pick<AllowlistUser, 'role' | 'is_active' | 'display_name'>> }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('user_allowlist')
        .update(updates)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allowlist_users'] })
    },
  })

  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_allowlist')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allowlist_users'] })
    },
  })

  if (!isAdmin) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <GlassCard className="p-8 text-center" intensity="strong" elevated>
          <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Access Restricted</h2>
          <p className="text-muted-foreground">Only administrators can manage users.</p>
        </GlassCard>
      </div>
    )
  }

  if (isLoading) {
    return <LoadingState message="Loading users..." />
  }

  const activeUsers = users?.filter(u => u.is_active) || []
  const inactiveUsers = users?.filter(u => !u.is_active) || []

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto animate-fade-in">
      {/* Invite Modal */}
      {showInviteModal && (
        <InviteUserModal
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['allowlist_users'] })
            setShowInviteModal(false)
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">User Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage access and permissions</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm',
            'bg-[rgb(var(--color-blue))] text-white',
            'hover:brightness-110 active:scale-[0.98]',
            'transition-all duration-300 ease-spring',
            'shadow-[0_4px_16px_rgba(var(--color-blue),0.3)]'
          )}
        >
          <UserPlus className="w-4 h-4" strokeWidth={2.5} />
          Invite User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <GlassCard className="p-5" intensity="strong" elevated>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[rgba(var(--color-blue),0.1)]">
              <Users className="w-5 h-5 text-[rgb(var(--color-blue))]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{activeUsers.length}</p>
              <p className="text-xs text-muted-foreground font-medium">Active Users</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-5" intensity="strong" elevated>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[rgba(var(--color-red),0.1)]">
              <ShieldCheck className="w-5 h-5 text-[rgb(var(--color-red))]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {users?.filter(u => u.role === 'Admin' && u.is_active).length || 0}
              </p>
              <p className="text-xs text-muted-foreground font-medium">Admins</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-5" intensity="strong" elevated>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-muted/50">
              <Eye className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{inactiveUsers.length}</p>
              <p className="text-xs text-muted-foreground font-medium">Inactive</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* User List */}
      <GlassCard className="p-6" intensity="medium" elevated>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          All Users
        </h2>

        <div className="space-y-3">
          {users?.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              onToggleActive={() =>
                updateUser.mutate({ id: user.id, updates: { is_active: !user.is_active } })
              }
              onDelete={() => {
                if (confirm(`Remove ${user.email} from the allowlist?`)) {
                  deleteUser.mutate(user.id)
                }
              }}
              onRoleChange={(role) =>
                updateUser.mutate({ id: user.id, updates: { role } })
              }
              isUpdating={updateUser.isPending}
            />
          ))}

          {users?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No users found. Invite your first user!
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  )
}

function UserRow({
  user,
  onToggleActive,
  onDelete,
  onRoleChange,
  isUpdating,
}: {
  user: AllowlistUser
  onToggleActive: () => void
  onDelete: () => void
  onRoleChange: (role: UserRole) => void
  isUpdating: boolean
}) {
  const [showMenu, setShowMenu] = useState(false)
  const config = roleConfig[user.role]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl transition-all duration-300',
        'bg-white/50 dark:bg-slate-800/30',
        'border border-white/20 dark:border-slate-700/30',
        'hover:bg-white/70 dark:hover:bg-slate-800/50',
        !user.is_active && 'opacity-50'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center',
          'bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/60 dark:to-primary-800/40',
          'text-primary-600 dark:text-primary-400 font-semibold'
        )}
      >
        {user.display_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">
          {user.display_name || user.email.split('@')[0]}
        </p>
        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
      </div>

      {/* Role Badge */}
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border',
            config.bg,
            config.color,
            config.border,
            'hover:brightness-95 transition-all duration-200'
          )}
        >
          <Icon className="w-3.5 h-3.5" />
          {user.role}
        </button>

        {/* Role Dropdown */}
        {showMenu && (
          <div
            className={cn(
              'absolute right-0 top-full mt-2 w-32 py-1 rounded-xl z-50',
              'bg-white/95 dark:bg-slate-800/95',
              'backdrop-blur-xl border border-white/30 dark:border-slate-700/40',
              '[box-shadow:0_8px_32px_rgba(0,0,0,0.12)]',
              'animate-fade-in'
            )}
          >
            {(['Admin', 'PM', 'Viewer'] as const).map((role) => (
              <button
                key={role}
                onClick={() => {
                  onRoleChange(role)
                  setShowMenu(false)
                }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm',
                  'hover:bg-muted/50 transition-colors',
                  user.role === role && 'text-primary-600 dark:text-primary-400'
                )}
              >
                {user.role === role && <Check className="w-3 h-3" />}
                <span className={user.role === role ? '' : 'ml-5'}>{role}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Status */}
      <button
        onClick={onToggleActive}
        disabled={isUpdating}
        className={cn(
          'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200',
          user.is_active
            ? 'bg-[rgba(var(--color-green),0.1)] text-[rgb(var(--color-green))] border border-[rgba(var(--color-green),0.2)]'
            : 'bg-muted/50 text-muted-foreground border border-muted/50',
          'hover:brightness-95'
        )}
      >
        {user.is_active ? 'Active' : 'Inactive'}
      </button>

      {/* Delete */}
      <button
        onClick={onDelete}
        className={cn(
          'p-2 rounded-lg text-muted-foreground',
          'hover:text-[rgb(var(--color-red))] hover:bg-[rgba(var(--color-red),0.1)]',
          'transition-all duration-200'
        )}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}

function InviteUserModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState<UserRole>('Viewer')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleInvite = async () => {
    if (!email) {
      setError('Email is required')
      return
    }

    if (!email.endsWith('@oneorigin.us')) {
      setError('Only @oneorigin.us emails are allowed')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const insertData = {
        email: email.toLowerCase(),
        display_name: displayName || null,
        role,
        is_active: true,
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: dbError } = await (supabase as any).from('user_allowlist').insert(insertData)

      if (dbError) {
        if (dbError.code === '23505') {
          setError('This email is already in the allowlist')
        } else {
          setError(dbError.message)
        }
        return
      }

      onSuccess()
    } catch (err) {
      setError('Failed to invite user')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <GlassCard
        className="relative w-full max-w-md p-6 animate-fade-in"
        intensity="strong"
        elevated
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            Invite User
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@oneorigin.us"
                className={cn(
                  'w-full pl-10 pr-4 py-3 rounded-xl',
                  'bg-white/50 dark:bg-slate-800/50',
                  'border border-white/30 dark:border-slate-700/40',
                  'text-foreground placeholder:text-muted-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500/50',
                  'transition-all duration-200'
                )}
              />
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Display Name (optional)
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="John Doe"
              className={cn(
                'w-full px-4 py-3 rounded-xl',
                'bg-white/50 dark:bg-slate-800/50',
                'border border-white/30 dark:border-slate-700/40',
                'text-foreground placeholder:text-muted-foreground',
                'focus:outline-none focus:ring-2 focus:ring-primary-500/50',
                'transition-all duration-200'
              )}
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Admin', 'PM', 'Viewer'] as const).map((r) => {
                const config = roleConfig[r]
                const Icon = config.icon
                return (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={cn(
                      'flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium',
                      'border transition-all duration-200',
                      role === r
                        ? [config.bg, config.color, config.border]
                        : 'bg-white/30 dark:bg-slate-800/30 border-white/20 dark:border-slate-700/30 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {r}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-xl bg-[rgba(var(--color-red),0.1)] border border-[rgba(var(--color-red),0.2)]">
              <p className="text-sm text-[rgb(var(--color-red))]">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <button
              onClick={handleInvite}
              disabled={isLoading}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm',
                'bg-[rgb(var(--color-blue))] text-white',
                'hover:brightness-110 active:scale-[0.98]',
                'transition-all duration-300',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isLoading ? 'Inviting...' : 'Send Invite'}
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
