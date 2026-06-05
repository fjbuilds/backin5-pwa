import { useEffect, useRef, useState } from 'react'

export default function VoiceRecorder({ onSave, onClose, existing = '' }) {
  const SR = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null
  const [text, setText] = useState('')
  const [recording, setRecording] = useState(false)
  const [supported] = useState(!!SR)
  const recognitionRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
      try { recognitionRef.current?.stop() } catch {}
    }
  }, [onClose])

  function start() {
    if (!SR) return
    const rec = new SR()
    rec.lang = 'en-GB'
    rec.continuous = true
    rec.interimResults = true
    let final = ''
    rec.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t + ' '
        else interim += t
      }
      setText((final + interim).trim())
    }
    rec.onerror = () => setRecording(false)
    rec.onend = () => setRecording(false)
    recognitionRef.current = rec
    rec.start()
    setRecording(true)
  }

  function stop() {
    try { recognitionRef.current?.stop() } catch {}
    setRecording(false)
  }

  function save() {
    const trimmed = text.trim()
    if (!trimmed) { onClose(); return }
    const stamp = new Date().toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })
    const block = `[${stamp}] ${trimmed}`
    const merged = existing ? `${existing}\n\n${block}` : block
    onSave(merged)
    onClose()
  }

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet voice-sheet" role="dialog" aria-label="Voice note">
        <div className="handle" />
        <h3>Voice note</h3>

        {!supported && (
          <div className="voice-unsupported">
            Voice input isn't supported in this browser. You can still type a note below.
          </div>
        )}

        <div className={`voice-mic ${recording ? 'recording' : ''}`}>
          <button
            className="voice-mic-btn"
            onClick={recording ? stop : start}
            aria-label={recording ? 'Stop recording' : 'Start recording'}
            disabled={!supported}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
          <div className="voice-state">
            {recording ? 'Listening… tap to stop' : supported ? 'Tap mic to start' : ''}
          </div>
        </div>

        <textarea
          className="voice-text"
          placeholder="Your note will appear here…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
        />

        <div className="voice-actions">
          <button className="sheet-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={!text.trim()}>Save note</button>
        </div>
      </div>
    </>
  )
}
