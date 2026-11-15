// "Runoff lock": don't apply fertilizer right before heavy rain — it washes off the field (wasted money, polluted canals).
import { addDays, DAYS } from './format'
import { tr } from './i18n'
import { wxDay } from './weather'

// Based on the forecast rain AMOUNT (Open-Meteo daily precipitation, mm), not just "a rain icon":
// ≥ 20 mm in a day washes urea off the field → hold; ≥ 5 mm → fertilize with care; drizzle is fine.
export const HEAVY_MM = 20
export const WET_MM = 5
const HEAVY_CHANCE = 50
const WET_CHANCE = 40
const live = (w) => w.live && w.mm != null
// without a live forecast (offline / beyond 16 days) fall back to the climatology sky type
const heavy = (w) => (live(w) ? w.mm >= HEAVY_MM && w.chance >= HEAVY_CHANCE : w.k === 'storm' || (w.k === 'rain' && w.chance >= 70))
const wet = (w) => (live(w) ? w.mm >= WET_MM && w.chance >= WET_CHANCE : w.k === 'storm' || w.k === 'rain')

export const dayName = (d, base) => {
  const n = Math.round((d - base) / 864e5)
  return n === 0 ? tr('today') : n === 1 ? tr('tomorrow') : DAYS[d.getDay()]
}

/** Look 3 days ahead. Returns {level: 'hold'|'care'|'ok', ...}. */
export function fertilizerAdvice(prov, clim, from = new Date()) {
  const base = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const days = [0, 1, 2, 3, 4, 5, 6].map((i) => wxDay(prov, clim, addDays(base, i)))
  const h = days.slice(0, 3).findIndex(heavy)
  if (h >= 0) {
    let j = h + 1
    while (j < days.length && wet(days[j])) j++
    const safe = days[Math.min(j, days.length - 1)]
    return { level: 'hold', rain: days[h], safe, rainName: dayName(days[h].d, base), safeName: dayName(safe.d, base), mm: live(days[h]) ? Math.round(days[h].mm) : null }
  }
  const l = days.slice(0, 2).findIndex(wet)
  if (l >= 0) {
    const dry = days.find((w, i) => i > l && !wet(w)) || days[l + 1]
    return { level: 'care', rain: days[l], safe: dry, rainName: dayName(days[l].d, base), safeName: dayName(dry.d, base), mm: live(days[l]) ? Math.round(days[l].mm) : null }
  }
  return { level: 'ok', until: dayName(days[2].d, base) }
}
