// Weather forecast. Real data from Open-Meteo (https://open-meteo.com, free, no key) once loadForecast() has run;
// until then — or offline, or beyond the 16-day forecast window — it falls back to a deterministic
// forecast generated from the province's NASA POWER climatology.
import { addDays, ymd } from './format'
import { localized } from './i18n'

/* ---------------- live forecast (Open-Meteo) ---------------- */

const LIVE = new Map() // prov → { daily: Map(ymd → day), hourly: Map('ymdTHH' → {temp, k}), current, sun: Map(ymd → {rise, set}) }

// WMO weather code → our sky keys
function wmoKey(code) {
  if (code >= 95) return 'storm'
  if ([65, 67, 82].includes(code)) return 'storm'
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain'
  if (code >= 71 && code <= 86) return 'rain'
  if (code === 3 || code === 45 || code === 48) return 'cloud'
  if (code === 2) return 'partly'
  return 'sun' // 0, 1
}
const nightKey = (k) => (k === 'sun' ? 'moon' : k === 'partly' ? 'cmoon' : k)
const hourOf = (iso) => { const [h, m] = iso.slice(11, 16).split(':').map(Number); return h + m / 60 }

/** Fetch the real forecast for a province (lat/lon = where to read it). Resolves true when live data is in. */
export async function loadForecast(prov, lat, lon) {
  const qs = new URLSearchParams({
    latitude: lat, longitude: lon, timezone: 'Asia/Manila', forecast_days: 16, past_days: 1,
    current: 'temperature_2m,weather_code,is_day',
    hourly: 'temperature_2m,weather_code,is_day',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_gusts_10m_max,sunrise,sunset',
  })
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${qs}`)
  if (!res.ok) throw new Error(`Weather ${res.status}`)
  const j = await res.json()
  const daily = new Map(), sun = new Map(), hourly = new Map()
  j.daily.time.forEach((t, i) => {
    const k = wmoKey(j.daily.weather_code[i])
    const chance = j.daily.precipitation_probability_max[i] ?? (k === 'rain' || k === 'storm' ? 70 : 10)
    daily.set(t, {
      d: new Date(`${t}T00:00`), hi: Math.round(j.daily.temperature_2m_max[i]), lo: Math.round(j.daily.temperature_2m_min[i]),
      chance: Math.round(chance / 5) * 5, k, txt: TXT[k], gust: Math.round(j.daily.wind_gusts_10m_max[i] ?? 0),
      mm: j.daily.precipitation_sum[i], live: true,
    })
    sun.set(t, { rise: hourOf(j.daily.sunrise[i]), set: hourOf(j.daily.sunset[i]) })
  })
  j.hourly.time.forEach((t, i) => {
    const k = wmoKey(j.hourly.weather_code[i])
    hourly.set(t.slice(0, 13), { temp: j.hourly.temperature_2m[i], k: j.hourly.is_day[i] ? k : nightKey(k) })
  })
  const ck = wmoKey(j.current.weather_code)
  const current = { temp: j.current.temperature_2m, k: j.current.is_day ? ck : nightKey(ck) }
  LIVE.set(prov, { daily, hourly, current, sun, at: Date.now() })
  return true
}

export const hasLiveForecast = (prov) => LIVE.has(prov)

export function rng(seed) {
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

const TXT = { storm: 'Heavy rain', rain: 'Rain', cloud: 'Cloudy', partly: 'Partly cloudy', sun: 'Sunny' } // English; shown via tr()
export const NOW_TXT = localized({ sun: 'Sunny', moon: 'Clear', cmoon: 'Partly cloudy', partly: 'Partly cloudy', cloud: 'Cloudy', rain: 'Raining', storm: 'Heavy rain' })
export const SKY_CLASS = { sun: 'sky-sun', moon: 'sky-night', cmoon: 'sky-night', partly: 'sky-partly', cloud: 'sky-cloud', rain: 'sky-rain', storm: 'sky-rain' }

/** clim = {T, X, P} monthly series for "now". */
export function wxDay(prov, clim, d) {
  const live = LIVE.get(prov)?.daily.get(ymd(d))
  if (live) return { ...live, d }
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
  const L = LIVE.get(prov)
  if (L && L.daily.has(ymd(now))) return liveForecast(L, prov, clim, lat, lon, now)
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

/** Same shape as forecast(), built from the real Open-Meteo hourly data. */
function liveForecast(L, prov, clim, lat, lon, now) {
  const today = wxDay(prov, clim, now)
  const h = now.getHours() + now.getMinutes() / 60
  const st = L.sun.get(ymd(now)) || sunTimes(lat, lon, now)
  const stNext = L.sun.get(ymd(addDays(now, 1))) || st
  const key = (H) => `${ymd(addDays(now, Math.floor(H / 24)))}T${String(H % 24).padStart(2, '0')}`
  const nowHr = L.hourly.get(key(Math.floor(h)))
  const cur = Math.round(L.current?.temp ?? nowHr?.temp ?? tempAt(today, h))
  const kNow = L.current?.k ?? nowHr?.k ?? iconAt(today, h, st)
  const hours = [{ lab: 'Now', k: kNow, v: cur + '°' }]
  for (let i = 1; i <= 11; i++) {
    const H = Math.floor(h) + i
    const o = L.hourly.get(key(H))
    const day = H >= 24 ? wxDay(prov, clim, addDays(now, 1)) : today
    hours.push({ lab: fmtH(H % 24), k: o ? o.k : iconAt(day, H % 24, st), v: Math.round(o ? o.temp : tempAt(day, H % 24)) + '°', at: H })
  }
  for (const [x, lab, k] of [[st.set, 'Sunset', 'sunset'], [stNext.rise + 24, 'Sunrise', 'sunrise']]) {
    if (x > h && x < Math.floor(h) + 12) {
      const i = hours.findIndex((o) => o.at > x)
      hours.splice(i < 0 ? hours.length : i, 0, { lab: fmtH(x % 24), k, v: lab, ev: true })
    }
  }
  const days = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (i ? wxDay(prov, clim, addDays(now, i)) : today))
  return { today, h, cur, kNow, hours, days, live: true }
}
