import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Stats (counts) are computed live from enquiries in App.jsx — we no longer
// query the stale `business_stats` view. This hook just resolves the trade
// (business) the signed-in user belongs to, so the Header can show its name.
export function useTradeStats(session) {
  const [trade, setTrade] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchAll = useCallback(async ({ silent = false } = {}) => {
    if (!session) return
    if (!silent) setLoading(true)
    // The dashboard schema uses `trades`, not `businesses`.
    // Pick the first row the signed-in user can see (RLS-scoped).
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .limit(1)
      .maybeSingle()
    if (!error) setTrade(data)
    if (!silent) setLoading(false)
  }, [session])

  useEffect(() => { fetchAll() }, [fetchAll])

  useEffect(() => {
    if (!session) return
    const id = setInterval(() => fetchAll({ silent: true }), 60_000)
    return () => clearInterval(id)
  }, [session, fetchAll])

  return { trade, loading, refresh: fetchAll }
}
