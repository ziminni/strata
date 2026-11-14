import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Simple green pin (an inline SVG, so no marker image assets are needed).
const PIN = L.divIcon({
  className: '',
  iconSize: [30, 40],
  iconAnchor: [15, 39],
  html: `<svg width="30" height="40" viewBox="0 0 30 40" aria-hidden="true">
    <path d="M15 1C7.3 1 1 7.2 1 14.9 1 25.3 15 39 15 39s14-13.7 14-24.1C29 7.2 22.7 1 15 1z" fill="#2f8a3e" stroke="#fff" stroke-width="2"/>
    <circle cx="15" cy="15" r="5" fill="#fff"/></svg>`,
})

/**
 * Field location map (OpenStreetMap). Tap the map or drag the pin to set the exact field spot.
 * `lat`/`lon` = the pin (null = no pin yet); `center` = [lat, lon] to show when there's no pin (e.g. the province).
 */
export default function LocationMap({ lat, lon, center, onPick }) {
  const el = useRef(null)
  const map = useRef(null)
  const marker = useRef(null)
  const pick = useRef(onPick)
  useEffect(() => {
    pick.current = onPick
  }, [onPick])

  // create once
  useEffect(() => {
    const m = L.map(el.current, { zoomControl: true, attributionControl: true }).setView(center, 10)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(m)
    m.on('click', (e) => pick.current(e.latlng.lat, e.latlng.lng))
    map.current = m
    // the sheet animates in; re-measure once it has its final size
    const t = setTimeout(() => m.invalidateSize(), 250)
    return () => {
      clearTimeout(t)
      m.remove()
      map.current = null
      marker.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // keep the pin in sync
  useEffect(() => {
    const m = map.current
    if (!m) return
    if (lat == null || lon == null) {
      marker.current?.remove()
      marker.current = null
      return
    }
    if (!marker.current) {
      marker.current = L.marker([lat, lon], { icon: PIN, draggable: true, keyboard: false }).addTo(m)
      marker.current.on('dragend', (e) => {
        const p = e.target.getLatLng()
        pick.current(p.lat, p.lng)
      })
    } else marker.current.setLatLng([lat, lon])
    m.setView([lat, lon], Math.max(m.getZoom(), 14))
  }, [lat, lon])

  // no pin: follow the chosen province
  const [cLat, cLon] = center
  useEffect(() => {
    if (map.current && (lat == null || lon == null)) map.current.setView([cLat, cLon], 10)
  }, [cLat, cLon, lat, lon])

  return (
    <div className="relative z-0 overflow-hidden rounded-2xl ring-1 ring-line">
      <div ref={el} className="h-[220px] w-full" role="application" aria-label="Map: tap to set your field location" />
    </div>
  )
}
