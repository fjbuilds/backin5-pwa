const STATUS_COLOURS = {
  'Needs Action': { key: 'needs-action', color: '#5B8DEF' },
  'In Process':   { key: 'in-process',   color: '#C9802B' },
  'Booked':       { key: 'booked',       color: '#2F9E6B' },
  'Archived':     { key: 'archived',     color: '#5B6273' }
}

export function getStatusColor(status) {
  return STATUS_COLOURS[status]?.color || '#6B7FA3'
}

export function getStatusKey(status) {
  return STATUS_COLOURS[status]?.key || 'archived'
}

export default function StatusPill({ status, tag, onClick }) {
  const color = getStatusColor(status)
  const label = tag || status

  return (
    <button
      className="status-pill"
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
      aria-label={`Change status, currently ${label}`}
    >
      <span className="dot" style={{ background: color }} />
      <span style={{ color }}>{label}</span>
      <span className="arrow">▾</span>
    </button>
  )
}
