import { useDashboardStore } from './store/dashboardStore'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    useDashboardStore.getState().reconcileChartOrder()
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
