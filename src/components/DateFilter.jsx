import { useEffect, useState, useMemo } from 'react'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

function startOfDay(d) { const x = new Date(d); x.setHours(0,0,0,0); return x }
function endOfDay(d)   { const x = new Date(d); x.setHours(23,59,59,999); return x }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x }
function sameDate(a, b) { return a && b && a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate() }
function fmtShort(d) {
  if (!d) return ''
  return `${String(d.getDate()).padStart(2,'0')} ${MONTHS[d.getMonth()].slice(0,3)}`
}
function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate() }
function getFirstDayOffset(y, m) { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1 }

const PRESETS = [
  { key: 'today',     label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'week',      label: 'Last 7 days' },
  { key: 'month',     label: 'This month' },
  { key: 'all',       label: 'All time' },
]

function rangeForPreset(preset) {
  const now = new Date()
  if (preset === 'today')     return { from: startOfDay(now), to: endOfDay(now) }
  if (preset === 'yesterday') { const y = addDays(now, -1); return { from: startOfDay(y), to: endOfDay(y) } }
  if (preset === 'week')      return { from: startOfDay(addDays(now, -6)), to: endOfDay(now) }
  if (preset === 'month')     {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return { from: startOfDay(start), to: endOfDay(now) }
  }
  return { from: null, to: null }
}

export default function DateFilter({ range, onChange }) {
  const [open, setOpen] = useState(false)
  const [activePreset, setActivePreset] = useState('all')
  const [viewMonth, setViewMonth] = useState(new Date().getMonth())
  const [viewYear, setViewYear] = useState(new Date().getFullYear())
  const [pickFrom, setPickFrom] = useState(range?.from ?? null)
  const [pickTo, setPickTo] = useState(range?.to ?? null)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const label = useMemo(() => {
    if (!range?.from && !range?.to) return 'All time'
    if (range.from && range.to && sameDate(range.from, range.to)) {
      return sameDate(range.from, new Date()) ? 'Today' : fmtShort(range.from)
    }
    return `${fmtShort(range.from)} - ${fmtShort(range.to)}`
  }, [range])

  function applyPreset(key) {
    const r = rangeForPreset(key)
    setActivePreset(key)
    setPickFrom(r.from); setPickTo(r.to)
    onChange(r)
    setOpen(false)
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  function pickDay(day) {
    const d = startOfDay(new Date(viewYear, viewMonth, day))
    if (!pickFrom || (pickFrom && pickTo)) {
      setPickFrom(d); setPickTo(null)
    } else if (d < pickFrom) {
      setPickFrom(d)
    } else {
      setPickTo(endOfDay(d))
      setActivePreset(null)
    }
  }

  function applyCustom() {
    if (pickFrom && pickTo) {
      onChange({ from: pickFrom, to: pickTo })
      setOpen(false)
    } else if (pickFrom) {
      onChange({ from: pickFrom, to: endOfDay(pickFrom) })
      setOpen(false)
    }
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstOffset = getFirstDayOffset(viewYear, viewMonth)
  const cells = [...Array(firstOffset).fill(null), ...Array.from({length: daysInMonth}, (_, i) => i + 1)]

  return (
    <>
      <button className="date-filter-trigger" onClick={() => setOpen(true)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        {label}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <>
          <div className="sheet-backdrop" onClick={() => setOpen(false)} />
          <div className="sheet date-sheet" role="dialog" aria-label="Filter by date">
            <div className="handle" />
            <h3>Filter by date</h3>

            <div className="date-presets">
              {PRESETS.map(p => (
                <button
                  key={p.key}
                  className={`date-preset ${activePreset === p.key ? 'active' : ''}`}
                  onClick={() => applyPreset(p.key)}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="date-cal">
              <div className="date-cal-head">
                <button className="date-cal-nav" onClick={prevMonth}>‹</button>
                <span className="date-cal-month">{MONTHS[viewMonth]} {viewYear}</span>
                <button className="date-cal-nav" onClick={nextMonth}>›</button>
              </div>
              <div className="date-cal-grid">
                {DAYS.map(d => <div key={d} className="date-cal-dayhead">{d}</div>)}
                {cells.map((day, i) => {
                  if (!day) return <div key={`e-${i}`} />
                  const d = startOfDay(new Date(viewYear, viewMonth, day))
                  const isFrom = pickFrom && sameDate(d, pickFrom)
                  const isTo   = pickTo && sameDate(d, pickTo)
                  const inRange = pickFrom && pickTo && d > pickFrom && d < pickTo
                  return (
                    <button
                      key={day}
                      className={`date-cal-day ${isFrom ? 'edge' : ''} ${isTo ? 'edge' : ''} ${inRange ? 'in' : ''}`}
                      onClick={() => pickDay(day)}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="date-actions">
              <button className="sheet-cancel" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn-primary" disabled={!pickFrom} onClick={applyCustom}>Apply</button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
