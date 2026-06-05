import { useMemo, useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useEnquiries } from './hooks/useEnquiries'
import { useTradeStats } from './hooks/useClientStats'
import { useTheme } from './hooks/useTheme'
import LoginScreen from './components/LoginScreen'
import Header from './components/Header'
import StatsStrip from './components/StatsStrip'
import FilterChips from './components/FilterChips'
import EnquiryCard from './components/EnquiryCard'
import EnquiryDetail from './components/EnquiryDetail'
import StatusPicker from './components/StatusPicker'
import { groupKey, GROUP_LABELS, GROUP_ORDER } from './lib/dates'
import { DEMO_TRADE, DEMO_ENQUIRIES, DEMO_STATS } from './lib/demoData'

const IS_DEMO = new URLSearchParams(window.location.search).has('demo')

export default function App() {
  const { theme, toggle: toggleTheme } = useTheme()
  const { session, loading: authLoading, sendMagicLink, signOut } = useAuth()
  const { enquiries: liveEnquiries, loading, error, updateStatus, updateTag } = useEnquiries(IS_DEMO ? null : session)
  const { stats: liveStats, trade: liveTrade, refresh: refreshStats } = useTradeStats(IS_DEMO ? null : session)

  const enquiries = IS_DEMO ? DEMO_ENQUIRIES : liveEnquiries
  const stats = IS_DEMO ? DEMO_STATS : liveStats
  const trade = IS_DEMO ? DEMO_TRADE : liveTrade

  const [filter, setFilter] = useState('All')
  const [selected, setSelected] = useState(null)
  const [pickerFor, setPickerFor] = useState(null)
  const [demoOverrides, setDemoOverrides] = useState({})

  const displayEnquiries = IS_DEMO
    ? enquiries.map(e => demoOverrides[e.id] ? { ...e, ...demoOverrides[e.id] } : e)
    : enquiries

  const counts = useMemo(() => {
    const c = { 'Needs Action': 0, 'In Process': 0, 'Booked': 0 }
    for (const e of displayEnquiries) {
      if (c[e.status] != null) c[e.status]++
    }
    return c
  }, [displayEnquiries])

  const filtered = useMemo(() => {
    if (filter === 'All') return displayEnquiries
    return displayEnquiries.filter((e) => e.status === filter)
  }, [displayEnquiries, filter])

  const grouped = useMemo(() => {
    const buckets = { today: [], yesterday: [], week: [], older: [] }
    for (const e of filtered) {
      buckets[groupKey(e.created_at)].push(e)
    }
    return buckets
  }, [filtered])

  // In demo mode, skip the auth loading spinner entirely
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
    return <LoginScreen sendMagicLink={sendMagicLink} />
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
      <FilterChips active={filter} counts={counts} onChange={setFilter} />

      <div className="feed">
        {filtered.length === 0 ? (
          <div className="empty">
            {loading ? 'Loading enquiries…' : 'No enquiries yet.'}
          </div>
        ) : (
          GROUP_ORDER.map((g) => {
            const items = grouped[g]
            if (!items.length) return null
            return (
              <section key={g} className="feed-group">
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
