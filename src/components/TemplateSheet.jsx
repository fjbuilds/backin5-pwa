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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.149-.173.198-.298.297-.496.099-.198.05-.372-.025-.521-.074-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.298-1.04 1.016-1.04 2.479 0 1.463 1.065 2.876 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
                    </svg>
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
