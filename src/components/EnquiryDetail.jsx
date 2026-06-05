import { getStatusColor } from './StatusPill'
import { formatCardDate } from '../lib/dates'

function urgencyColor(urgency) {
  const u = (urgency || '').toLowerCase()
  if (u.includes('urgent') || u.includes('emergency')) return 'var(--red)'
  if (u.includes('soon')) return 'var(--amber)'
  if (u.includes('week')) return 'var(--blue)'
  return 'var(--green)'
}

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTHS_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS_FULL    = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

// Parses widget format: "2026-06-25 at 11:00am"
function parseAppointment(str) {
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

export default function EnquiryDetail({ enquiry, onBack, onChangeStatus }) {
  const isMissedCall = enquiry.source === 'Missed Call'
  const statusLabel = enquiry.action_tag || enquiry.status
  const statusColor = getStatusColor(enquiry.status)
  const town = enquiry.town || enquiry.area
  const bestTime = enquiry.preferred_contact_time || enquiry.next_action
  const apt = parseAppointment(enquiry.appointment_datetime)

  // Hide "What they want" if it's "book directly" — appointment already conveys that
  const intentLower = (enquiry.enquiry_intent || '').toLowerCase()
  const showIntent = enquiry.enquiry_intent && !intentLower.includes('book directly')

  const isImage = enquiry.media_url && enquiry.media_url.match(/\.(jpg|jpeg|png|gif|webp|heic)$/i)
  const isVideo = enquiry.media_url && enquiry.media_url.match(/\.(mp4|mov|webm)$/i)

  return (
    <div className="detail-v2">
      <button className="back-btn" onClick={onBack}>← Back</button>

      {/* Hero */}
      <div className="hero-card">
        <div className="hero-top">
          <div>
            <div className="hero-name">{enquiry.customer_name || 'Unknown'}</div>
            <div className="hero-meta">{formatCardDate(enquiry.created_at)}{enquiry.source ? ` · ${enquiry.source}` : ''}</div>
          </div>
          <span className="hero-status-pill" style={{ background: `${statusColor}22`, color: statusColor }}>
            {statusLabel}
          </span>
        </div>

        {/* Quick actions */}
        <div className="quick-actions">
          {enquiry.phone && (
            <a className="qa-btn qa-btn-primary" href={`tel:${enquiry.phone}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              Call
            </a>
          )}
          {enquiry.email && (
            <a className="qa-btn" href={`mailto:${enquiry.email}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 7l9 6 9-6" />
              </svg>
              Email
            </a>
          )}
          <button className="qa-btn" onClick={() => onChangeStatus(enquiry)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 11-3-6.7M21 3v6h-6" />
            </svg>
            Stage
          </button>
        </div>

        <div className="contact-strip">
          {enquiry.phone && (
            <div className="contact-line">
              <span className="contact-label">Phone</span>
              <a href={`tel:${enquiry.phone}`} className="contact-value">{enquiry.phone}</a>
            </div>
          )}
          {enquiry.email && (
            <div className="contact-line">
              <span className="contact-label">Email</span>
              <a href={`mailto:${enquiry.email}`} className="contact-value">{enquiry.email}</a>
            </div>
          )}
          {bestTime && (
            <div className="contact-line">
              <span className="contact-label">Best time</span>
              <span className="contact-value">{bestTime}</span>
            </div>
          )}
        </div>
      </div>

      {isMissedCall && (
        <div className="missed-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          Missed call - we caught this for you
        </div>
      )}

      {/* At a glance grid */}
      <div className="glance-grid">
        {enquiry.service_requested && (
          <div className="glance-card">
            <div className="glance-label">Service</div>
            <div className="glance-value">{enquiry.service_requested}</div>
          </div>
        )}
        {enquiry.urgency && (
          <div className="glance-card" style={{ borderLeft: `3px solid ${urgencyColor(enquiry.urgency)}` }}>
            <div className="glance-label">Urgency</div>
            <div className="glance-value" style={{ color: urgencyColor(enquiry.urgency) }}>{enquiry.urgency}</div>
          </div>
        )}
        {showIntent && (
          <div className="glance-card glance-wide">
            <div className="glance-label">What they want</div>
            <div className="glance-value">{enquiry.enquiry_intent}</div>
          </div>
        )}
        {enquiry.booking_type && (
          <div className="glance-card">
            <div className="glance-label">Booking type</div>
            <div className="glance-value">{enquiry.booking_type}</div>
          </div>
        )}
      </div>

      {/* Location */}
      {(enquiry.postcode || town) && (
        <div className="info-card">
          <div className="info-card-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Location
          </div>
          <div className="info-card-body">
            {enquiry.postcode && (
              <div className="kv-row">
                <span className="kv-label">Postcode</span>
                <span className="kv-value">{enquiry.postcode}</span>
              </div>
            )}
            {town && (
              <div className="kv-row">
                <span className="kv-label">Town</span>
                <span className="kv-value">{town}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Appointment - calendar tile */}
      {apt && (
        <div className="appt-cal">
          <div className="appt-cal-head">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Requested appointment
          </div>
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
      {!apt && enquiry.appointment_datetime && (
        <div className="appointment-card">
          <div className="appt-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div className="appt-body">
            <div className="appt-label">Requested appointment</div>
            <div className="appt-value">{enquiry.appointment_datetime}</div>
          </div>
        </div>
      )}

      {/* Specialist questions (custom_answers) - placed above media, amber accent */}
      {Array.isArray(enquiry.custom_answers) && enquiry.custom_answers.length > 0 && (
        <div className="specialist-card">
          <div className="specialist-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

      {/* Photo / Video */}
      {enquiry.media_url && (
        <div className="media-card">
          <div className="info-card-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            Photo / Video
          </div>
          {isImage && (
            <a href={enquiry.media_url} target="_blank" rel="noopener noreferrer">
              <img src={enquiry.media_url} alt="Uploaded" className="media-preview" />
            </a>
          )}
          {isVideo && (
            <video src={enquiry.media_url} controls className="media-preview" />
          )}
          {!isImage && !isVideo && (
            <a href={enquiry.media_url} target="_blank" rel="noopener noreferrer" className="media-link">
              View uploaded file ↗
            </a>
          )}
        </div>
      )}

      {/* Notes */}
      {enquiry.job_description && (
        <div className="info-card">
          <div className="info-card-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            Notes
          </div>
          <div className="info-card-body">
            <div className="notes-text">
              {enquiry.job_description.split('\n').map((line, i) => (
                <div key={i}>{line || ' '}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
