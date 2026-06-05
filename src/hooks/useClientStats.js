import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useTradeStats(session) {
  const [stats, setStats] = useState(null)
  const [trade, setTrade] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchAll = useCallback(async ({ silent = false } = {}) => {
    if (!session) return
    if (!silent) setLoading(true)
    const [statsRes, bizRes] = await Promise.all([
      supabase.from('business_stats').select('*').maybeSingle(),
      supabase.from('businesses').select('*').maybeSingle()
    ])
    if (!statsRes.error) setStats(statsRes.data)
    if (!bizRes.error) setTrade(bizRes.data)
    if (!silent) setLoading(false)
  }, [session])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  useEffect(() => {
    if (!session) return
    const id = setInterval(() => fetchAll({ silent: true }), 30_000)
    return () => clearInterval(id)
  }, [session, fetchAll])

  return { stats, trade, loading, refresh: fetchAll }
}
