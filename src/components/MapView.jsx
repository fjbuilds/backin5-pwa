import { useEffect, useRef, useMemo } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster'
import { useGeocodePostcodes } from '../hooks/useGeocode'
import { getActionColor } from '../lib/actionColors'

function makePinIcon(color) {
  const html = `
    <div style="
      width: 28px; height: 28px;
      background: ${color};
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 3px 10px rgba(0,0,0,0.35);
      border: 2px solid #fff;
      display: flex; align-items: center; justify-content: center;
    ">
      <div style="transform: rotate(45deg); width: 8px; height: 8px; background: #fff; border-radius: 50%;"></div>
    </div>`
  return L.divIcon({
    className: 'bi5-pin',
    html,
    iconSize: [28, 36],
    iconAnchor: [14, 32],
    popupAnchor: [0, -28],
  })
}

export default function MapView({ enquiries, onOpen }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markersLayer = useRef(null)

  const postcodes = useMemo(() => enquiries.map(e => e.postcode).filter(Boolean), [enquiries])
  const { coords, loading } = useGeocodePostcodes(postcodes)

  // Init map once
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return
    const map = L.map(mapRef.current, {
      center: [54.0, -2.5], // rough centre of UK
      zoom: 6,
      zoomControl: true,
      scrollWheelZoom: true,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map)
    markersLayer.current = L.markerClusterGroup({
      maxClusterRadius: 80,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      chunkedLoading: true,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount()
        const size = count < 10 ? 36 : count < 50 ? 44 : 52
        const html = `<div style="
          width:${size}px;height:${size}px;border-radius:50%;
          background:#2C4FC4;color:#fff;
          display:flex;align-items:center;justify-content:center;
          font-weight:800;font-size:${size > 40 ? 16 : 14}px;
          border:3px solid #fff;
          box-shadow:0 4px 14px rgba(0,0,0,0.3);
        ">${count}</div>`
        return L.divIcon({ html, className: 'bi5-cluster', iconSize: [size, size] })
      },
    }).addTo(map)
    mapInstance.current = map
    return () => { map.remove(); mapInstance.current = null }
  }, [])

  // Update markers when data changes
  useEffect(() => {
    if (!mapInstance.current || !markersLayer.current) return
    markersLayer.current.clearLayers()

    const points = []
    for (const e of enquiries) {
      const c = e.postcode && coords[(e.postcode || '').replace(/\s+/g, '').toUpperCase()]
      if (!c) continue
      const color = getActionColor(e.action_tag || e.status || 'Review Details')
      const marker = L.marker([c.lat, c.lng], { icon: makePinIcon(color) })
      const town = e.town || e.area || ''
      const apt = e.appointment_datetime ? `<div style="font-size:11px;color:#2C4FC4;margin-top:4px;">📅 ${e.appointment_datetime}</div>` : ''
      const popup = `
        <div style="font-family:inherit;min-width:170px;">
          <div style="font-weight:700;font-size:14px;margin-bottom:2px;">${e.customer_name || 'Unknown'}</div>
          <div style="font-size:12px;color:#6B7588;">${e.service_requested || ''}</div>
          <div style="font-size:11px;color:#6B7588;margin-top:4px;">${e.postcode || ''}${town ? ' · ' + town : ''}</div>
          ${apt}
          <button data-id="${e.id}" class="bi5-popup-open" style="
            margin-top:8px;width:100%;padding:6px;background:${color};color:#fff;
            border:none;border-radius:6px;font-weight:600;cursor:pointer;font-size:12px;
          ">Open enquiry</button>
        </div>`
      marker.bindPopup(popup)
      marker.on('popupopen', () => {
        setTimeout(() => {
          const btn = document.querySelector(`.bi5-popup-open[data-id="${e.id}"]`)
          if (btn) btn.onclick = () => onOpen(e)
        }, 0)
      })
      markersLayer.current.addLayer(marker)
      points.push([c.lat, c.lng])
    }

    if (points.length > 0) {
      const bounds = L.latLngBounds(points)
      mapInstance.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 })
    }
  }, [enquiries, coords, onOpen])

  const mappedCount = enquiries.filter(e => coords[(e.postcode || '').replace(/\s+/g, '').toUpperCase()]).length
  const missingCount = enquiries.filter(e => e.postcode).length - mappedCount

  return (
    <div className="map-wrap">
      <div ref={mapRef} className="map-canvas" />
      <div className="map-info">
        {loading
          ? `Loading locations... ${mappedCount} pinned`
          : `${mappedCount} pinned${missingCount > 0 ? ` · ${missingCount} couldn't be located` : ''}`}
      </div>
    </div>
  )
}
