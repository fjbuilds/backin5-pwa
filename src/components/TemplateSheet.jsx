import { useEffect } from 'react'
import { smsHref, whatsappHref } from '../lib/comms'

const TEMPLATES = [
  { key: 'on-way',     label: 'On my way',         body: (n) => `Hi ${n || 'there'}, just letting you know I'm on my way. See you shortly.` },
  { key: 'late',       label: 'Running 10 min late', body: (n) => `Hi ${n || 'there'}, running about 10 minutes late - apologies, almost with you.` },
  { key: 'photo',      label: 'Need a photo to quote', body: (n) => `Hi ${n || 'there'}, could you send a quick photo of the issue so I can give you an accurate quote? Thanks.` },
  { key: 'confirm',    label: 'Confirm job is still on', body: (n) => `Hi ${n || 'there'}, just checking the job is still on for the agreed time. Reply YES to confirm.` },
  { key: 'arrived',    label: 'I\'ve arrived', body: (n) => `Hi ${n || 'there'}, I've arrived - let me know when you're ready.` },
  { key: 'done',       label: 'Job finished', body: (n) => `Hi ${n || 'there'}, all done today. Any issues, just give me a shout. Thanks.` },
]

export default function TemplateSheet({ enquiry, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const firstName = (enquiry.customer_name || '').split(' ')[0]

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet templates-sheet" role="dialog" aria-label="Quick messages">
        <div className="handle" />
        <h3>Quick messages</h3>
        <p className="tmpl-sub">Tap to send via SMS or WhatsApp</p>

        {TEMPLATES.map(t => {
          const body = t.body(firstName)
          return (
            <div className="tmpl-row" key={t.key}>
              <div className="tmpl-body">
                <div className="tmpl-label">{t.label}</div>
                <div className="tmpl-preview">{body}</div>
              </div>
              <div className="tmpl-actions">
                {enquiry.phone && (
                  <a className="tmpl-btn tmpl-sms" href={smsHref(enquiry.phone, body)} onClick={onClose} aria-label="Send via SMS">
                    SMS
                  </a>
                )}
                {enquiry.phone && (
                  <a className="tmpl-btn tmpl-wa" href={whatsappHref(enquiry.phone, body)} target="_blank" rel="noopener noreferrer" onClick={onClose} aria-label="Send via WhatsApp">
                    WA
                  </a>
                )}
              </div>
            </div>
          )
        })}

        <button className="sheet-cancel" onClick={onClose}>Cancel</button>
      </div>
    </>
  )
}
