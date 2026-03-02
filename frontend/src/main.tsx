import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'
import App from './App.tsx'
import { ErrorBoundary } from './ErrorBoundary.tsx'

const rootEl = document.getElementById('app')
if (!rootEl) {
  document.body.innerHTML = '<div style="padding: 2rem; font-family: system-ui; text-align: center;">Root element #app not found. Check index.html.</div>'
} else {
  try {
    createRoot(rootEl).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    )
  } catch (err) {
    rootEl.innerHTML = `<div style="padding: 2rem; font-family: system-ui; color: #b91c1c;">Failed to start app: ${err instanceof Error ? err.message : String(err)}</div>`
  }
}
