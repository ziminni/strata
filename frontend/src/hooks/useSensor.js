import { useCallback, useEffect, useState } from 'react'

// Simulated field sensor FS-NE-0012 (AWD water tube, soil moisture, soil temp, battery).
// Replace with a real device feed (e.g. a FastAPI ingest endpoint) later.
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
  let s = { water: -6, moist: 41, soilT: 27.2, battery: 3.98, hist: [], running: true, irrigating: false, t: Date.now() - 24 * 3600e3 }
  for (let i = 0; i < 48; i++) s = step(s)
  return s
}

export function useSensor() {
  const [s, setS] = useState(initial)
  useEffect(() => {
    const id = setInterval(() => setS((p) => (p.running ? step(p) : p)), 4000)
    return () => clearInterval(id)
  }, [])
  const irrigate = useCallback(() => setS((p) => ({ ...p, irrigating: true })), [])
  const toggle = useCallback(() => setS((p) => ({ ...p, running: !p.running })), [])
  return { ...s, irrigate, toggle }
}
