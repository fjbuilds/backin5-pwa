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
        {enquiry.town && (
          <>
            <span className="meta-sep">·</span>
            <span className="meta-tag">{enquiry.town}</span>
          </>
        )}
        {enquiry.service_requested && (
          <>
            <span className="meta-sep">·</span>
            <span className="meta-tag">{enquiry.service_requested}</span>
          </>
        )}
      </div>
    </button>
  )
}
