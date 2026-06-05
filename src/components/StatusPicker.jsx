import { useEffect, useState } from 'react'
import { getStatusColor } from './StatusPill'

const STATUSES = ['Needs Action', 'In Process', 'Booked', 'Archived']

const TAGS = {
  'Needs Action': [
    'Call Back', 'Reply Required', 'Quote Required',
    'Visit Required', 'Review Details'
  ],
  'In Process': [
    'Contacted', 'Waiting on Customer', 'Quote Sent',
    'Appointment Agreed', 'Awaiting Confirmation'
  ],
  'Booked': [
    'Job Booked', 'Callback Booked', 'Visit Booked', 'Quote Accepted'
  ],
  'Archived': []
}

function Chevron({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function Check({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export default function StatusPicker({ enquiry, onUpdate, onClose }) {
  const [step, setStep] = useState('status')
  const [chosenStatus, setChosenStatus] = useState(null)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  function handleStatusPick(s) {
    const tags = TAGS[s]
    if (!tags || tags.length === 0) {
      onUpdate({ status: s, tagField: null, tagValue: null })
      return
    }
    setChosenStatus(s)
    setStep('tag')
  }

  function handleTagPick(tag) {
    onUpdate({ status: chosenStatus, tagField: 'action_tag', tagValue: tag })
  }

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" role="dialog" aria-label="Change status">
        <div className="handle" />

        {step === 'status' ? (
          <>
            <div className="sheet-crumbs">
              <span className="crumb active">Status</span>
              <span className="crumb-sep"><Chevron size={12} /></span>
              <span className="crumb">Tag</span>
            </div>
            {STATUSES.map((s) => {
              const color = getStatusColor(s)
              const active = enquiry.status === s
              const hasTags = TAGS[s].length > 0
              return (
                <button
                  key={s}
                  className={`sheet-option ${active ? 'active' : ''}`}
                  onClick={() => handleStatusPick(s)}
                >
                  <span className="dot" style={{ background: color }} />
                  <span className="option-label">{s}</span>
                  {active && <span className="check"><Check /></span>}
                  {hasTags && (
                    <span className="option-next" aria-hidden="true">
                      <Chevron />
                    </span>
                  )}
                </button>
              )
            })}
            <button className="sheet-cancel" onClick={onClose}>Cancel</button>
          </>
        ) : (
          <>
            <div className="sheet-crumbs">
              <button className="crumb crumb-link" onClick={() => setStep('status')}>
                {chosenStatus}
              </button>
              <span className="crumb-sep"><Chevron size={12} /></span>
              <span className="crumb active">Tag</span>
            </div>
            {TAGS[chosenStatus].map((tag) => {
              const color = getStatusColor(chosenStatus)
              const active = enquiry.action_tag === tag && enquiry.status === chosenStatus
              return (
                <button
                  key={tag}
                  className={`sheet-option ${active ? 'active' : ''}`}
                  onClick={() => handleTagPick(tag)}
                >
                  <span className="dot" style={{ background: color, opacity: 0.6 }} />
                  <span className="option-label">{tag}</span>
                  {active && <span className="check"><Check /></span>}
                </button>
              )
            })}
            <button className="sheet-cancel" onClick={() => setStep('status')}>← Back</button>
          </>
        )}
      </div>
    </>
  )
}
