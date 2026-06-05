export default function StatsStrip({ stats }) {
  const total = stats?.total_enquiries ?? 0
  const needsAction = stats?.needs_action_count ?? 0
  const booked = stats?.booked_count ?? 0

  return (
    <div className="stats-strip">
      <div className="stat-item blue">
        <div className="value">{total}</div>
        <div className="label">Enquiries</div>
      </div>
      <div className="stat-item amber">
        <div className="value">{needsAction}</div>
        <div className="label">Needs action</div>
      </div>
      <div className="stat-item green">
        <div className="value">{booked}</div>
        <div className="label">Booked</div>
      </div>
    </div>
  )
}
