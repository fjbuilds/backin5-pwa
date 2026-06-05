import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.jsx'
import './index.css'

// Auto-reload as soon as a new build is available so demo visitors and
// installed PWA users always see the latest code without manual refresh.
registerSW({
  immediate: true,
  onNeedRefresh() {
    // A new build is waiting — apply it now.
    location.reload()
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
