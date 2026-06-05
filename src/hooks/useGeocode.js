import { useEffect, useState } from 'react'

// Uses postcodes.io — free, no API key, UK postcodes only.
// Caches in memory + localStorage to avoid re-fetching.

const STORAGE_KEY = 'bi5_postcode_cache_v1'
const memCache = new Map()

function loadCache() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const obj = JSON.parse(raw)
      for (const k in obj) memCache.set(k, obj[k])
    }
  } catch {}
}
loadCache()

function saveCache() {
  try {
    const obj = {}
    for (const [k, v] of memCache) obj[k] = v
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj))
  } catch {}
}

function normalisePostcode(pc) {
  return (pc || '').replace(/\s+/g, '').toUpperCase()
}

async function bulkLookup(postcodes) {
  if (postcodes.length === 0) return {}
  const res = await fetch('https://api.postcodes.io/postcodes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postcodes }),
  })
  if (!res.ok) return {}
  const data = await res.json()
  const out = {}
  for (const r of data.result || []) {
    const query = normalisePostcode(r.query)
    if (r.result && r.result.latitude) {
      out[query] = { lat: r.result.latitude, lng: r.result.longitude }
    } else {
      out[query] = null
    }
  }
  return out
}

export function useGeocodePostcodes(postcodes) {
  const [coords, setCoords] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const cleaned = [...new Set(postcodes.filter(Boolean).map(normalisePostcode))]
    if (cleaned.length === 0) { setCoords({}); return }

    // Seed from cache
    const seeded = {}
    const missing = []
    for (const p of cleaned) {
      if (memCache.has(p)) seeded[p] = memCache.get(p)
      else missing.push(p)
    }
    setCoords(prev => ({ ...prev, ...seeded }))

    if (missing.length === 0) return

    let cancelled = false
    setLoading(true)
    // postcodes.io supports up to 100 postcodes per bulk call
    const chunks = []
    for (let i = 0; i < missing.length; i += 100) chunks.push(missing.slice(i, i + 100))

    ;(async () => {
      for (const chunk of chunks) {
        try {
          const result = await bulkLookup(chunk)
          if (cancelled) return
          for (const [k, v] of Object.entries(result)) memCache.set(k, v)
          saveCache()
          setCoords(prev => ({ ...prev, ...result }))
        } catch {}
      }
      if (!cancelled) setLoading(false)
    })()

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postcodes.join(',')])

  return {
    coords,
    loading,
    lookup: (pc) => coords[normalisePostcode(pc)] ?? null,
  }
}
