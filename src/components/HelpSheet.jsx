import { useEffect, useState } from 'react'
import { getActionColor } from '../lib/actionColors'

const STAGES = [
  {
    title: 'Needs Action',
    blurb: 'New, not yet touched.',
    tags: ['Call Back','Reply Required','Quote Required','Visit Required','Review Details'],
  },
  {
    title: 'In Process',
    blurb: 'Started, waiting on customer or you.',
    tags: ['Contacted','Waiting on Customer','Quote Sent','Appointment Agreed','Awaiting Confirmation'],
  },
  {
    title: 'Booked',
    blurb: 'Confirmed - calendar bookings land here automatically.',
    tags: ['Job Booked','Callback Booked','Visit Booked','Quote Accepted'],
  },
]

const BUTTONS = [
  { name: 'Card (tap)',  desc: 'Expands the card inline to see all details.' },
  { name: 'Phone icon',  desc: 'Calls the customer straight away.' },
  { name: 'Arrow icon',  desc: 'Opens the stage picker to move them through.' },
  { name: 'Call',        desc: 'Same as phone icon — direct dial.' },
  { name: 'SMS',         desc: 'Pre-written messages, one tap to send.' },
  { name: 'WhatsApp',    desc: 'Opens WhatsApp with a templated message.' },
  { name: 'Calendar',    desc: 'Adds the appointment to your phone calendar.' },
  { name: 'Voice note',  desc: 'Speak after a call - saved as a note.' },
  { name: 'Stage',       desc: 'Moves the enquiry to the next stage.' },
]

const FUNCTIONS = [
  { name: 'List / Map',         desc: 'See jobs as a list or pinned on a map by postcode.' },
  { name: 'Date filter',        desc: 'Today, last 7 days, custom range etc.' },
  { name: 'Follow-ups tab',     desc: 'Auto reminders: chase quotes, confirm bookings, ask for reviews.' },
  { name: 'Urgency badge',      desc: 'Red / amber / blue / green - how soon they need you.' },
  { name: 'Action colour',      desc: 'Left border + tag colour stays consistent through stages.' },
  { name: 'Auto-Booked',        desc: 'Calendar bookings skip Needs Action and go straight to Booked.' },
  { name: 'Specialist Qs',      desc: 'Your custom widget questions show in amber on the card.' },
  { name: 'Photo / video',      desc: 'Customer uploads show inline, tap to enlarge.' },
  { name: 'Internal notes',     desc: 'Saved per enquiry. Voice notes append with timestamps.' },
]

export default function HelpSheet({ onClose }) {
  const [tab, setTab] = useState('stages')

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet help-sheet" role="dialog" aria-label="Help">
        <div className="handle" />

        <div className="help-tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'stages'}   className={`help-tab ${tab === 'stages'   ? 'active' : ''}`} onClick={() => setTab('stages')}>Stages</button>
          <button role="tab" aria-selected={tab === 'buttons'}  className={`help-tab ${tab === 'buttons'  ? 'active' : ''}`} onClick={() => setTab('buttons')}>Buttons</button>
          <button role="tab" aria-selected={tab === 'features'} className={`help-tab ${tab === 'features' ? 'active' : ''}`} onClick={() => setTab('features')}>Features</button>
        </div>

        <div className="help-body">
          {tab === 'stages' && (
            <div className="help-pane">
              <p className="help-intro">Every enquiry moves through three stages. Tap the arrow icon on a card to change.</p>
              {STAGES.map(s => (
                <div className="help-stage" key={s.title}>
                  <div className="help-stage-title">{s.title}</div>
                  <div className="help-stage-blurb">{s.blurb}</div>
                  <div className="help-stage-tags">
                    {s.tags.map(t => (
                      <span className="help-tag-chip" key={t} style={{ background: `${getActionColor(t)}1F`, color: getActionColor(t) }}>
                        <span className="help-dot-mini" style={{ background: getActionColor(t) }} />
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'buttons' && (
            <div className="help-pane">
              <p className="help-intro">Everything you can tap, in plain English.</p>
              {BUTTONS.map(b => (
                <div className="help-line" key={b.name}>
                  <div className="help-line-name">{b.name}</div>
                  <div className="help-line-desc">{b.desc}</div>
                </div>
              ))}
            </div>
          )}

          {tab === 'features' && (
            <div className="help-pane">
              <p className="help-intro">Everything the app does, in one line each.</p>
              {FUNCTIONS.map(f => (
                <div className="help-line" key={f.name}>
                  <div className="help-line-name">{f.name}</div>
                  <div className="help-line-desc">{f.desc}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="sheet-cancel" onClick={onClose}>Close</button>
      </div>
    </>
  )
}
