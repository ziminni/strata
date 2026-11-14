// Pick the best day in the coming week to plant, from the (prototype) daily forecast.
// Good sowing day: soil already moist (rain the day before, or a wet sensor reading),
// no rain on the day itself, and no heavy rain right after (seeds wash out), not extreme heat.
import { addDays, fmtD } from './format'
import { wxDay } from './weather'

const WET = new Set(['rain', 'storm'])

export function plantingOutlook(prov, clim, moist, days = 7, from = new Date()) {
  const base = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const scored = []
  for (let i = 1; i <= days; i++) {
    const d = addDays(base, i)
    const w = wxDay(prov, clim, d)
    const prev = wxDay(prov, clim, addDays(d, -1))
    const next = wxDay(prov, clim, addDays(d, 1))
    let score = 100
    if (w.k === 'storm') score -= 60
    else if (w.k === 'rain') score -= 25
    if (next.k === 'storm') score -= 35
    else if (next.k === 'rain') score -= 15
    if (WET.has(prev.k)) score += 10
    else if (moist < 35) score -= 10
    if (w.hi >= 35) score -= 15
    scored.push({ d, w, prev, next, score })
  }
  const best = scored.reduce((a, b) => (b.score > a.score ? b : a))
  return { ...best, days: scored }
}

/** Short "why this day" sentence parts. */
export function dayReasons({ prev, next, w, d }, moist) {
  const out = []
  if (WET.has(prev.k)) out.push(`Rain on ${fmtD(addDays(d, -1))} leaves the soil moist for sowing.`)
  else if (moist >= 40) out.push(`Your soil is still moist enough for sowing (${moist}%).`)
  else out.push(`Soil is dry (${moist}%), so water the field the day before.`)
  if (!WET.has(w.k) && !WET.has(next.k)) out.push('No rain is expected that day or the next, so the seeds won’t wash away.')
  else if (WET.has(next.k)) out.push('Some rain follows the next day. Plant early in the morning.')
  if (w.hi >= 35) out.push(`It will be hot (${w.hi}°). Plant late in the afternoon.`)
  return out
}

/** Tier for the 7-day strip. */
export const dayTier = (score) => (score >= 90 ? 'good' : score >= 70 ? 'ok' : 'poor')
