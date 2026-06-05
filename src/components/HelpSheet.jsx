import { useEffect } from 'react'
import { getActionColor } from '../lib/actionColors'

const SECTIONS = [
  {
    title: 'Needs Action',
    blurb: 'New enquiries waiting for a first response.',
    tags: [
      { tag: 'Call Back',       desc: 'They asked for a phone call back.' },
      { tag: 'Reply Required',  desc: 'A reply by message or email is needed.' },
      { tag: 'Quote Required',  desc: 'They want a price for the job.' },
      { tag: 'Visit Required',  desc: 'They want you to come and see the job.' },
      { tag: 'Review Details',  desc: 'Not sure yet - check details and decide next step.' },
    ],
  },
  {
    title: 'In Process',
    blurb: 'You\'ve started on it but it\'s not booked yet.',
    tags: [
      { tag: 'Contacted',            desc: 'You\'ve reached out, awaiting their reply.' },
      { tag: 'Waiting on Customer',  desc: 'Ball is in their court - chase if needed.' },
      { tag: 'Quote Sent',           desc: 'Quote out, waiting for sign-off.' },
      { tag: 'Appointment Agreed',   desc: 'Verbal agreement on a date/time.' },
      { tag: 'Awaiting Confirmation',desc: 'Final confirmation pending.' },
    ],
  },
  {
    title: 'Booked',
    blurb: 'Confirmed jobs / visits. Customer booked directly = lands here automatically.',
    tags: [
      { tag: 'Job Booked',      desc: 'Work confirmed in the diary.' },
      { tag: 'Callback Booked', desc: 'Phone call scheduled.' },
      { tag: 'Visit Booked',    desc: 'Site visit / survey scheduled.' },
      { tag: 'Quote Accepted',  desc: 'Customer accepted the quote.' },
    ],
  },
]

const URGENCY = [
  { color: '#EF4444', label: 'Urgent',    desc: 'Emergency - call now.' },
  { color: '#D4890E', label: 'ASAP',      desc: 'As soon as possible.' },
  { color: '#5B8DEF', label: 'This week', desc: 'Within the week.' },
  { color: '#34A853', label: 'Flexible',  desc: 'No rush - schedule when it suits.' },
]

export default function HelpSheet({ onClose }) {
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

        <div className="help-head">
          <h2>How this works</h2>
          <p>Every enquiry has a colour + tag so you can scan the list and act fast. Tap any card to see details, tap the phone icon to call straight away.</p>
        </div>

        {/* Urgency key */}
        <div className="help-block">
          <div className="help-block-title">Urgency (top-right of card)</div>
          {URGENCY.map(u => (
            <div className="help-row" key={u.label}>
              <span className="help-dot" style={{ background: u.color }} />
              <div className="help-row-text">
                <div className="help-row-tag">{u.label}</div>
                <div className="help-row-desc">{u.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Action tags */}
        {SECTIONS.map(section => (
          <div className="help-block" key={section.title}>
            <div className="help-block-title">{section.title}</div>
            <div className="help-block-blurb">{section.blurb}</div>
            {section.tags.map(t => (
              <div className="help-row" key={t.tag}>
                <span className="help-dot" style={{ background: getActionColor(t.tag) }} />
                <div className="help-row-text">
                  <div className="help-row-tag">{t.tag}</div>
                  <div className="help-row-desc">{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        ))}

        <div className="help-block">
          <div className="help-block-title">Quick tips</div>
          <ul className="help-tips">
            <li>📞 Tap the phone icon on a card to call without opening.</li>
            <li>🔄 Tap the arrow icon to change a stage from the list.</li>
            <li>📅 Use the date filter to focus on today, this week, or any range.</li>
            <li>✨ Booked enquiries auto-land in Booked - no manual move needed.</li>
          </ul>
        </div>

        <button className="sheet-cancel" onClick={onClose}>Close</button>
      </div>
    </>
  )
}
