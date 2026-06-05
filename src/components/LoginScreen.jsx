import { useState } from 'react'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginScreen({ sendMagicLink, signInWithPassword }) {
  const [mode, setMode] = useState('magic') // 'magic' or 'password'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  const valid = EMAIL_RE.test(email.trim())

  async function handleSubmit(e) {
    e.preventDefault()
    if (!valid || sending) return
    setSending(true)
    setError(null)

    if (mode === 'password') {
      const { error } = await signInWithPassword(email.trim(), password)
      setSending(false)
      if (error) setError(error.message)
      return
    }

    const { error } = await sendMagicLink(email.trim())
    setSending(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div className="app-shell">
      <div className="login">
        {!sent ? (
          <>
            <div className="login-logo">BackIn5</div>
            <p className="subtitle">Sign in to your enquiries</p>
            <form onSubmit={handleSubmit}>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                inputMode="email"
                autoFocus
              />
              {mode === 'password' && (
                <input
                  className="input"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              )}
              <button
                type="submit"
                className="btn-primary"
                disabled={!valid || sending || (mode === 'password' && !password)}
              >
                {sending ? 'Signing in…' : mode === 'password' ? 'Sign in' : 'Send magic link'}
              </button>
              {error && <div className="error-banner" style={{ margin: 0 }}>{error}</div>}
              <button
                type="button"
                className="link-btn"
                onClick={() => { setMode(mode === 'magic' ? 'password' : 'magic'); setError(null) }}
              >
                {mode === 'magic' ? 'Use password instead' : 'Use magic link instead'}
              </button>
            </form>
          </>
        ) : (
          <div className="confirmation">
            <div className="icon" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 7l9 6 9-6" />
              </svg>
            </div>
            <h2>Check your email</h2>
            <p>Magic link sent to</p>
            <p style={{ color: 'var(--text)', fontWeight: 600 }}>{email.trim()}</p>
            <button className="link-btn" onClick={() => { setSent(false); setEmail('') }}>
              Use a different email
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
