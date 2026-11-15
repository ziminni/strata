// Prototype forecast generated deterministically from the province's NASA POWER climatology.
// Swap for a PAGASA forecast feed in production.
import { addDays, ymd } from './format'

function rng(seed) {
  let h = 2166136261
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return (h >>> 0) / 4294967296
  }
}

export function sunTimes(lat, lon, d) {
  const rad = Math.PI / 180
  const n = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5)
  const g = ((2 * Math.PI) / 365) * (n - 1)
  const eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g))
  const dec = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g)
  const ha = Math.acos(Math.cos(90.833 * rad) / (Math.cos(lat * rad) * Math.cos(dec)) - Math.tan(lat * rad) * Math.tan(dec)) / rad
  const noon = 720 - 4 * lon - eq + 480 // PH time (UTC+8)
  return { rise: (noon - 4 * ha) / 60, set: (noon + 4 * ha) / 60 }
}

const TXT = { storm: 'Heavy rain', rain: 'Rain', cloud: 'Cloudy', partly: 'Partly cloudy', sun: 'Sunny' }
export const NOW_TXT = { sun: 'Sunny', moon: 'Clear', cmoon: 'Partly cloudy', partly: 'Partly cloudy', cloud: 'Cloudy', rain: 'Raining', storm: 'Heavy rain' }
export const SKY_CLASS = { sun: 'sky-sun', moon: 'sky-night', cmoon: 'sky-night', partly: 'sky-partly', cloud: 'sky-cloud', rain: 'sky-rain', storm: 'sky-rain' }

/** clim = {T, X, P} monthly series for "now". */
export function wxDay(prov, clim, d) {
  const m = d.getMonth()
  const r = rng(prov + ymd(d))
  const P = clim.P[m], X = clim.X[m], T = clim.T[m]
  const pr = Math.min(0.92, 0.08 + P / 430)
  const wet = r() < pr
  const heavy = wet && r() < Math.min(0.5, P / 900)
  const cl = r()
  const cloudy = !wet && cl < 0.35 + pr * 0.4
  const overcast = cloudy && cl < 0.18 + pr * 0.25
  const hi = Math.round(X + (r() - 0.5) * 2.2 - (wet ? 1.6 : 0) - (heavy ? 1 : 0) - (overcast ? 1 : 0))
  const lo = Math.round(2 * T - X + (r() - 0.5) * 1.4 + (wet ? 0.4 : 0))
  const chance = Math.round(Math.min(95, Math.max(5, wet ? 55 + r() * 35 : pr * 60 * r())) / 5) * 5
  const k = heavy ? 'storm' : wet ? 'rain' : overcast ? 'cloud' : cloudy ? 'partly' : 'sun'
  return { d, hi, lo, chance, k, txt: TXT[k], gust: Math.round(10 + r() * 12 + (wet ? 8 : 0)) }
}

export function tempAt(t, h) {
  const f = h < 6 ? 0 : h < 14.5 ? (h - 6) / 8.5 : Math.max(0, 1 - (h - 14.5) / 15.5)
  return t.lo + (t.hi - t.lo) * Math.sin((f * Math.PI) / 2)
}

export function iconAt(t, h, st) {
  const night = h < st.rise || h >= st.set
  let k = t.k
  if ((k === 'rain' || k === 'storm') && !(h >= 13 && h < 21)) k = 'cloud'
  if (night && k === 'sun') k = 'moon'
  if (night && k === 'partly') k = 'cmoon'
  return k
}

export function fmtH(h) {
  const H = Math.floor(h) % 24, M = Math.round((h % 1) * 60)
  const ap = H < 12 ? 'AM' : 'PM', h12 = H % 12 || 12
  return M ? `${h12}:${String(M).padStart(2, '0')}${ap}` : `${h12}${ap}`
}

export function forecast(prov, clim, lat, lon, now = new Date()) {
  const today = wxDay(prov, clim, now)
  const h = now.getHours() + now.getMinutes() / 60
  const st = sunTimes(lat, lon, now)
  const cur = Math.round(tempAt(today, h))
  const kNow = iconAt(today, h, st)
  const hours = [{ lab: 'Now', k: kNow, v: cur + '°' }]
  for (let i = 1; i <= 11; i++) {
    const H = Math.floor(h) + i
    const day = H >= 24 ? wxDay(prov, clim, addDays(now, 1)) : today
    const hh = H % 24
    hours.push({ lab: fmtH(hh), k: iconAt(day, hh, st), v: Math.round(tempAt(day, hh)) + '°', at: H })
  }
  for (const [x, lab, k] of [[st.set, 'Sunset', 'sunset'], [st.rise + 24, 'Sunrise', 'sunrise']]) {
    if (x > h && x < Math.floor(h) + 12) {
      const i = hours.findIndex((o) => o.at > x)
      hours.splice(i < 0 ? hours.length : i, 0, { lab: fmtH(x % 24), k, v: lab, ev: true })
    }
  }
  const days = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (i ? wxDay(prov, clim, addDays(now, i)) : today))
  return { today, h, cur, kNow, hours, days }
}
