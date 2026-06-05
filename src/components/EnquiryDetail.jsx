import { getStatusColor } from './StatusPill'
import { formatCardDate } from '../lib/dates'

export default function EnquiryDetail({ enquiry, onBack, onChangeStatus }) {
  const isMissedCall = enquiry.source === 'Missed Call'
  const statusLabel = enquiry.action_tag || enquiry.status
  const color = getStatusColor(enquiry.status)

  return (
    <div className="detail">
      <button className="back-btn" onClick={onBack}>← Back</button>

      <div className="detail-header">
        <div>
          <div className="name">{enquiry.customer_name || 'Unknown'}</div>
          <div className="meta">{formatCardDate(enquiry.created_at)}</div>
        </div>
        <button
          className="status-text"
          style={{ color }}
          onClick={() => onChangeStatus(enquiry)}
        >
          {statusLabel} ›
        </button>
      </div>

      {isMissedCall && (
        <div className="missed-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          Missed call - we caught this for you
        </div>
      )}

      {/* Contact details */}
      <div className="detail-section">
        <div className="section-title">Contact</div>
        {enquiry.phone && (
          <div className="field-row">
            <span className="label">Phone</span>
            <span className="value">
              <a href={`tel:${enquiry.phone}`}>{enquiry.phone}</a>
            </span>
          </div>
        )}
        {enquiry.email && (
          <div className="field-row">
            <span className="label">Email</span>
            <span className="value">
              <a href={`mailto:${enquiry.email}`}>{enquiry.email}</a>
            </span>
          </div>
        )}
        {(enquiry.preferred_contact_time || enquiry.next_action) && (
          <div className="field-row">
            <span className="label">Best time to call</span>
            <span className="value">{enquiry.preferred_contact_time || enquiry.next_action}</span>
          </div>
        )}
      </div>

      {/* Enquiry details */}
      <div className="detail-section" style={{ marginTop: 12 }}>
        <div className="section-title">Enquiry</div>
        {enquiry.service_requested && (
          <div className="field-row">
            <span className="label">Service</span>
            <span className="value">{enquiry.service_requested}</span>
          </div>
        )}
        {enquiry.action_tag && (
          <div className="field-row">
            <span className="label">What they want</span>
            <span className="value">{enquiry.action_tag}</span>
          </div>
        )}
        {enquiry.urgency && (
          <div className="field-row">
            <span className="label">Urgency</span>
            <span className="value">{enquiry.urgency}</span>
          </div>
        )}
        {enquiry.enquiry_intent && (
          <div className="field-row">
            <span className="label">Intent</span>
            <span className="value">{enquiry.enquiry_intent}</span>
          </div>
        )}
        {enquiry.postcode && (
          <div className="field-row">
            <span className="label">Postcode</span>
            <span className="value">{enquiry.postcode}</span>
          </div>
        )}
        {(enquiry.town || enquiry.area) && (
          <div className="field-row">
            <span className="label">Town</span>
            <span className="value">{enquiry.town || enquiry.area}</span>
          </div>
        )}
        {enquiry.source && (
          <div className="field-row">
            <span className="label">Source</span>
            <span className="value">{enquiry.source}</span>
          </div>
        )}
      </div>

      {/* Custom Q&A from widget */}
      {Array.isArray(enquiry.custom_answers) && enquiry.custom_answers.length > 0 && (
        <div className="detail-section" style={{ marginTop: 12 }}>
          <div className="section-title">Additional details</div>
          {enquiry.custom_answers.map((qa, i) => (
            <div className="field-row" key={i}>
              <span className="label">{qa.question_text}</span>
              <span className="value">{qa.answer || '—'}</span>
            </div>
          ))}
        </div>
      )}

      {/* Appointment */}
      {enquiry.appointment_datetime && (
        <div className="detail-section" style={{ marginTop: 12 }}>
          <div className="section-title">Appointment</div>
          <div className="field-row">
            <span className="label">Requested slot</span>
            <span className="value">{enquiry.appointment_datetime}</span>
          </div>
        </div>
      )}

      {/* Notes / custom answers */}
      {enquiry.job_description && (
        <div className="detail-section" style={{ marginTop: 12 }}>
          <div className="section-title">Notes</div>
          <div className="notes-block">
            {enquiry.job_description.split('\n').map((line, i) => (
              <div key={i} className="notes-line">{line}</div>
            ))}
          </div>
        </div>
      )}

      {/* Photo */}
      {enquiry.media_url && (
        <div className="detail-section" style={{ marginTop: 12 }}>
          <div className="section-title">Photo / Video</div>
          <div className="field-row">
            <a href={enquiry.media_url} target="_blank" rel="noopener noreferrer" className="media-link">
              View uploaded file ↗
            </a>
          </div>
          {enquiry.media_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
            <img src={enquiry.media_url} alt="Uploaded" className="media-thumb" />
          )}
        </div>
      )}
    </div>
  )
}
