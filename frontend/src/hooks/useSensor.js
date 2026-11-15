import { useCallback, useEffect, useRef, useState } from 'react'

// Field sensor feed. Reads the real device API (proxied by Vite at /sensor → the devtunnel, see vite.config.js):
//   GET /v1/readings/latest?device_id=        → current values (polled)
//   GET /v1/readings?device_id=&limit=48      → recent history for charts, newest first
//   GET /v1/devices/{device_id}/status        → online / last seen / battery
//   GET /v1/alerts?device_id=&active=true     → active alerts (e.g. AWD_IRRIGATE_NOW)
// If the API can't be reached, it falls back to the simulated device below so the app keeps working.
// The return shape is the same in both modes: { water, moist, soilT, battery, hist, running, irrigate, toggle, ... }.

const SENSOR_API = import.meta.env.VITE_SENSOR_API || '/sensor'
const DEVICE_ID = import.meta.env.VITE_SENSOR_DEVICE_ID || 'FS-NE-0012'
const LATEST_MS = 30e3
const HISTORY_MS = 5 * 60e3
const STATUS_MS = 60e3

/* ---------------- live API ---------------- */

async function getJson(path) {
  const res = await fetch(`${SENSOR_API}${path}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Sensor API ${res.status}`)
  return res.json()
}

const q = (params) => new URLSearchParams(params).toString()

/** First finite number found under any of `keys` (also looks one level into nested objects like `values`). */
function pick(obj, keys) {
  if (!obj || typeof obj !== 'object') return undefined
  for (const k of keys) {
    const v = obj[k]
    if (v != null && v !== '' && Number.isFinite(Number(v))) return Number(v)
  }
  for (const nest of ['values', 'data', 'reading', 'metrics', 'payload']) {
    if (obj[nest] && typeof obj[nest] === 'object' && !Array.isArray(obj[nest])) {
      const v = pick(obj[nest], keys)
      if (v !== undefined) return v
    }
  }
  return undefined
}

/** Unwrap `{ data: … }` / `{ reading: … }` / `{ readings: [...] }` / `[...]` style responses. */
function unwrapOne(res) {
  if (Array.isArray(res)) return res[0]
  return res?.reading ?? res?.data ?? res?.latest ?? res
}
function unwrapList(res) {
  if (Array.isArray(res)) return res
  for (const k of ['readings', 'data', 'items', 'results', 'alerts', 'active']) if (Array.isArray(res?.[k])) return res[k]
  return []
}

const KEYS = {
  water: ['water_level_cm', 'water_level', 'water_cm', 'awd_level_cm', 'water'],
  moist: ['soil_moisture_pct', 'soil_moisture', 'moisture_pct', 'moisture', 'vwc'],
  soilT: ['soil_temp_c', 'soil_temperature_c', 'soil_temperature', 'soil_temp', 'temp_c'],
  battery: ['battery_v', 'battery_voltage', 'battery_volts', 'battery', 'vbat'],
}

function readingTime(r) {
  const t = r?.ts ?? r?.timestamp ?? r?.time ?? r?.recorded_at ?? r?.created_at ?? r?.measured_at
  const ms = t != null ? new Date(typeof t === 'number' && t < 1e12 ? t * 1000 : t).getTime() : NaN
  return Number.isFinite(ms) ? ms : null
}

function mapReading(r) {
  return {
    water: pick(r, KEYS.water),
    moist: pick(r, KEYS.moist),
    soilT: pick(r, KEYS.soilT),
    battery: pick(r, KEYS.battery),
    t: readingTime(r),
  }
}

/** Only overwrite fields the API actually returned, so a partial reading never blanks a tile. */
function merge(prev, next) {
  const out = { ...prev }
  for (const [k, v] of Object.entries(next)) if (v !== undefined && v !== null) out[k] = v
  return out
}

/* ---------------- simulated fallback ---------------- */

const STEP_MS = 30 * 60e3

function step(s) {
  const h = new Date(s.t).getHours()
  const diur = Math.sin(((h - 9) / 24) * 2 * Math.PI)
  let loss = 0.32 + Math.max(0, diur) * 0.25
  if (s.water < 0) loss *= 0.7
  if (s.water < -15) loss *= 0.5
  let { water, irrigating } = s
  if (irrigating) {
    water += 2.4
    if (water >= 5) irrigating = false
  }
  water = Math.max(-25, Math.min(10, water - loss))
  const moist = water >= 0 ? 47 + Math.random() : Math.max(14, 48 + water * 1.05 + (Math.random() - 0.5))
  const soilT = 26.2 + 1.6 * Math.sin(((h - 12) / 24) * 2 * Math.PI) + (Math.random() - 0.5) * 0.2
  const battery = Math.max(3.4, Math.min(4.15, s.battery + (h > 7 && h < 17 ? 0.006 : -0.003)))
  const t = s.t + STEP_MS
  const hist = [...s.hist, { t, w: water }].slice(-48)
  return { ...s, water, irrigating, moist, soilT, battery, t, hist }
}

function initial() {
  let s = {
    water: -6, moist: 41, soilT: 27.2, battery: 3.98, hist: [], running: true, irrigating: false, t: Date.now() - 24 * 3600e3,
    source: 'sim', deviceId: DEVICE_ID, online: null, lastSeen: null, alerts: [], status: null,
  }
  for (let i = 0; i < 48; i++) s = step(s)
  return s
}

/* ---------------- hook ---------------- */

export function useSensor() {
  const [s, setS] = useState(initial)
  const live = useRef(false) // true once the real API has answered
  const running = useRef(true)
  useEffect(() => {
    running.current = s.running
  }, [s.running])

  // Real device: latest reading, history, status and alerts.
  useEffect(() => {
    let alive = true
    const dev = encodeURIComponent(DEVICE_ID)

    const loadLatest = async () => {
      if (!running.current) return
      try {
        const r = mapReading(unwrapOne(await getJson(`/v1/readings/latest?${q({ device_id: DEVICE_ID })}`)))
        if (!alive) return
        live.current = true
        setS((p) => merge({ ...p, source: 'live' }, { water: r.water, moist: r.moist, soilT: r.soilT, battery: r.battery, t: r.t ?? Date.now(), lastSeen: r.t ?? p.lastSeen }))
      } catch (e) {
        if (alive && !live.current) console.warn('[sensor] live API unavailable, using simulated sensor:', e.message)
      }
    }

    const loadHistory = async () => {
      try {
        const rows = unwrapList(await getJson(`/v1/readings?${q({ device_id: DEVICE_ID, limit: 48 })}`))
        const hist = rows
          .map(mapReading)
          .filter((r) => r.t != null && r.water !== undefined)
          .sort((a, b) => a.t - b.t) // API is newest first; charts want oldest → newest
          .map((r) => ({ t: r.t, w: r.water }))
        if (alive && hist.length) setS((p) => ({ ...p, hist }))
      } catch { /* keep current history */ }
    }

    const loadStatus = async () => {
      try {
        const st = unwrapOne(await getJson(`/v1/devices/${dev}/status`))
        if (!alive || !st) return
        const seen = st.last_seen ?? st.lastSeen ?? st.last_seen_at
        const online = typeof st.online === 'boolean' ? st.online : typeof st.status === 'string' ? /online/i.test(st.status) : null
        setS((p) => merge(p, {
          status: st,
          online,
          lastSeen: seen ? new Date(seen).getTime() || p.lastSeen : undefined,
          battery: pick(st, KEYS.battery),
        }))
      } catch { /* status is optional */ }
    }

    const loadAlerts = async () => {
      try {
        const alerts = unwrapList(await getJson(`/v1/alerts?${q({ device_id: DEVICE_ID, active: true })}`))
        if (alive) setS((p) => ({ ...p, alerts }))
      } catch { /* alerts are optional */ }
    }

    loadLatest().then(() => {
      if (!live.current) return
      loadHistory()
      loadStatus()
      loadAlerts()
    })
    const ids = [
      setInterval(loadLatest, LATEST_MS),
      setInterval(() => live.current && (loadStatus(), loadAlerts()), STATUS_MS),
      setInterval(() => live.current && loadHistory(), HISTORY_MS),
    ]
    return () => {
      alive = false
      ids.forEach(clearInterval)
    }
  }, [])

  // Simulated device: only ticks while the live API hasn't answered.
  useEffect(() => {
    const id = setInterval(() => setS((p) => (p.running && !live.current ? step(p) : p)), 4000)
    return () => clearInterval(id)
  }, [])

  // Irrigation is a simulation-only control; the real device has no write endpoint.
  const irrigate = useCallback(() => setS((p) => (live.current ? p : { ...p, irrigating: true })), [])
  const toggle = useCallback(() => setS((p) => ({ ...p, running: !p.running })), [])
  return { ...s, irrigate, toggle }
}
