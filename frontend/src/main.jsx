import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AppProvider } from './context/AppContext.jsx'

// Open the app with ?reset to start fresh: clears the farm, crop, logs and chats saved on this device.
// Community posts (strata_posts_*) and the Simple/Detailed view choice are kept.
const RESET_KEYS = ['strata_farm', 'strata_plots', 'strata_logs', 'strata_chats', 'strata_chat_current']
if (new URLSearchParams(window.location.search).has('reset')) {
  try {
    RESET_KEYS.forEach((k) => localStorage.removeItem(k))
  } catch {
    /* storage unavailable */
  }
  // drop ?reset from the address bar so a reload doesn't wipe again
  history.replaceState(null, '', window.location.pathname + window.location.hash)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
)
