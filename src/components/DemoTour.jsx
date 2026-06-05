import { useEffect, useState, useLayoutEffect } from 'react'

// `autoAdvance` — when set, the tour moves to the next step the moment the
// user actually performs the action on the target (taps the card, clicks Map,
// opens Follow-ups, etc.). Makes the tour feel like a guided journey rather
// than a click-Next-7-times slide deck.
const STEPS = [
  {
    target: null,
    title: 'Welcome to your BackIn5 dashboard',
    body: "This is a live demo with 5 example enquiries. We'll walk you through it in 6 quick steps - do each one to move on.",
    pos: 'center',
  },
  {
    target: '.card-v2-main',
    title: 'Tap any card to open it',
    body: 'Go on - tap one of the enquiries.',
    pos: 'bottom',
    autoAdvance: true,
  },
  {
    target: '.exp-toolbar',
    title: 'Call, message, book - inline',
    body: 'Everything you need is one tap away. Tap Next when ready.',
    pos: 'bottom',
  },
  {
    target: '.feed-group-header',
    title: 'Colour-coded by what to do',
    body: 'Orange = visit, purple = quote, green = booked. The same colour follows the job through every stage.',
    pos: 'bottom',
  },
  {
    target: '.view-toggle-btn:last-child',
    title: 'Switch to the Map',
    body: 'Tap the Map button to see jobs by area.',
    pos: 'bottom',
    autoAdvance: true,
  },
  {
    target: '.top-tab:nth-child(2)',
    title: 'Open Follow-ups',
    body: 'Tap the Follow-ups tab - this is where we chase quotes, confirm bookings and prompt for reviews.',
    pos: 'bottom',
    autoAdvance: true,
  },
  {
    target: 'button[aria-label="Help"]',
    title: 'Need help? Tap the ?',
    body: 'Stages, buttons and features all explained in plain English. Tap it to finish the tour.',
    pos: 'left',
    autoAdvance: true,
  },
]

function getRect(selector) {
  if (!selector) return null
  const el = document.querySelector(selector)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { top: r.top, left: r.left, width: r.width, height: r.height, bottom: r.bottom, right: r.right }
}

export default function DemoTour() {
  const [active, setActive] = useState(true)
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState(null)

  const s = STEPS[step]

  // Position the spotlight + popup whenever step or window changes
  useLayoutEffect(() => {
    if (!active) return
    if (!s.target) { setRect(null); return }
    const update = () => setRect(getRect(s.target))
    update()
    const t1 = setTimeout(update, 60)
    const t2 = setTimeout(update, 200)
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      clearTimeout(t1); clearTimeout(t2)
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [step, active, s.target])

  // Skip step if target genuinely never resolves
  useEffect(() => {
    if (!active || !s.target) return
    if (rect) return
    const t = setTimeout(() => {
      if (!getRect(s.target)) {
        setStep(p => (p < STEPS.length - 1 ? p + 1 : p))
      }
    }, 600)
    return () => clearTimeout(t)
  }, [step, rect, active, s.target])

  // Auto-advance: listen for a click on the target and move on
  useEffect(() => {
    if (!active || !s.target || !s.autoAdvance) return
    let el = document.querySelector(s.target)
    if (!el) return
    const handler = () => {
      // Brief pause so the user sees their tap take effect first
      setTimeout(() => {
        setStep(p => {
          if (p >= STEPS.length - 1) { setActive(false); return p }
          return p + 1
        })
      }, 320)
    }
    el.addEventListener('click', handler, { once: true })
    return () => el.removeEventListener('click', handler)
  }, [step, active, s.target, s.autoAdvance, rect])

  if (!active) return null

  function dismiss() { setActive(false) }
  function next() {
    if (step < STEPS.length - 1) setStep(step + 1)
    else dismiss()
  }

  // Centred welcome card
  if (s.pos === 'center' || !s.target) {
    return (
      <>
        <div className="tour-backdrop" />
        <div className="tour-pop tour-pop-center" role="dialog" aria-label={s.title}>
          <button className="tour-close" onClick={dismiss} aria-label="Close tour">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div className="tour-step">{step + 1} of {STEPS.length}</div>
          <div className="tour-title">{s.title}</div>
          <div className="tour-body">{s.body}</div>
          <div className="tour-actions tour-actions-center">
            <button className="tour-skip" onClick={dismiss}>Skip tour</button>
            <button className="tour-next" onClick={next}>Start →</button>
          </div>
        </div>
      </>
    )
  }

  const vw = typeof window !== 'undefined' ? window.innerWidth  : 400
  const vh = typeof window !== 'undefined' ? window.innerHeight : 700
  const POP_W = Math.min(280, vw - 32)
  const padding = 12
  let top, left

  if (rect) {
    if (s.pos === 'bottom') {
      top  = Math.min(rect.bottom + padding, vh - 200)
      left = Math.max(16, Math.min(rect.left + rect.width / 2 - POP_W / 2, vw - POP_W - 16))
    } else if (s.pos === 'left') {
      top  = Math.max(16, Math.min(rect.top, vh - 200))
      left = Math.max(16, rect.left - POP_W - padding)
      if (left < 16) { left = 16; top = rect.bottom + padding }
    } else {
      top  = Math.min(rect.bottom + padding, vh - 200)
      left = Math.max(16, Math.min(rect.left, vw - POP_W - 16))
    }
  } else {
    top  = 80
    left = (vw - POP_W) / 2
  }

  return (
    <>
      {rect && (
        <div
          className="tour-spot"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
          }}
        />
      )}

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
          {!s.autoAdvance && (
            <button className="tour-next" onClick={next}>
              {step === STEPS.length - 1 ? 'Got it' : 'Next'}
            </button>
          )}
          {s.autoAdvance && (
            <span className="tour-hint">↑ try it</span>
          )}
        </div>
      </div>
    </>
  )
}
