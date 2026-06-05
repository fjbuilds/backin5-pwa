import { formatCardDate } from '../lib/dates'
import { getActionColor } from '../lib/actionColors'

function urgencyMeta(urgency) {
  const u = (urgency || '').toLowerCase()
  if (u.includes('urgent') || u.includes('emergency')) return { color: 'var(--red)', label: 'Urgent' }
  if (u.includes('soon')) return { color: 'var(--amber)', label: 'ASAP' }
  if (u.includes('week')) return { color: 'var(--blue)', label: 'This week' }
  if (u) return { color: 'var(--green)', label: 'Flexible' }
  return null
}

export default function EnquiryCard({ enquiry, onOpen, onChangeStatus }) {
  const tag = enquiry.action_tag || enquiry.status || 'Review Details'
  const tagColor = getActionColor(tag)
  const town = enquiry.town || enquiry.area
  const urgency = urgencyMeta(enquiry.urgency)
  const bestTime = enquiry.preferred_contact_time || enquiry.next_action

  return (
    <div className="card-v2" style={{ borderLeft: `3px solid ${tagColor}` }}>
      <button className="card-v2-main" onClick={() => onOpen(enquiry)}>
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

        {enquiry.appointment_datetime && (
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
          <span className="card-v2-time">{formatCardDate(enquiry.created_at)}</span>
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
    </div>
  )
}
