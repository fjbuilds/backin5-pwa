import { useEffect, useState, useLayoutEffect } from 'react'

const STORAGE_KEY = 'bi5_tour_seen_v1'

const STEPS = [
  {
    target: '.card-v2-main',
    title: 'Tap any card',
    body: 'Cards expand inline - no extra screens.',
    pos: 'bottom',
  },
  {
    target: '.card-act-btn[aria-label="Call"]',
    title: 'Call straight from the list',
    body: 'No need to open the card. One tap to dial.',
    pos: 'left',
  },
  {
    target: '.feed-group-header',
    title: 'Colour-coded by what to do',
    body: 'Orange = visit, purple = quote, green = booked. Same colour stays through every stage.',
    pos: 'bottom',
  },
  {
    target: '.view-toggle-btn:last-child',
    title: 'See jobs on a map',
    body: 'Plan your day by area, not by guesswork.',
    pos: 'bottom',
  },
  {
    target: '.top-tab:nth-child(2)',
    title: 'Auto follow-ups',
    body: 'We chase quotes, confirm bookings, and remind you to ask for reviews.',
    pos: 'bottom',
  },
  {
    target: 'button[aria-label="Help"]',
    title: 'Stuck? Tap the ?',
    body: 'Every button and stage explained in plain English.',
    pos: 'left',
  },
]

function getRect(selector) {
  const el = document.querySelector(selector)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { top: r.top, left: r.left, width: r.width, height: r.height, bottom: r.bottom, right: r.right }
}

export default function DemoTour() {
  // Skip if user already dismissed
  const [active, setActive] = useState(() => {
    try { return !localStorage.getItem(STORAGE_KEY) } catch { return true }
  })
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState(null)

  useLayoutEffect(() => {
    if (!active) return
    const update = () => setRect(getRect(STEPS[step].target))
    update()
    const t = setTimeout(update, 80) // wait for layout
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [step, active])

  if (!active) return null
  const s = STEPS[step]
  if (!rect) {
    // Target not found — skip to next or end
    if (step < STEPS.length - 1) setStep(step + 1)
    else setActive(false)
    return null
  }

  function dismiss() {
    try { localStorage.setItem(STORAGE_KEY, '1') } catch {}
    setActive(false)
  }
  function next() {
    if (step < STEPS.length - 1) setStep(step + 1)
    else dismiss()
  }

  // Position pop-up relative to target — clamp inside viewport
  const vw = window.innerWidth, vh = window.innerHeight
  const POP_W = Math.min(280, vw - 32)
  let top, left
  const padding = 12
  if (s.pos === 'bottom') {
    top = Math.min(rect.bottom + padding, vh - 180)
    left = Math.max(16, Math.min(rect.left + rect.width / 2 - POP_W / 2, vw - POP_W - 16))
  } else if (s.pos === 'left') {
    top = Math.max(16, Math.min(rect.top, vh - 180))
    left = Math.max(16, rect.left - POP_W - padding)
    if (left < 16) { left = 16; top = rect.bottom + padding }
  } else {
    top = Math.min(rect.bottom + padding, vh - 180)
    left = Math.max(16, Math.min(rect.left, vw - POP_W - 16))
  }

  return (
    <>
      {/* Highlight ring around target */}
      <div
        className="tour-spot"
        style={{
          top: rect.top - 6,
          left: rect.left - 6,
          width: rect.width + 12,
          height: rect.height + 12,
        }}
      />

      {/* Pop-up card */}
      <div
        className="tour-pop"
        style={{ top, left, width: POP_W }}
        role="dialog"
        aria-label={s.title}
      >
        <button className="tour-close" onClick={dismiss} aria-label="Close tour">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="tour-step">{step + 1} of {STEPS.length}</div>
        <div className="tour-title">{s.title}</div>
        <div className="tour-body">{s.body}</div>
        <div className="tour-actions">
          <button className="tour-skip" onClick={dismiss}>Skip</button>
          <button className="tour-next" onClick={next}>
            {step === STEPS.length - 1 ? 'Got it' : 'Next'}
          </button>
        </div>
      </div>
    </>
  )
}
