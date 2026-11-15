// Distance + nearest supported province for GPS-picked field locations.
export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const rad = Math.PI / 180
  const dLat = (lat2 - lat1) * rad
  const dLon = (lon2 - lon1) * rad
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** provinces = meta.provinces ({ name: { lat, lon, mun } }) → [name, km] */
export function nearestProvince(provinces, lat, lon) {
  let best = null
  for (const [name, p] of Object.entries(provinces)) {
    const d = haversineKm(lat, lon, p.lat, p.lon)
    if (!best || d < best[1]) best = [name, d]
  }
  return best
}

export const getPosition = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('unsupported'))
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 })
  })
