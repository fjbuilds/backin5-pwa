import { useState } from 'react'
import { supabase } from '../lib/supabase'

const DAY = 24 * 60 * 60 * 1000

export default function SetPasswordPrompt({ onClose }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function save(e) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Use at least 8 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setSaving(true)
    const { error: err } = await supabase.auth.updateUser({
      password,
      data: { password_set: true },
    })
    setSaving(false)
    if (err) {
      setError(err.message || 'Could not save the password')
      return
    }
    localStorage.removeItem('bi5-pwd-prompt-skip-until')
    onClose({ saved: true })
  }

  function skip() {
    const until = Date.now() + 7 * DAY
    try { localStorage.setItem('bi5-pwd-prompt-skip-until', String(until)) } catch {}
    onClose({ saved: false })
  }

  return (
    <div className="set-pwd-backdrop" role="dialog" aria-modal="true" aria-labelledby="set-pwd-title">
      <div className="set-pwd-modal">
        <div className="set-pwd-head">
          <h2 id="set-pwd-title">Set a password</h2>
          <p>So you and your team can sign in any time without waiting for a magic link.</p>
        </div>
        <form onSubmit={save} className="set-pwd-form">
          <label>
            <span>New password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
              autoFocus
            />
          </label>
          <label>
            <span>Confirm password</span>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
          {error && <div className="set-pwd-error">{error}</div>}
          <div className="set-pwd-actions">
            <button type="button" className="set-pwd-skip" onClick={skip} disabled={saving}>
              Skip for now
            </button>
            <button type="submit" className="set-pwd-save" disabled={saving}>
              {saving ? 'Saving...' : 'Save password'}
            </button>
          </div>
        </form>
        <p className="set-pwd-hint">
          Share this email and password with your team so everyone sees the same enquiries.
        </p>
      </div>
    </div>
  )
}

export function shouldShowPasswordPrompt(session) {
  if (!session?.user) return false
  if (session.user.user_metadata?.password_set === true) return false
  try {
    const until = Number(localStorage.getItem('bi5-pwd-prompt-skip-until') || 0)
    if (until && until > Date.now()) return false
  } catch {}
  return true
}
