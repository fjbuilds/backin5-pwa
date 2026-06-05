import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.jsx'
import './index.css'

const IS_DEMO = new URLSearchParams(window.location.search).has('demo')

if (IS_DEMO) {
  // Demo should ALWAYS be fresh — never cached by the PWA service worker.
  // Wipe any existing registration + caches so previous visits don't bleed in.
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(r => r.unregister())
    }).catch(() => {})
  }
  if ('caches' in window) {
    caches.keys().then(keys => keys.forEach(k => caches.delete(k))).catch(() => {})
  }
  // Reset every BackIn5 localStorage key — tour, etc. — so each demo visitor sees
  // the same starting state. Then lock the theme to light for marketing parity.
  try {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('bi5_')) localStorage.removeItem(k)
    })
    localStorage.setItem('backin5-theme', 'light')
  } catch {}
} else {
  // Real users get the offline-capable PWA with aggressive auto-update.
  registerSW({
    immediate: true,
    onNeedRefresh() { location.reload() },
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
