import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, ListTodo, LogOut, User, Moon, Sun, Monitor, Bell, RefreshCw, ChevronDown, Check, Settings } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'

interface LayoutProps {
  children: React.ReactNode
}

type BadgeKey = 'critical' | 'overdue' | 'atRisk'

interface NavItem {
  path: string
  label: string
  icon: typeof LayoutDashboard
  badgeKey?: BadgeKey
}

// Main navigation items (left side) with badge types
const navItems: NavItem[] = [
  { path: '/overview', label: 'Overview', icon: LayoutDashboard, badgeKey: 'critical' },
  { path: '/actions', label: 'Actions', icon: ListTodo, badgeKey: 'overdue' },
  { path: '/renewals', label: 'Renewals', icon: RefreshCw, badgeKey: 'atRisk' },
  { path: '/alerts', label: 'Alerts', icon: Bell },
]

// Theme options for dropdown
const themeOptions = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const { user, role } = useAuth()
  const { theme, setTheme, isDark } = useTheme()
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const themeMenuRef = useRef<HTMLDivElement>(null)

  // Check if user is admin
  const isAdmin = role === 'Admin'

  // Close theme menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setThemeMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch unread alerts count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['alerts_count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('alert_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'unread')
      if (error) throw error
      return count || 0
    },
    refetchInterval: 30000,
  })

  // Fetch critical projects count for Overview badge
  const { data: criticalCount = 0 } = useQuery({
    queryKey: ['critical_count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('portfolio_overview')
        .select('*', { count: 'exact', head: true })
        .eq('overall_health', 'Critical')
      if (error) throw error
      return count || 0
    },
    refetchInterval: 30000,
  })

  // Fetch overdue actions count for Actions badge
  const { data: overdueCount = 0 } = useQuery({
    queryKey: ['overdue_count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('action_queue')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'Completed')
        .neq('status', 'Cancelled')
        .lt('due_date', new Date().toISOString())
      if (error) throw error
      return count || 0
    },
    refetchInterval: 30000,
  })

  // Fetch at-risk renewals count for Renewals badge
  const { data: atRiskCount = 0 } = useQuery({
    queryKey: ['atrisk_count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('portfolio_overview')
        .select('*', { count: 'exact', head: true })
        .gt('renewal_risk_score', 0.5)
      if (error) throw error
      return count || 0
    },
    refetchInterval: 30000,
  })

  // Badge counts map
  const badgeCounts = {
    critical: criticalCount,
    overdue: overdueCount,
    atRisk: atRiskCount,
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const ThemeIcon = theme === 'system' ? Monitor : isDark ? Moon : Sun

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header - Apple-style glass navigation with enhanced Tahoe OS26 polish */}
      <header className={cn(
        'sticky top-0 z-50',
        'backdrop-blur-2xl saturate-150',
        'bg-white/80 dark:bg-slate-900/80',
        'border-b border-white/30 dark:border-slate-700/50',
        '[box-shadow:0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.5)]',
        'dark:[box-shadow:0_1px_3px_rgba(0,0,0,0.2),0_4px_12px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.08)]'
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo - Enhanced with vibrant gradient and glow */}
            <Link to="/overview" className="flex items-center gap-3 group">
              <div className={cn(
                'w-10 h-10 rounded-2xl flex items-center justify-center',
                'bg-gradient-to-br from-primary-400 via-primary-500 to-primary-700',
                'shadow-lg shadow-primary-500/30',
                'group-hover:shadow-xl group-hover:shadow-primary-500/40',
                'group-hover:scale-105',
                'transition-all duration-300 ease-out'
              )}>
                <span className="text-sm font-bold text-white tracking-tight">OV</span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-foreground leading-tight tracking-tight">OneValue</span>
                <span className="text-xs text-muted-foreground hidden sm:block tracking-wide">Delivery Intelligence</span>
              </div>
            </Link>

            {/* Navigation - Main nav items with enhanced glass pill container */}
            <nav className={cn(
              'flex items-center gap-1 p-1.5 rounded-2xl',
              'bg-white/50 dark:bg-slate-800/40',
              'backdrop-blur-lg',
              'border border-white/30 dark:border-slate-700/40',
              '[box-shadow:inset_0_1px_0_rgba(255,255,255,0.4),0_1px_2px_rgba(0,0,0,0.04)]',
              'dark:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.2)]'
            )}>
              {navItems.map((item) => {
                const isActive = location.pathname === item.path ||
                  (item.path === '/overview' && location.pathname === '/')
                const Icon = item.icon
                // Special case for alerts - use unreadCount instead of badgeCounts
                const isAlerts = item.path === '/alerts'
                const badgeCount = isAlerts ? unreadCount : (item.badgeKey ? badgeCounts[item.badgeKey] : 0)

                // Badge color based on type
                const badgeStyles: Record<BadgeKey | 'alerts', string> = {
                  critical: 'bg-gradient-to-b from-[rgb(255,69,58)] to-[rgb(255,45,35)] shadow-[0_2px_8px_rgba(255,69,58,0.4)] animate-pulse',
                  overdue: 'bg-gradient-to-b from-[rgb(255,159,10)] to-[rgb(255,149,0)] shadow-[0_2px_8px_rgba(255,159,10,0.4)]',
                  atRisk: 'bg-gradient-to-b from-[rgb(10,132,255)] to-[rgb(0,122,255)] shadow-[0_2px_8px_rgba(10,132,255,0.4)]',
                  alerts: 'bg-gradient-to-b from-[rgb(255,69,58)] to-[rgb(255,45,35)] shadow-[0_2px_8px_rgba(255,69,58,0.4)] animate-pulse',
                }

                const badgeStyle = isAlerts ? badgeStyles.alerts : (item.badgeKey ? badgeStyles[item.badgeKey] : '')

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium',
                      'transition-all duration-300 ease-out',
                      isActive
                        ? [
                            'bg-white dark:bg-slate-700/80',
                            'text-primary-600 dark:text-primary-400',
                            '[box-shadow:0_2px_8px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.8)]',
                            'dark:[box-shadow:0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]'
                          ]
                        : [
                            'text-muted-foreground',
                            'hover:text-foreground hover:bg-white/60 dark:hover:bg-slate-700/50',
                            'hover:scale-[1.02]'
                          ]
                    )}
                  >
                    <Icon className={cn(
                      'w-4 h-4 transition-transform duration-300',
                      isActive && 'text-primary-500'
                    )} />
                    <span className="hidden sm:inline">{item.label}</span>
                    {/* Badge with count */}
                    {badgeCount > 0 && (
                      <span className={cn(
                        'min-w-5 h-5 px-1.5 rounded-full',
                        'text-white text-xs font-bold',
                        'flex items-center justify-center',
                        'border border-white/20',
                        '[font-variant-numeric:tabular-nums]',
                        badgeStyle
                      )}>
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </span>
                    )}
                    {/* Active indicator underline */}
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary-500/60" />
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Right side - Admin (for admins), Theme, User Menu */}
            <div className="flex items-center gap-3">
              {/* Admin Button - Only for admins */}
              {isAdmin && (
                <Link
                  to="/admin"
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium',
                    'backdrop-blur-lg',
                    'bg-white/60 dark:bg-slate-800/50',
                    'border border-white/30 dark:border-slate-700/40',
                    '[box-shadow:0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.5)]',
                    'dark:[box-shadow:0_1px_3px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.06)]',
                    'transition-all duration-300 ease-out',
                    location.pathname === '/admin'
                      ? 'text-primary-600 dark:text-primary-400 bg-white/80 dark:bg-slate-700/60'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/80 dark:hover:bg-slate-700/60 hover:scale-[1.02]'
                  )}
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              )}

              {/* Theme Dropdown - Enhanced glass styling */}
              <div className="relative" ref={themeMenuRef}>
                <button
                  onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium',
                    'backdrop-blur-lg',
                    'bg-white/60 dark:bg-slate-800/50',
                    'border border-white/30 dark:border-slate-700/40',
                    '[box-shadow:0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.5)]',
                    'dark:[box-shadow:0_1px_3px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.06)]',
                    'text-muted-foreground hover:text-foreground',
                    'hover:bg-white/80 dark:hover:bg-slate-700/60',
                    'transition-all duration-300 ease-out'
                  )}
                >
                  <ThemeIcon className="w-4 h-4" />
                  <span className="hidden sm:inline capitalize">{theme}</span>
                  <ChevronDown className={cn(
                    'w-3 h-3 transition-transform duration-200',
                    themeMenuOpen && 'rotate-180'
                  )} />
                </button>

                {/* Dropdown Menu */}
                {themeMenuOpen && (
                  <div className={cn(
                    'absolute right-0 mt-2 w-40 py-2 rounded-xl z-50',
                    'bg-white/90 dark:bg-slate-800/90',
                    'backdrop-blur-xl',
                    'border border-white/30 dark:border-slate-700/40',
                    '[box-shadow:0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.5)]',
                    'dark:[box-shadow:0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]',
                    'animate-fade-in'
                  )}>
                    {themeOptions.map((option) => {
                      const Icon = option.icon
                      const isActive = theme === option.value
                      return (
                        <button
                          key={option.value}
                          onClick={() => {
                            setTheme(option.value)
                            setThemeMenuOpen(false)
                          }}
                          className={cn(
                            'w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium',
                            'transition-all duration-200',
                            isActive
                              ? 'text-primary-600 dark:text-primary-400 bg-primary-500/10'
                              : 'text-foreground hover:bg-muted/50'
                          )}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="flex-1 text-left">{option.label}</span>
                          {isActive && <Check className="w-4 h-4 text-primary-500" />}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* User Info - Enhanced glass pill */}
              <div className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-xl',
                'bg-white/50 dark:bg-slate-800/40',
                'backdrop-blur-lg',
                'border border-white/30 dark:border-slate-700/40',
                '[box-shadow:inset_0_1px_0_rgba(255,255,255,0.4)]',
                'dark:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.06)]'
              )}>
                <div className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center',
                  'bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/60 dark:to-primary-800/40',
                  'text-primary-600 dark:text-primary-400'
                )}>
                  <User className="w-4 h-4" />
                </div>
                <span className="hidden sm:inline text-sm text-foreground font-medium max-w-[150px] truncate">
                  {user?.email?.split('@')[0]}
                </span>
              </div>

              {/* Sign Out - Enhanced hover state */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className={cn(
                  'text-muted-foreground hover:text-health-critical',
                  'hover:bg-health-critical/10',
                  'rounded-xl transition-all duration-300',
                  'hover:scale-105'
                )}
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 animate-fade-in">{children}</main>

      {/* Footer - Enhanced with subtle glass effect */}
      <footer className={cn(
        'py-8 text-center text-sm',
        'text-muted-foreground',
        'border-t border-white/20 dark:border-slate-700/30',
        'bg-gradient-to-t from-white/30 to-transparent dark:from-slate-900/30'
      )}>
        <p className="font-medium tracking-tight">OneValue Delivery Intelligence Console</p>
        <p className="text-xs mt-1.5 opacity-50 tracking-wide">Powered by OneOrigin</p>
      </footer>
    </div>
  )
}
