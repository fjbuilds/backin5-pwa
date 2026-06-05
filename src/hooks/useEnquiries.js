import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useEnquiries(session) {
  const [enquiries, setEnquiries] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchEnquiries = useCallback(async ({ silent = false } = {}) => {
    if (!session) return
    if (!silent) setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('enquiries')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      setError(error.message)
    } else {
      setEnquiries(data || [])
    }
    if (!silent) setLoading(false)
  }, [session])

  useEffect(() => {
    fetchEnquiries()
  }, [fetchEnquiries])

  useEffect(() => {
    if (!session) return
    const id = setInterval(() => fetchEnquiries({ silent: true }), 30_000)
    return () => clearInterval(id)
  }, [session, fetchEnquiries])

  const updateStatus = useCallback(async (id, status) => {
    setEnquiries((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)))
    const { error } = await supabase
      .from('enquiries')
      .update({ status })
      .eq('id', id)
    if (error) {
      setError(error.message)
      fetchEnquiries()
    }
  }, [fetchEnquiries])

  const updateTag = useCallback(async (id, field, value) => {
    setEnquiries((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)))
    const { error } = await supabase
      .from('enquiries')
      .update({ [field]: value })
      .eq('id', id)
    if (error) {
      setError(error.message)
      fetchEnquiries()
    }
  }, [fetchEnquiries])

  return { enquiries, loading, error, refresh: fetchEnquiries, updateStatus, updateTag }
}
