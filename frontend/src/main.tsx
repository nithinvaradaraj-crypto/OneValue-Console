import { StrictMode, Component, ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

import './index.css'

// Error boundary to catch runtime errors
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', background: '#1a1a2e', color: '#fff', minHeight: '100vh' }}>
          <h1 style={{ color: '#ff6b6b' }}>Something went wrong</h1>
          <pre style={{ background: '#16213e', padding: '20px', borderRadius: '8px', overflow: 'auto' }}>
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
