// Crop-calendar helpers. `segs` come from GET /api/season with start/end parsed to Dates.
import { addDays, dayDiff } from './format'
import { localized } from './i18n'

export const PHASE_LEGEND = localized([
  ['Land prep', '#b08968'], ['Planting', '#6aa84f'], ['Growing', '#7fb069'],
  ['Flowering', '#e0a526'], ['Ripening', '#c98a14'], ['Harvest', '#a0522d'],
])

export function phaseOf(crop, k, days) {
  const f = k / days
  if (crop === 'sesbania') return f < 0.85 ? ['Growing', '#8fbf5a'] : ['Plow in', '#5e8a32']
  if (f < 0.12) return ['Planting', '#6aa84f']
  if (f < 0.55) return ['Growing', '#7fb069']
  if (f < 0.75) return ['Flowering', '#e0a526']
  if (f < 0.92) return ['Ripening', '#c98a14']
  return ['Harvest', '#a0522d']
}

export function stateOn(segs, crops, date) {
  const d0 = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  for (const s of segs) {
    if (d0 >= s.start && d0 < s.end) {
      const k = dayDiff(d0, s.start)
      const [phase, color] = phaseOf(s.crop, k, crops[s.crop].days)
      return { seg: s, day: k + 1, phase, color }
    }
    if (d0 >= addDays(s.start, -14) && d0 < s.start) {
      return { seg: s, prep: true, phase: 'Land prep', color: '#b08968', day: dayDiff(s.start, d0) }
    }
  }
  return null
}

export const isRice = (st) => !!(st && !st.prep && ['rice', 'awd'].includes(st.seg.crop))

/** Upcoming field tasks as {d, kind, crop}; render with taskText(). */
export function upcoming(segs, crops, from, days) {
  const end = addDays(from, days)
  const out = []
  for (const s of segs) {
    const c = crops[s.crop]
    const ev = [[addDays(s.start, -14), 'prep'], [s.start, 'plant']]
    if (s.crop === 'rice' || s.crop === 'awd') ev.push([addDays(s.start, 14), 'fert1'], [addDays(s.start, 45), 'topdress'])
    if (s.crop === 'sesbania') ev.push([addDays(s.start, 40), 'plowin'])
    else ev.push([addDays(s.start, Math.round(c.days * 0.55)), 'flower'], [addDays(s.start, Math.round(c.days * 0.92)), 'harvest'])
    for (const [d, kind] of ev) if (d >= from && d <= end) out.push({ d, kind, crop: s.crop })
  }
  return out.sort((a, b) => a.d - b.d)
}

export function taskText({ kind, crop }, crops, lang = 'en') {
  const c = crops[crop].fil
  const fil = lang === 'fil'
  switch (kind) {
    case 'prep': return fil ? `Simulan ang paghahanda ng lupa para sa ${c}` : `Start land preparation for ${c}`
    case 'plant':
      return fil
        ? `Magtanim ng ${c}` + (crop === 'monggo' ? ' (1–2 linggo pagkatapos ng ani)' : '')
        : `Plant ${c}` + (crop === 'monggo' ? ' (within 1–2 weeks of rice harvest)' : '')
    case 'fert1': return fil ? 'Unang abono (mga 14 araw matapos magtanim)' : '1st fertilizer application (about 14 days after planting)'
    case 'topdress': return fil ? 'Ikalawang abono' : 'Topdress at panicle initiation'
    case 'plowin': return fil ? 'Araruhin ang sesbania sa lupa bilang pataba' : 'Plow sesbania into the soil (green manure)'
    case 'flower': return fil ? `Mamumulaklak ang ${c}: bantayan ang tubig at init` : `${c} starts flowering: watch water and heat`
    case 'harvest': return fil ? `Simula ng anihan ng ${c}` : `${c} harvest window opens`
    default: return ''
  }
}

/** One-line description of the season for the AI adviser. */
export function seasonSummary(st, crops) {
  if (!st) return 'fallow'
  const c = crops[st.seg.crop]
  return st.prep ? `land prep for ${c.en}` : `${c.en}, day ${st.day} of ${c.days}, ${st.phase}`
}
