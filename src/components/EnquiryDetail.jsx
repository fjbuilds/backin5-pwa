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
          Missed call — we caught this for you
        </div>
      )}

      <div className="detail-section">
        {enquiry.customer_phone && (
          <div className="field-row">
            <span className="label">Phone</span>
            <span className="value">
              <a href={`tel:${enquiry.customer_phone}`}>{enquiry.customer_phone}</a>
            </span>
          </div>
        )}
        {enquiry.customer_email && (
          <div className="field-row">
            <span className="label">Email</span>
            <span className="value">
              <a href={`mailto:${enquiry.customer_email}`}>{enquiry.customer_email}</a>
            </span>
          </div>
        )}
        {enquiry.service_requested && (
          <div className="field-row">
            <span className="label">Service</span>
            <span className="value">{enquiry.service_requested}</span>
          </div>
        )}
        {enquiry.job_description && (
          <div className="field-row">
            <span className="label">Job</span>
            <span className="value">{enquiry.job_description}</span>
          </div>
        )}
        {enquiry.postcode && (
          <div className="field-row">
            <span className="label">Postcode</span>
            <span className="value">{enquiry.postcode}</span>
          </div>
        )}
        {enquiry.town && (
          <div className="field-row">
            <span className="label">Town</span>
            <span className="value">{enquiry.town}</span>
          </div>
        )}
        {enquiry.urgency && (
          <div className="field-row">
            <span className="label">Urgency</span>
            <span className="value">{enquiry.urgency}</span>
          </div>
        )}
        {enquiry.source && (
          <div className="field-row">
            <span className="label">Source</span>
            <span className="value">{enquiry.source}</span>
          </div>
        )}
        {enquiry.enquiry_intent && (
          <div className="field-row">
            <span className="label">Intent</span>
            <span className="value">{enquiry.enquiry_intent}</span>
          </div>
        )}
        {enquiry.preferred_contact_time && (
          <div className="field-row">
            <span className="label">Best time to call</span>
            <span className="value">{enquiry.preferred_contact_time}</span>
          </div>
        )}
      </div>

      {enquiry.appointment_datetime && (
        <div className="detail-section" style={{ marginTop: 12 }}>
          <div className="field-row">
            <span className="label">Appointment</span>
            <span className="value">{new Date(enquiry.appointment_datetime).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</span>
          </div>
        </div>
      )}

      {(enquiry.custom_question_1 || enquiry.custom_question_2 || enquiry.custom_question_3) && (
        <div className="detail-section" style={{ marginTop: 12 }}>
          {enquiry.custom_question_1 && (
            <div className="field-row">
              <span className="label">{enquiry.custom_question_1}</span>
              <span className="value">{enquiry.custom_answer_1 || '—'}</span>
            </div>
          )}
          {enquiry.custom_question_2 && (
            <div className="field-row">
              <span className="label">{enquiry.custom_question_2}</span>
              <span className="value">{enquiry.custom_answer_2 || '—'}</span>
            </div>
          )}
          {enquiry.custom_question_3 && (
            <div className="field-row">
              <span className="label">{enquiry.custom_question_3}</span>
              <span className="value">{enquiry.custom_answer_3 || '—'}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
