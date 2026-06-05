import { useMemo, useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useEnquiries } from './hooks/useEnquiries'
import { useTradeStats } from './hooks/useClientStats'
import { useTheme } from './hooks/useTheme'
import LoginScreen from './components/LoginScreen'
import Header from './components/Header'
import StatsStrip from './components/StatsStrip'
import FilterChips from './components/FilterChips'
import DateFilter from './components/DateFilter'
import MapView from './components/MapView'
import EnquiryCard from './components/EnquiryCard'
import EnquiryDetail from './components/EnquiryDetail'
import StatusPicker from './components/StatusPicker'
import { groupKey, GROUP_LABELS, GROUP_ORDER } from './lib/dates'
import { getActionColor } from './lib/actionColors'
import { DEMO_TRADE, DEMO_ENQUIRIES, DEMO_STATS } from './lib/demoData'

const IS_DEMO = new URLSearchParams(window.location.search).has('demo')

export default function App() {
  const { theme, toggle: toggleTheme } = useTheme()
  const { session, loading: authLoading, sendMagicLink, signInWithPassword, signOut } = useAuth()
  const { enquiries: liveEnquiries, loading, error, updateStatus, updateTag } = useEnquiries(IS_DEMO ? null : session)
  const { trade: liveTrade, refresh: refreshStats } = useTradeStats(IS_DEMO ? null : session)

  const enquiries = IS_DEMO ? DEMO_ENQUIRIES : liveEnquiries
  const trade = IS_DEMO ? DEMO_TRADE : liveTrade

  const [filter, setFilter] = useState('All')
  const [selected, setSelected] = useState(null)
  const [pickerFor, setPickerFor] = useState(null)
  const [demoOverrides, setDemoOverrides] = useState({})
  const [dateRange, setDateRange] = useState({ from: null, to: null })
  const [view, setView] = useState('list') // 'list' | 'map'

  const displayEnquiries = IS_DEMO
    ? enquiries.map(e => demoOverrides[e.id] ? { ...e, ...demoOverrides[e.id] } : e)
    : enquiries

  // Apply date range filter first
  const dateFiltered = useMemo(() => {
    if (!dateRange.from && !dateRange.to) return displayEnquiries
    return displayEnquiries.filter(e => {
      const t = new Date(e.created_at).getTime()
      if (dateRange.from && t < dateRange.from.getTime()) return false
      if (dateRange.to && t > dateRange.to.getTime()) return false
      return true
    })
  }, [displayEnquiries, dateRange])

  // Counts based on date-filtered set (so tabs reflect what user sees)
  const counts = useMemo(() => {
    const c = { 'Needs Action': 0, 'In Process': 0, 'Booked': 0 }
    for (const e of dateFiltered) {
      if (c[e.status] != null) c[e.status]++
    }
    return c
  }, [dateFiltered])

  // Top stats — live from enquiries, not from cached view
  const liveStats = useMemo(() => ({
    total_enquiries:     dateFiltered.length,
    needs_action_count:  counts['Needs Action'],
    booked_count:        counts['Booked'],
  }), [dateFiltered, counts])

  const stats = IS_DEMO ? DEMO_STATS : liveStats

  const filtered = useMemo(() => {
    if (filter === 'All') return dateFiltered
    return dateFiltered.filter((e) => e.status === filter)
  }, [dateFiltered, filter])

  const grouped = useMemo(() => {
    const buckets = { today: [], yesterday: [], week: [], older: [] }
    for (const e of filtered) {
      buckets[groupKey(e.created_at)].push(e)
    }
    return buckets
  }, [filtered])

  // "All" view groups by action tag (oranges with oranges, purples with purples).
  // Priority order: Needs Action types first, then In Process, then Booked.
  const TAG_ORDER = [
    'Call Back','Reply Required','Quote Required','Visit Required','Review Details',
    'Contacted','Waiting on Customer','Quote Sent','Appointment Agreed','Awaiting Confirmation',
    'Job Booked','Callback Booked','Visit Booked','Quote Accepted',
  ]
  const groupedByTag = useMemo(() => {
    const map = new Map()
    for (const e of filtered) {
      const tag = e.action_tag || e.status || 'Other'
      if (!map.has(tag)) map.set(tag, [])
      map.get(tag).push(e)
    }
    // Sort each group newest first
    for (const arr of map.values()) {
      arr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }
    // Return in priority order, then any tags we didn't expect
    const ordered = []
    for (const tag of TAG_ORDER) {
      if (map.has(tag)) { ordered.push([tag, map.get(tag)]); map.delete(tag) }
    }
    for (const [tag, arr] of map) ordered.push([tag, arr])
    return ordered
  }, [filtered])

  if (authLoading && !IS_DEMO) {
    return (
      <div className="app-shell">
        <div className="login">
          <div className="spinner" />
        </div>
      </div>
    )
  }

  if (!session && !IS_DEMO) {
    return <LoginScreen sendMagicLink={sendMagicLink} signInWithPassword={signInWithPassword} />
  }

  function handleStatusUpdate({ status, tagField, tagValue }) {
    if (!pickerFor) return
    const updates = { status, action_tag: tagValue || null }

    if (IS_DEMO) {
      setDemoOverrides(prev => ({ ...prev, [pickerFor.id]: updates }))
      if (selected && selected.id === pickerFor.id) {
        setSelected({ ...selected, ...updates })
      }
      setPickerFor(null)
      return
    }

    updateStatus(pickerFor.id, status)
    updateTag(pickerFor.id, 'action_tag', tagValue || null)
    if (selected && selected.id === pickerFor.id) {
      setSelected({ ...selected, ...updates })
    }
    setPickerFor(null)
    refreshStats({ silent: true })
  }

  if (selected) {
    return (
      <div className="app-shell">
        <Header trade={trade} onLogout={signOut} theme={theme} onToggleTheme={toggleTheme} />
        <EnquiryDetail
          enquiry={selected}
          onBack={() => setSelected(null)}
          onChangeStatus={(enq) => setPickerFor(enq)}
        />
        {pickerFor && (
          <StatusPicker
            enquiry={pickerFor}
            onUpdate={handleStatusUpdate}
            onClose={() => setPickerFor(null)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Header trade={trade} onLogout={signOut} theme={theme} onToggleTheme={toggleTheme} />

      {error && <div className="error-banner">{error}</div>}

      <StatsStrip stats={stats} />

      <div className="date-filter-bar">
        <DateFilter range={dateRange} onChange={setDateRange} />
        <div className="view-toggle" role="tablist" aria-label="View">
          <button
            role="tab"
            aria-selected={view === 'list'}
            className={`view-toggle-btn ${view === 'list' ? 'active' : ''}`}
            onClick={() => setView('list')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            List
          </button>
          <button
            role="tab"
            aria-selected={view === 'map'}
            className={`view-toggle-btn ${view === 'map' ? 'active' : ''}`}
            onClick={() => setView('map')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line x1="8" y1="2" x2="8" y2="18" />
              <line x1="16" y1="6" x2="16" y2="22" />
            </svg>
            Map
          </button>
        </div>
      </div>

      <FilterChips active={filter} counts={counts} onChange={setFilter} />

      {view === 'map' ? (
        <MapView enquiries={filtered} onOpen={setSelected} />
      ) : (
      <div className="feed">
        {filtered.length === 0 ? (
          <div className="empty">
            {loading ? 'Loading enquiries…' : 'No enquiries match.'}
          </div>
        ) : filter === 'All' ? (
          groupedByTag.map(([tag, items]) => (
            <section key={tag} className="feed-group anim-stagger">
              <div className="feed-group-header tag-group-header">
                <span className="tag-dot" style={{ background: getActionColor(tag) }} />
                {tag}
                <span className="tag-count">{items.length}</span>
              </div>
              {items.map((enq) => (
                <EnquiryCard
                  key={enq.id}
                  enquiry={enq}
                  onOpen={setSelected}
                  onChangeStatus={(e) => setPickerFor(e)}
                />
              ))}
            </section>
          ))
        ) : (
          GROUP_ORDER.map((g) => {
            const items = grouped[g]
            if (!items.length) return null
            return (
              <section key={g} className="feed-group anim-stagger">
                <div className="feed-group-header">{GROUP_LABELS[g]}</div>
                {items.map((enq) => (
                  <EnquiryCard
                    key={enq.id}
                    enquiry={enq}
                    onOpen={setSelected}
                    onChangeStatus={(e) => setPickerFor(e)}
                  />
                ))}
              </section>
            )
          })
        )}
      </div>
      )}

      {pickerFor && (
        <StatusPicker
          enquiry={pickerFor}
          onUpdate={handleStatusUpdate}
          onClose={() => setPickerFor(null)}
        />
      )}
    </div>
  )
}
