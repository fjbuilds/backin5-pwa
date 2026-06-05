export const STATUSES = ['All', 'Needs Action', 'In Process', 'Booked']

export default function FilterChips({ active, counts, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {STATUSES.map((s) => {
        const count = s === 'All'
          ? Object.values(counts).reduce((a, b) => a + b, 0)
          : (counts[s] || 0)
        return (
          <button
            key={s}
            role="tab"
            aria-selected={active === s}
            className={`tab ${active === s ? 'active' : ''}`}
            onClick={() => onChange(s)}
          >
            {s}<span className="count">{count}</span>
          </button>
        )
      })}
    </div>
  )
}
