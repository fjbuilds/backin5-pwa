import { getStatusColor } from './StatusPill'
import { getSourceColor } from '../lib/sourceColors'
import { formatCardDate } from '../lib/dates'

export default function EnquiryCard({ enquiry, onOpen, onChangeStatus }) {
  const color = getStatusColor(enquiry.status)
  const sourceColor = getSourceColor(enquiry.source)
  const statusLabel = enquiry.action_tag || enquiry.status

  return (
    <button className="enquiry-row" onClick={() => onOpen(enquiry)}>
      <div className="top">
        <span className="customer">{enquiry.customer_name || 'Unknown'}</span>
        <span
          className="status-text"
          style={{ color }}
          onClick={(e) => { e.stopPropagation(); onChangeStatus(enquiry) }}
        >
          {statusLabel} ›
        </span>
      </div>

      <div className="card-fields">
        {enquiry.service_requested && (
          <span className="card-field">
            <span className="card-field-label">Service</span>
            <span className="card-field-value">{enquiry.service_requested}</span>
          </span>
        )}
        {enquiry.phone && (
          <span className="card-field">
            <span className="card-field-label">Phone</span>
            <span className="card-field-value">{enquiry.phone}</span>
          </span>
        )}
        {enquiry.postcode && (
          <span className="card-field">
            <span className="card-field-label">Postcode</span>
            <span className="card-field-value">{enquiry.postcode}</span>
          </span>
        )}
        {(enquiry.town || enquiry.area) && (
          <span className="card-field">
            <span className="card-field-label">Town</span>
            <span className="card-field-value">{enquiry.town || enquiry.area}</span>
          </span>
        )}
        {enquiry.urgency && (
          <span className="card-field">
            <span className="card-field-label">Urgency</span>
            <span className="card-field-value">{enquiry.urgency}</span>
          </span>
        )}
        {(enquiry.preferred_contact_time || enquiry.next_action) && (
          <span className="card-field">
            <span className="card-field-label">Best time</span>
            <span className="card-field-value">{enquiry.preferred_contact_time || enquiry.next_action}</span>
          </span>
        )}
        {enquiry.appointment_datetime && (
          <span className="card-field">
            <span className="card-field-label">Appointment</span>
            <span className="card-field-value">{enquiry.appointment_datetime}</span>
          </span>
        )}
      </div>

      {enquiry.job_description && (
        <div className="desc">{enquiry.job_description}</div>
      )}

      <div className="meta">
        <span className="time">{formatCardDate(enquiry.created_at)}</span>
        {enquiry.source && (
          <>
            <span className="meta-sep">·</span>
            <span className="source-tag" style={{ color: sourceColor }}>
              {enquiry.source}
            </span>
          </>
        )}
      </div>
    </button>
  )
}
