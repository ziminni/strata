// "Runoff lock": don't apply fertilizer right before heavy rain — it washes off the field (wasted money, polluted canals).
import { addDays, DAYS } from './format'
import { wxDay } from './weather'

const heavy = (w) => w.k === 'storm' || (w.k === 'rain' && w.chance >= 70)
const wet = (w) => w.k === 'storm' || w.k === 'rain'

export const dayName = (d, base) => {
  const n = Math.round((d - base) / 864e5)
  return n === 0 ? 'today' : n === 1 ? 'tomorrow' : DAYS[d.getDay()]
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
    return { level: 'hold', rain: days[h], safe, rainName: dayName(days[h].d, base), safeName: dayName(safe.d, base), mm: Math.round(15 + days[h].chance / 2) }
  }
  const l = days.slice(0, 2).findIndex(wet)
  if (l >= 0) {
    const dry = days.find((w, i) => i > l && !wet(w)) || days[l + 1]
    return { level: 'care', rain: days[l], safe: dry, rainName: dayName(days[l].d, base), safeName: dayName(dry.d, base) }
  }
  return { level: 'ok', until: dayName(days[2].d, base) }
}
