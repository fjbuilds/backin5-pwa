import { useState } from 'react'
import { formatCardDate } from '../lib/dates'
import { getActionColor } from '../lib/actionColors'
import { buildIcs, downloadIcs, parseAppointmentToDate, whatsappHref } from '../lib/comms'
import TemplateSheet from './TemplateSheet'
import VoiceRecorder from './VoiceRecorder'

function urgencyMeta(urgency) {
  const u = (urgency || '').toLowerCase()
  if (u.includes('urgent') || u.includes('emergency')) return { color: '#EF4444', label: 'Urgent' }
  if (u.includes('soon')) return { color: '#D4890E', label: 'ASAP' }
  if (u.includes('week')) return { color: '#5B8DEF', label: 'This week' }
  if (u) return { color: '#34A853', label: 'Flexible' }
  return null
}

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTHS_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS_FULL    = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

function parseAppointmentDisplay(str) {
  if (!str) return null
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})\s+at\s+(.+)$/i)
  if (!m) return null
  const [, year, month, day, time] = m
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  if (isNaN(date.getTime())) return null
  return {
    dayName: DAYS_FULL[date.getDay()],
    dayNum: Number(day),
    monthShort: MONTHS_SHORT[Number(month) - 1],
    monthFull: MONTHS_FULL[Number(month) - 1],
    year: Number(year),
    time: time.trim(),
  }
}

export default function EnquiryCard({ enquiry, onChangeStatus, onSaveNotes, isExpanded, onToggle }) {
  const [sheet, setSheet] = useState(null) // 'templates' | 'voice' | null

  const tag = enquiry.action_tag || enquiry.status || 'Review Details'
  const tagColor = getActionColor(tag)
  const town = enquiry.town || enquiry.area
  const urgency = urgencyMeta(enquiry.urgency)
  const bestTime = enquiry.preferred_contact_time || enquiry.next_action
  const apt = parseAppointmentDisplay(enquiry.appointment_datetime)

  const intentLower = (enquiry.enquiry_intent || '').toLowerCase()
  const showIntent = enquiry.enquiry_intent && !intentLower.includes('book directly')

  const isImage = enquiry.media_url && enquiry.media_url.match(/\.(jpg|jpeg|png|gif|webp|heic)$/i)
  const isVideo = enquiry.media_url && enquiry.media_url.match(/\.(mp4|mov|webm)$/i)

  function handleAddToCalendar(e) {
    e.stopPropagation()
    const apt = parseAppointmentToDate(enquiry.appointment_datetime)
    if (!apt) return
    const ics = buildIcs({
      title: `${enquiry.service_requested || 'Job'} - ${enquiry.customer_name || 'Customer'}`,
      startDate: apt,
      durationMinutes: 60,
      description: [
        enquiry.customer_name && `Customer: ${enquiry.customer_name}`,
        enquiry.phone && `Phone: ${enquiry.phone}`,
        enquiry.email && `Email: ${enquiry.email}`,
        enquiry.service_requested && `Service: ${enquiry.service_requested}`,
        enquiry.urgency && `Urgency: ${enquiry.urgency}`,
      ].filter(Boolean).join('\n'),
      location: [enquiry.postcode, town].filter(Boolean).join(', '),
    })
    downloadIcs(`backin5-${enquiry.id || 'job'}.ics`, ics)
  }

  return (
    <div className={`card-v2 ${isExpanded ? 'expanded' : ''}`} style={{ borderLeft: `3px solid ${tagColor}` }}>
      <button className="card-v2-main" onClick={() => onToggle(enquiry)}>
        <div className="card-v2-top">
          <span className="card-v2-name">{enquiry.customer_name || 'Unknown'}</span>
          {urgency && (
            <span className="urg-badge" style={{ background: `${urgency.color}1F`, color: urgency.color }}>
              <span className="urg-dot" style={{ background: urgency.color }} />
              {urgency.label}
            </span>
          )}
        </div>

        {enquiry.service_requested && (
          <div className="card-v2-service">{enquiry.service_requested}</div>
        )}

        <div className="card-v2-sub">
          {enquiry.postcode && <span className="card-v2-loc">{enquiry.postcode}</span>}
          {town && <span className="card-v2-loc">{town}</span>}
          {bestTime && <span className="card-v2-best">· {bestTime}</span>}
        </div>

        {enquiry.appointment_datetime && !isExpanded && (
          <div className="appt-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {enquiry.appointment_datetime}
          </div>
        )}

        <div className="card-v2-foot">
          <span className="card-v2-status" style={{ background: `${tagColor}1A`, color: tagColor }}>
            {tag}
          </span>
          <span className="card-v2-foot-right">
            {enquiry.source && (
              <span className="card-v2-source" title={`Came from: ${enquiry.source}`}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
                </svg>
                {enquiry.source}
              </span>
            )}
            <span className="card-v2-time">{formatCardDate(enquiry.created_at)}</span>
          </span>
        </div>
      </button>

      <div className="card-v2-actions">
        {enquiry.phone && (
          <a className="card-act-btn" href={`tel:${enquiry.phone}`} onClick={(e) => e.stopPropagation()} aria-label="Call">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </a>
        )}
        <button className="card-act-btn" onClick={(e) => { e.stopPropagation(); onChangeStatus(enquiry) }} aria-label="Change stage">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 11-3-6.7M21 3v6h-6" />
          </svg>
        </button>
      </div>

      {/* Expanded inline content */}
      {isExpanded && (
        <div className="card-expanded">
          {/* Action toolbar */}
          <div className="exp-toolbar">
            {enquiry.phone && (
              <a className="exp-tool" href={`tel:${enquiry.phone}`} onClick={(e) => e.stopPropagation()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                Call
              </a>
            )}
            {enquiry.phone && (
              <button className="exp-tool" onClick={(e) => { e.stopPropagation(); setSheet('templates') }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                SMS
              </button>
            )}
            {enquiry.phone && (
              <a className="exp-tool exp-tool-wa" href={whatsappHref(enquiry.phone, `Hi ${(enquiry.customer_name || '').split(' ')[0] || 'there'}, this is regarding your enquiry.`)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.149-.173.198-.298.297-.496.099-.198.05-.372-.025-.521-.074-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.298-1.04 1.016-1.04 2.479 0 1.463 1.065 2.876 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
                </svg>
                WhatsApp
              </a>
            )}
            {enquiry.appointment_datetime && (
              <button className="exp-tool" onClick={handleAddToCalendar}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Calendar
              </button>
            )}
            <button className="exp-tool" onClick={(e) => { e.stopPropagation(); setSheet('voice') }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
              Voice note
            </button>
            <button className="exp-tool" onClick={(e) => { e.stopPropagation(); onChangeStatus(enquiry) }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 11-3-6.7M21 3v6h-6" />
              </svg>
              Stage
            </button>
          </div>

          {/* Contact strip */}
          {(enquiry.phone || enquiry.email || bestTime) && (
            <div className="exp-contact">
              {enquiry.phone && (
                <div className="exp-line">
                  <span className="exp-label">Phone</span>
                  <a href={`tel:${enquiry.phone}`} className="exp-value-link">{enquiry.phone}</a>
                </div>
              )}
              {enquiry.email && (
                <div className="exp-line">
                  <span className="exp-label">Email</span>
                  <a href={`mailto:${enquiry.email}`} className="exp-value-link">{enquiry.email}</a>
                </div>
              )}
              {bestTime && (
                <div className="exp-line">
                  <span className="exp-label">Best time</span>
                  <span className="exp-value">{bestTime}</span>
                </div>
              )}
            </div>
          )}

          {/* Glance: service / urgency / intent / booking type */}
          <div className="exp-glance">
            {enquiry.service_requested && (
              <div className="exp-tile">
                <div className="exp-tile-label">Service</div>
                <div className="exp-tile-value">{enquiry.service_requested}</div>
              </div>
            )}
            {enquiry.urgency && (
              <div className="exp-tile" style={{ borderLeft: `3px solid ${urgency?.color || '#999'}` }}>
                <div className="exp-tile-label">Urgency</div>
                <div className="exp-tile-value" style={{ color: urgency?.color }}>{enquiry.urgency}</div>
              </div>
            )}
            {showIntent && (
              <div className="exp-tile exp-tile-wide">
                <div className="exp-tile-label">What they want</div>
                <div className="exp-tile-value">{enquiry.enquiry_intent}</div>
              </div>
            )}
            {enquiry.booking_type && (
              <div className="exp-tile">
                <div className="exp-tile-label">Booking type</div>
                <div className="exp-tile-value">{enquiry.booking_type}</div>
              </div>
            )}
            {enquiry.source && (
              <div className="exp-tile">
                <div className="exp-tile-label">Came from</div>
                <div className="exp-tile-value" style={{ color: 'var(--primary)' }}>{enquiry.source}</div>
              </div>
            )}
          </div>

          {/* Appointment calendar tile */}
          {apt && (
            <div className="appt-cal">
              <div className="appt-cal-body">
                <div className="appt-cal-date">
                  <div className="appt-cal-month">{apt.monthShort}</div>
                  <div className="appt-cal-day">{apt.dayNum}</div>
                  <div className="appt-cal-year">{apt.year}</div>
                </div>
                <div className="appt-cal-info">
                  <div className="appt-cal-dow">{apt.dayName}</div>
                  <div className="appt-cal-time">{apt.time}</div>
                  <div className="appt-cal-monthfull">{apt.monthFull} {apt.year}</div>
                </div>
              </div>
            </div>
          )}

          {/* Specialist questions */}
          {Array.isArray(enquiry.custom_answers) && enquiry.custom_answers.length > 0 && (
            <div className="specialist-card">
              <div className="specialist-header">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z" />
                </svg>
                Your specialist questions
              </div>
              <div className="info-card-body">
                {enquiry.custom_answers.map((qa, i) => (
                  <div className="qa-row" key={i}>
                    <div className="qa-question">{qa.question_text}</div>
                    <div className="qa-answer">{qa.answer || '-'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Media */}
          {enquiry.media_url && (
            <div className="media-card">
              <div className="info-card-header">Photo / Video</div>
              {isImage && (
                <a href={enquiry.media_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                  <img src={enquiry.media_url} alt="Uploaded" className="media-preview" />
                </a>
              )}
              {isVideo && <video src={enquiry.media_url} controls className="media-preview" />}
              {!isImage && !isVideo && (
                <a href={enquiry.media_url} target="_blank" rel="noopener noreferrer" className="media-link" onClick={(e) => e.stopPropagation()}>
                  View uploaded file ↗
                </a>
              )}
            </div>
          )}

          {/* Notes - includes voice transcriptions */}
          {enquiry.internal_notes && (
            <div className="info-card">
              <div className="info-card-header">Your notes</div>
              <div className="info-card-body">
                <div className="notes-text">
                  {enquiry.internal_notes.split('\n').map((line, i) => (
                    <div key={i}>{line || ' '}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Collapse hint */}
          <button className="exp-collapse" onClick={() => onToggle(enquiry)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15" />
            </svg>
            Collapse
          </button>
        </div>
      )}

      {sheet === 'templates' && (
        <TemplateSheet enquiry={enquiry} onClose={() => setSheet(null)} />
      )}
      {sheet === 'voice' && (
        <VoiceRecorder
          existing={enquiry.internal_notes || ''}
          onClose={() => setSheet(null)}
          onSave={(merged) => onSaveNotes(enquiry.id, merged)}
        />
      )}
    </div>
  )
}
