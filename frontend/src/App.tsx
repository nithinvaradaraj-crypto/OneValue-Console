import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { ProjectDetail } from '@/pages/ProjectDetail'
import { ActionQueue } from '@/pages/ActionQueue'
import { Alerts } from '@/pages/Alerts'
import Renewals from '@/pages/Renewals'
import { UserManagement } from '@/pages/UserManagement'
import { LoadingState } from '@/components/ui/LoadingSpinner'
import { Layout } from '@/components/Layout'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isAllowed, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <LoadingState message="Checking authentication..." />
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!isAllowed) {
    return (
      <Login
        error="Your account is not authorized. Please contact an administrator to request access."
      />
    )
  }

  return <>{children}</>
}

function AuthCallback() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return <LoadingState message="Completing sign in..." />
  }

  return <Navigate to="/" replace />
}

function AppRoutes() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingState message="Loading..." />
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/overview" replace /> : <Login />}
      />
      <Route path="/auth/callback" element={<AuthCallback />} />
      {/* Redirect root to /overview */}
      <Route path="/" element={<Navigate to="/overview" replace />} />
      <Route
        path="/overview"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/project/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <ProjectDetail />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/actions"
        element={
          <ProtectedRoute>
            <Layout>
              <ActionQueue />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/alerts"
        element={
          <ProtectedRoute>
            <Layout>
              <Alerts />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/renewals"
        element={
          <ProtectedRoute>
            <Layout>
              <Renewals />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Layout>
              <UserManagement />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
