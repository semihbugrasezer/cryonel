import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './locales' // Initialize i18n

// Import services for global access
import { authService } from './services/authService'
import { useAuthStore } from './stores/authStore'

// Expose services globally for debugging
if (typeof window !== 'undefined') {
  (window as any).authService = authService;
  (window as any).useAuthStore = useAuthStore;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
